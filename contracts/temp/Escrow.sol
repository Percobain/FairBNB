// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Add the interface at the top
interface IDisputeDAO {
    function createDispute(
        uint256 agreementId,
        address raisedBy,
        string memory evidenceURI
    ) external returns (uint256);
}

/**
 * @title Escrow
 * @author FairBNB Team
 * @notice Handles rental agreements, holds funds, and manages NFT transfers
 * @dev Integrates with RentalNFT and DisputeDAO contracts
 */
contract Escrow is IERC721Receiver, Ownable, ReentrancyGuard, Pausable {
    
    // Agreement status enum
    enum AgreementStatus {
        None,           // 0: Doesn't exist
        Active,         // 1: Rental is active
        Disputed,       // 2: Under dispute resolution
        Completed,      // 3: Rental completed successfully
        Cancelled       // 4: Cancelled/terminated
    }
    
    // Rental agreement structure
    struct Agreement {
        address landlord;
        address tenant;
        address nftContract;
        uint256 tokenId;
        uint256 rentAmount;
        uint256 depositAmount;
        uint256 disputeFee;
        uint256 totalLocked;
        uint256 startTimestamp;
        uint256 durationMonths;
        uint256 lastRentPaid;
        AgreementStatus status;
        bool landlordWithdrawn;
        bool tenantWithdrawn;
        uint256 disputeId;
    }
    
    // State variables
    uint256 private _agreementIdCounter;
    address public disputeDAO;
    address public rentalNFT;
    uint256 public platformFeePercent = 100; // 1% = 100 basis points
    uint256 public constant MAX_FEE = 1000; // 10% max
    uint256 public accumulatedFees;
    
    // Mappings
    mapping(uint256 => Agreement) public agreements;
    mapping(uint256 => uint256) public tokenToAgreement; // tokenId => agreementId
    mapping(address => uint256[]) public tenantAgreements;
    mapping(address => uint256[]) public landlordAgreements;
    
    // Events
    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed landlord,
        address indexed tenant,
        uint256 tokenId,
        uint256 totalLocked
    );
    
    event RentReleased(
        uint256 indexed agreementId,
        address indexed landlord,
        uint256 amount
    );
    
    event DepositReturned(
        uint256 indexed agreementId,
        address indexed tenant,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed agreementId,
        uint256 indexed disputeId,
        address raisedBy,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed agreementId,
        uint256 indexed disputeId,
        bool tenantWins
    );
    
    event AgreementCompleted(uint256 indexed agreementId);
    
    event AgreementCancelled(uint256 indexed agreementId);
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    event ContractsUpdated(address rentalNFT, address disputeDAO);
    
    // Modifiers
    modifier onlyTenant(uint256 agreementId) {
        require(agreements[agreementId].tenant == msg.sender, "Escrow: Not tenant");
        _;
    }
    
    modifier onlyLandlord(uint256 agreementId) {
        require(agreements[agreementId].landlord == msg.sender, "Escrow: Not landlord");
        _;
    }
    
    modifier onlyParty(uint256 agreementId) {
        require(
            agreements[agreementId].tenant == msg.sender ||
            agreements[agreementId].landlord == msg.sender,
            "Escrow: Not a party"
        );
        _;
    }
    
    modifier onlyDisputeDAO() {
        require(msg.sender == disputeDAO, "Escrow: Only DisputeDAO");
        _;
    }
    
    modifier agreementExists(uint256 agreementId) {
        require(agreements[agreementId].status != AgreementStatus.None, "Escrow: Agreement not found");
        _;
    }
    
    modifier agreementActive(uint256 agreementId) {
        require(agreements[agreementId].status == AgreementStatus.Active, "Escrow: Not active");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        _agreementIdCounter = 1;
    }

    /**
     * @notice Set contract addresses
     * @param _rentalNFT Address of RentalNFT contract
     * @param _disputeDAO Address of DisputeDAO contract
     */
    function setContracts(address _rentalNFT, address _disputeDAO) external onlyOwner {
        require(_rentalNFT != address(0), "Escrow: Invalid NFT address");
        require(_disputeDAO != address(0), "Escrow: Invalid DAO address");
        
        rentalNFT = _rentalNFT;
        disputeDAO = _disputeDAO;
        
        emit ContractsUpdated(_rentalNFT, _disputeDAO);
    }

    // Struct to pass rental parameters (avoids stack too deep)
    struct RentalParams {
        address landlord;
        address nftContract;
        uint256 tokenId;
        uint256 rentAmount;
        uint256 depositAmount;
        uint256 disputeFee;
        uint256 durationMonths;
    }

    /**
     * @notice Create a rental agreement and lock funds
     * @param params Rental parameters struct
     */
    function createAgreement(
        RentalParams calldata params
    ) external payable nonReentrant whenNotPaused {
        // Validate inputs
        _validateRentalParams(params);
        
        // Calculate total amount needed
        uint256 totalRequired = params.rentAmount + params.depositAmount + params.disputeFee;
        require(msg.value == totalRequired, "Escrow: Incorrect payment amount");
        
        // Create agreement ID
        uint256 agreementId = _agreementIdCounter++;
        
        // Store agreement
        _storeAgreement(agreementId, params, msg.value);
        
        // Update mappings
        tokenToAgreement[params.tokenId] = agreementId;
        tenantAgreements[msg.sender].push(agreementId);
        landlordAgreements[params.landlord].push(agreementId);
        
        // Transfer NFT to tenant
        IERC721(params.nftContract).safeTransferFrom(params.landlord, msg.sender, params.tokenId);
        
        emit AgreementCreated(
            agreementId,
            params.landlord,
            msg.sender,
            params.tokenId,
            msg.value
        );
    }
    
    /**
     * @dev Validate rental parameters
     */
    function _validateRentalParams(RentalParams calldata params) private view {
        require(params.nftContract == rentalNFT, "Escrow: Invalid NFT contract");
        require(params.landlord != address(0), "Escrow: Invalid landlord");
        require(params.landlord != msg.sender, "Escrow: Cannot rent to yourself");
        require(params.rentAmount > 0, "Escrow: Invalid rent");
        require(params.depositAmount > 0, "Escrow: Invalid deposit");
        require(params.durationMonths > 0 && params.durationMonths <= 60, "Escrow: Invalid duration");
        
        // Verify NFT ownership
        require(
            IERC721(params.nftContract).ownerOf(params.tokenId) == params.landlord,
            "Escrow: Landlord doesn't own NFT"
        );
    }
    
    /**
     * @dev Store agreement data
     */
    function _storeAgreement(
        uint256 agreementId,
        RentalParams calldata params,
        uint256 totalLocked
    ) private {
        agreements[agreementId] = Agreement({
            landlord: params.landlord,
            tenant: msg.sender,
            nftContract: params.nftContract,
            tokenId: params.tokenId,
            rentAmount: params.rentAmount,
            depositAmount: params.depositAmount,
            disputeFee: params.disputeFee,
            totalLocked: totalLocked,
            startTimestamp: block.timestamp,
            durationMonths: params.durationMonths,
            lastRentPaid: block.timestamp,
            status: AgreementStatus.Active,
            landlordWithdrawn: false,
            tenantWithdrawn: false,
            disputeId: 0
        });
    }

    /**
     * @notice Release rent to landlord (can be called monthly or at end)
     * @param agreementId The agreement ID
     */
    function releaseRentToLandlord(uint256 agreementId) 
        external 
        nonReentrant 
        agreementExists(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        
        // Only landlord or tenant can release rent
        require(
            msg.sender == agreement.landlord || 
            msg.sender == agreement.tenant ||
            msg.sender == owner(),
            "Escrow: Unauthorized"
        );
        
        require(!agreement.landlordWithdrawn, "Escrow: Already withdrawn");
        
        // Calculate platform fee
        uint256 platformFee = (agreement.rentAmount * platformFeePercent) / 10000;
        uint256 landlordAmount = agreement.rentAmount - platformFee;
        
        agreement.landlordWithdrawn = true;
        accumulatedFees += platformFee;
        
        // Transfer rent to landlord
        (bool success, ) = payable(agreement.landlord).call{value: landlordAmount}("");
        require(success, "Escrow: Transfer failed");
        
        emit RentReleased(agreementId, agreement.landlord, landlordAmount);
    }

    /**
     * @notice Return deposit to tenant (at end of rental)
     * @param agreementId The agreement ID
     */
    function returnDepositToTenant(uint256 agreementId)
        external
        nonReentrant
        agreementExists(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        
        // Only landlord or tenant can return deposit
        require(
            msg.sender == agreement.landlord || 
            msg.sender == agreement.tenant ||
            msg.sender == owner(),
            "Escrow: Unauthorized"
        );
        
        require(!agreement.tenantWithdrawn, "Escrow: Already withdrawn");
        
        // Check if rental period is over or landlord approves early return
        if (msg.sender == agreement.tenant) {
            require(
                block.timestamp >= agreement.startTimestamp + (agreement.durationMonths * 30 days),
                "Escrow: Rental period not over"
            );
        }
        
        agreement.tenantWithdrawn = true;
        uint256 returnAmount = agreement.depositAmount + agreement.disputeFee;
        
        // Transfer deposit and dispute fee back to tenant
        (bool success, ) = payable(agreement.tenant).call{value: returnAmount}("");
        require(success, "Escrow: Transfer failed");
        
        emit DepositReturned(agreementId, agreement.tenant, returnAmount);
        
        // Mark as completed if both parties have withdrawn
        if (agreement.landlordWithdrawn && agreement.tenantWithdrawn) {
            agreement.status = AgreementStatus.Completed;
            emit AgreementCompleted(agreementId);
        }
    }

    /**
     * @notice Raise a dispute for an agreement
     * @param agreementId The agreement ID
     * @param reason Reason for dispute (stored on Greenfield)
     */
    function raiseDispute(uint256 agreementId, string memory reason)
        external
        nonReentrant
        agreementExists(agreementId)
        agreementActive(agreementId)
        onlyParty(agreementId)
    {
        require(disputeDAO != address(0), "Escrow: DisputeDAO not set");
        
        Agreement storage agreement = agreements[agreementId];
        agreement.status = AgreementStatus.Disputed;
        
        // Send dispute fees to DisputeDAO (both parties' fees)
        uint256 totalDisputeFees = agreement.disputeFee * 2;
        (bool success, ) = payable(disputeDAO).call{value: totalDisputeFees}("");
        require(success, "Escrow: Fee transfer failed");
        
        // Create dispute in DisputeDAO and get dispute ID
        uint256 disputeId = IDisputeDAO(disputeDAO).createDispute(
            agreementId, 
            msg.sender, 
            reason
        );
        
        agreement.disputeId = disputeId;
        
        emit DisputeRaised(agreementId, disputeId, msg.sender, reason);
    }

    /**
     * @notice Resolve a dispute (called by DisputeDAO)
     * @param agreementId The agreement ID
     * @param tenantWins Whether tenant won the dispute
     */
    function resolveDispute(uint256 agreementId, bool tenantWins)
        external
        nonReentrant
        agreementExists(agreementId)
        onlyDisputeDAO
    {
        Agreement storage agreement = agreements[agreementId];
        require(agreement.status == AgreementStatus.Disputed, "Escrow: Not disputed");
        
        if (tenantWins) {
            // Tenant wins: return rent + deposit to tenant
            uint256 tenantAmount = agreement.rentAmount + agreement.depositAmount;
            
            // Transfer to tenant
            (bool success, ) = payable(agreement.tenant).call{value: tenantAmount}("");
            require(success, "Escrow: Transfer to tenant failed");
            
            // Landlord's dispute fee goes to jurors (handled by DisputeDAO)
            // Tenant gets their dispute fee back
            (bool success2, ) = payable(agreement.tenant).call{value: agreement.disputeFee}("");
            require(success2, "Escrow: Dispute fee return failed");
            
        } else {
            // Landlord wins: landlord gets rent + deposit
            uint256 platformFee = (agreement.rentAmount * platformFeePercent) / 10000;
            uint256 landlordAmount = agreement.rentAmount + agreement.depositAmount - platformFee;
            accumulatedFees += platformFee;
            
            // Transfer to landlord
            (bool success, ) = payable(agreement.landlord).call{value: landlordAmount}("");
            require(success, "Escrow: Transfer to landlord failed");
            
            // Landlord gets their dispute fee back
            (bool success2, ) = payable(agreement.landlord).call{value: agreement.disputeFee}("");
            require(success2, "Escrow: Dispute fee return failed");
            
            // Tenant's dispute fee goes to jurors (handled by DisputeDAO)
        }
        
        agreement.status = AgreementStatus.Completed;
        emit DisputeResolved(agreementId, agreement.disputeId, tenantWins);
        emit AgreementCompleted(agreementId);
    }

    /**
     * @notice Cancel an agreement (only before rental starts or by mutual consent)
     * @param agreementId The agreement ID
     */
    function cancelAgreement(uint256 agreementId)
        external
        nonReentrant
        agreementExists(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        
        // Can only cancel within 24 hours of creation
        require(
            block.timestamp <= agreement.startTimestamp + 1 days,
            "Escrow: Cancellation period over"
        );
        
        // Only tenant can cancel (they lose dispute fee as penalty)
        require(msg.sender == agreement.tenant, "Escrow: Only tenant can cancel");
        
        agreement.status = AgreementStatus.Cancelled;
        
        // Return NFT to landlord
        IERC721(agreement.nftContract).safeTransferFrom(
            agreement.tenant,
            agreement.landlord,
            agreement.tokenId
        );
        
        // Return rent and deposit to tenant (minus dispute fee as penalty)
        uint256 refundAmount = agreement.rentAmount + agreement.depositAmount;
        (bool success, ) = payable(agreement.tenant).call{value: refundAmount}("");
        require(success, "Escrow: Refund failed");
        
        // Dispute fee goes to landlord as compensation
        (bool success2, ) = payable(agreement.landlord).call{value: agreement.disputeFee}("");
        require(success2, "Escrow: Compensation failed");
        
        emit AgreementCancelled(agreementId);
    }

    /**
     * @notice Update platform fee (only owner)
     * @param newFeePercent New fee in basis points (100 = 1%)
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= MAX_FEE, "Escrow: Fee too high");
        uint256 oldFee = platformFeePercent;
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(oldFee, newFeePercent);
    }

    /**
     * @notice Withdraw accumulated platform fees
     * @param to Address to withdraw to
     */
    function withdrawFees(address to) external onlyOwner nonReentrant {
        require(to != address(0), "Escrow: Invalid address");
        uint256 amount = accumulatedFees;
        require(amount > 0, "Escrow: No fees to withdraw");
        
        accumulatedFees = 0;
        
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Escrow: Withdrawal failed");
        
        emit FeesWithdrawn(to, amount);
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get agreement details (for DisputeDAO compatibility)
     * @param agreementId The agreement ID
     */
    function getAgreement(uint256 agreementId) 
        external 
        view 
        returns (
            address landlord,
            address tenant,
            address nftContract,
            uint256 tokenId,
            uint256 rentAmount,
            uint256 depositAmount,
            uint256 disputeFee,
            uint256 totalLocked,
            uint256 startTimestamp,
            uint256 durationMonths,
            uint256 lastRentPaid,
            uint8 status,
            bool landlordWithdrawn,
            bool tenantWithdrawn,
            uint256 disputeId
        ) 
    {
        Agreement memory a = agreements[agreementId];
        return (
            a.landlord,
            a.tenant,
            a.nftContract,
            a.tokenId,
            a.rentAmount,
            a.depositAmount,
            a.disputeFee,
            a.totalLocked,
            a.startTimestamp,
            a.durationMonths,
            a.lastRentPaid,
            uint8(a.status),
            a.landlordWithdrawn,
            a.tenantWithdrawn,
            a.disputeId
        );
    }

    /**
     * @notice Get agreement details (for frontend use)
     * @param agreementId The agreement ID
     */
    function getAgreementDetails(uint256 agreementId) 
        external 
        view 
        returns (Agreement memory) 
    {
        return agreements[agreementId];
    }

    /**
     * @notice Get all agreements for a tenant
     * @param tenant Tenant address
     */
    function getTenantAgreements(address tenant) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return tenantAgreements[tenant];
    }

    /**
     * @notice Get all agreements for a landlord
     * @param landlord Landlord address
     */
    function getLandlordAgreements(address landlord) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return landlordAgreements[landlord];
    }

    /**
     * @notice Get agreement ID by token ID
     * @param tokenId The NFT token ID
     */
    function getAgreementByToken(uint256 tokenId) 
        external 
        view 
        returns (uint256) 
    {
        return tokenToAgreement[tokenId];
    }

    /**
     * @notice Required for receiving NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {}
}