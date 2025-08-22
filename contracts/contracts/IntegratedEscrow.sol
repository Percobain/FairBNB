// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IntegratedEscrow
 * @author FairBNB Team
 * @notice Handles rental agreements, dispute resolution, and juror management in a single contract
 * @dev Combines Escrow and DisputeDAO functionality for simplified architecture
 */
contract IntegratedEscrow is IERC721Receiver, Ownable, ReentrancyGuard, Pausable {
    
    // ============ Enums ============
    
    enum AgreementStatus {
        None,           // 0: Doesn't exist
        Active,         // 1: Rental is active
        Disputed,       // 2: Under dispute resolution
        Completed,      // 3: Rental completed successfully
        Cancelled       // 4: Cancelled/terminated
    }
    
    enum DisputeStatus {
        None,           // 0: Doesn't exist
        Active,         // 1: Voting in progress
        Resolved,       // 2: Voting completed, resolution executed
        Cancelled       // 3: Dispute cancelled
    }
    
    enum Vote {
        None,           // 0: Not voted
        TenantWins,     // 1: Vote for tenant
        LandlordWins    // 2: Vote for landlord
    }
    
    // ============ Structs ============
    
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
    
    struct Juror {
        uint256 stakedAmount;
        uint256 stakedAt;
        bool isActive;
        uint256 disputesAssigned;
        uint256 disputesVoted;
        uint256 correctVotes;
        uint256 totalEarned;
    }
    
    struct Dispute {
        uint256 agreementId;
        address raisedBy;
        address landlord;
        address tenant;
        string evidenceURI;
        uint256 createdAt;
        uint256 votingEndTime;
        DisputeStatus status;
        address[3] assignedJurors;
        mapping(address => Vote) votes;
        uint256 tenantVotes;
        uint256 landlordVotes;
        bool tenantWins;
        uint256 jurorRewardPool;
    }
    
    struct RentalParams {
        address landlord;
        address nftContract;
        uint256 tokenId;
        uint256 rentAmount;
        uint256 depositAmount;
        uint256 disputeFee;
        uint256 durationMonths;
    }
    
    // ============ Constants ============
    
    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant MAX_STAKE = 0.1 ether;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_JURORS = 3;
    uint256 public constant UNSTAKE_DELAY = 7 days;
    uint256 public constant MAX_FEE = 1000; // 10% max
    
    // ============ State Variables ============
    
    // Agreement related
    uint256 private _agreementIdCounter;
    address public rentalNFT;
    uint256 public platformFeePercent = 100; // 1% = 100 basis points
    uint256 public accumulatedFees;
    
    // Dispute related
    uint256 private _disputeIdCounter;
    uint256 public totalStaked;
    uint256 public activeJurorCount;
    
    // ============ Mappings ============
    
    // Agreement mappings
    mapping(uint256 => Agreement) public agreements;
    mapping(uint256 => uint256) public tokenToAgreement;
    mapping(address => uint256[]) public tenantAgreements;
    mapping(address => uint256[]) public landlordAgreements;
    
    // Dispute and juror mappings
    mapping(address => Juror) public jurors;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256[]) public jurorActiveDisputes;
    mapping(uint256 => uint256) public agreementToDispute;
    
    address[] public jurorPool;
    mapping(address => uint256) public jurorPoolIndex;
    
    // ============ Events ============
    
    // Agreement events
    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed landlord,
        address indexed tenant,
        uint256 tokenId,
        uint256 totalLocked
    );
    event RentReleased(uint256 indexed agreementId, address indexed landlord, uint256 amount);
    event DepositReturned(uint256 indexed agreementId, address indexed tenant, uint256 amount);
    event AgreementCompleted(uint256 indexed agreementId);
    event AgreementCancelled(uint256 indexed agreementId);
    
    // Dispute events
    event DisputeRaised(uint256 indexed agreementId, uint256 indexed disputeId, address raisedBy, string reason);
    event DisputeCreated(uint256 indexed disputeId, uint256 indexed agreementId, address indexed raisedBy, address[3] assignedJurors);
    event DisputeResolved(uint256 indexed disputeId, bool tenantWins, uint256 jurorRewards);
    event JurorVoted(uint256 indexed disputeId, address indexed juror, Vote vote);
    event EvidenceSubmitted(uint256 indexed disputeId, address indexed submitter, string evidenceURI);
    
    // Juror events
    event JurorStaked(address indexed juror, uint256 amount);
    event JurorUnstaked(address indexed juror, uint256 amount);
    event JurorRewarded(address indexed juror, uint256 indexed disputeId, uint256 amount);
    
    // Admin events
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event RentalNFTUpdated(address indexed newAddress);
    
    // ============ Modifiers ============
    
    modifier onlyTenant(uint256 agreementId) {
        require(agreements[agreementId].tenant == msg.sender, "Not tenant");
        _;
    }
    
    modifier onlyLandlord(uint256 agreementId) {
        require(agreements[agreementId].landlord == msg.sender, "Not landlord");
        _;
    }
    
    modifier onlyParty(uint256 agreementId) {
        require(
            agreements[agreementId].tenant == msg.sender ||
            agreements[agreementId].landlord == msg.sender,
            "Not a party"
        );
        _;
    }
    
    modifier agreementExists(uint256 agreementId) {
        require(agreements[agreementId].status != AgreementStatus.None, "Agreement not found");
        _;
    }
    
    modifier agreementActive(uint256 agreementId) {
        require(agreements[agreementId].status == AgreementStatus.Active, "Not active");
        _;
    }
    
    modifier disputeExists(uint256 disputeId) {
        require(disputes[disputeId].status != DisputeStatus.None, "Dispute not found");
        _;
    }
    
    modifier disputeActive(uint256 disputeId) {
        require(disputes[disputeId].status == DisputeStatus.Active, "Dispute not active");
        _;
    }
    
    modifier onlyActiveJuror() {
        require(jurors[msg.sender].isActive, "Not active juror");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        _agreementIdCounter = 1;
        _disputeIdCounter = 1;
    }
    
    // ============ Agreement Functions ============
    
    /**
     * @notice Set rental NFT contract address
     * @param _rentalNFT Address of RentalNFT contract
     */
    function setRentalNFT(address _rentalNFT) external onlyOwner {
        require(_rentalNFT != address(0), "Invalid address");
        rentalNFT = _rentalNFT;
        emit RentalNFTUpdated(_rentalNFT);
    }
    
    /**
     * @notice Create a rental agreement and lock funds
     * @param params Rental parameters struct
     */
    function createAgreement(RentalParams calldata params) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        // Validate inputs
        require(params.nftContract == rentalNFT, "Invalid NFT contract");
        require(params.landlord != address(0), "Invalid landlord");
        require(params.landlord != msg.sender, "Cannot rent to yourself");
        require(params.rentAmount > 0, "Invalid rent");
        require(params.depositAmount > 0, "Invalid deposit");
        require(params.disputeFee > 0, "Invalid dispute fee");
        require(params.durationMonths > 0 && params.durationMonths <= 60, "Invalid duration");
        
        // Verify NFT ownership
        require(
            IERC721(params.nftContract).ownerOf(params.tokenId) == params.landlord,
            "Landlord doesn't own NFT"
        );
        
        // Calculate total amount needed
        uint256 totalRequired = params.rentAmount + params.depositAmount + params.disputeFee;
        require(msg.value == totalRequired, "Incorrect payment amount");
        
        // Create agreement
        uint256 agreementId = _agreementIdCounter++;
        
        agreements[agreementId] = Agreement({
            landlord: params.landlord,
            tenant: msg.sender,
            nftContract: params.nftContract,
            tokenId: params.tokenId,
            rentAmount: params.rentAmount,
            depositAmount: params.depositAmount,
            disputeFee: params.disputeFee,
            totalLocked: msg.value,
            startTimestamp: block.timestamp,
            durationMonths: params.durationMonths,
            lastRentPaid: block.timestamp,
            status: AgreementStatus.Active,
            landlordWithdrawn: false,
            tenantWithdrawn: false,
            disputeId: 0
        });
        
        // Update mappings
        tokenToAgreement[params.tokenId] = agreementId;
        tenantAgreements[msg.sender].push(agreementId);
        landlordAgreements[params.landlord].push(agreementId);
        
        // Transfer NFT to tenant
        IERC721(params.nftContract).safeTransferFrom(params.landlord, msg.sender, params.tokenId);
        
        emit AgreementCreated(agreementId, params.landlord, msg.sender, params.tokenId, msg.value);
    }
    
    /**
     * @notice Release rent to landlord
     * @param agreementId The agreement ID
     */
    function releaseRentToLandlord(uint256 agreementId) 
        external 
        nonReentrant 
        agreementExists(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        
        require(
            msg.sender == agreement.landlord || 
            msg.sender == agreement.tenant ||
            msg.sender == owner(),
            "Unauthorized"
        );
        
        require(!agreement.landlordWithdrawn, "Already withdrawn");
        
        // Calculate platform fee
        uint256 platformFee = (agreement.rentAmount * platformFeePercent) / 10000;
        uint256 landlordAmount = agreement.rentAmount - platformFee;
        
        agreement.landlordWithdrawn = true;
        accumulatedFees += platformFee;
        
        // Transfer rent to landlord
        (bool success, ) = payable(agreement.landlord).call{value: landlordAmount}("");
        require(success, "Transfer failed");
        
        emit RentReleased(agreementId, agreement.landlord, landlordAmount);
        
        // Auto-complete if both withdrawn
        _checkAndCompleteAgreement(agreementId);
    }
    
    /**
     * @notice Return deposit to tenant
     * @param agreementId The agreement ID
     */
    function returnDepositToTenant(uint256 agreementId)
        external
        nonReentrant
        agreementExists(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        
        require(
            msg.sender == agreement.landlord || 
            msg.sender == agreement.tenant ||
            msg.sender == owner(),
            "Unauthorized"
        );
        
        require(!agreement.tenantWithdrawn, "Already withdrawn");
        
        // Check if rental period is over or landlord approves early return
        if (msg.sender == agreement.tenant) {
            require(
                block.timestamp >= agreement.startTimestamp + (agreement.durationMonths * 30 days),
                "Rental period not over"
            );
        }
        
        agreement.tenantWithdrawn = true;
        uint256 returnAmount = agreement.depositAmount + agreement.disputeFee;
        
        // Transfer deposit and dispute fee back to tenant
        (bool success, ) = payable(agreement.tenant).call{value: returnAmount}("");
        require(success, "Transfer failed");
        
        emit DepositReturned(agreementId, agreement.tenant, returnAmount);
        
        // Auto-complete if both withdrawn
        _checkAndCompleteAgreement(agreementId);
    }
    
    /**
     * @notice Cancel an agreement within 24 hours
     * @param agreementId The agreement ID
     */
    function cancelAgreement(uint256 agreementId)
        external
        nonReentrant
        agreementExists(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        
        require(
            block.timestamp <= agreement.startTimestamp + 1 days,
            "Cancellation period over"
        );
        
        require(msg.sender == agreement.tenant, "Only tenant can cancel");
        
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
        require(success, "Refund failed");
        
        // Dispute fee goes to landlord as compensation
        (bool success2, ) = payable(agreement.landlord).call{value: agreement.disputeFee}("");
        require(success2, "Compensation failed");
        
        emit AgreementCancelled(agreementId);
    }
    
    /**
     * @dev Check and complete agreement if both parties have withdrawn
     */
    function _checkAndCompleteAgreement(uint256 agreementId) private {
        Agreement storage agreement = agreements[agreementId];
        if (agreement.landlordWithdrawn && agreement.tenantWithdrawn) {
            agreement.status = AgreementStatus.Completed;
            emit AgreementCompleted(agreementId);
        }
    }
    
    // ============ Dispute Functions ============
    
    /**
     * @notice Raise a dispute for an agreement
     * @param agreementId The agreement ID
     * @param evidenceURI URI pointing to evidence
     */
    function raiseDispute(uint256 agreementId, string memory evidenceURI)
        external
        nonReentrant
        agreementExists(agreementId)
        agreementActive(agreementId)
        onlyParty(agreementId)
    {
        require(activeJurorCount >= MIN_JURORS, "Not enough jurors");
        require(agreementToDispute[agreementId] == 0, "Dispute already exists");
        
        Agreement storage agreement = agreements[agreementId];
        
        // Create dispute
        uint256 disputeId = _disputeIdCounter++;
        Dispute storage dispute = disputes[disputeId];
        
        dispute.agreementId = agreementId;
        dispute.raisedBy = msg.sender;
        dispute.landlord = agreement.landlord;
        dispute.tenant = agreement.tenant;
        dispute.evidenceURI = evidenceURI;
        dispute.createdAt = block.timestamp;
        dispute.votingEndTime = block.timestamp + VOTING_PERIOD;
        dispute.status = DisputeStatus.Active;
        dispute.jurorRewardPool = agreement.disputeFee; // FIX: Use only disputeFee, not double
        
        // Select random jurors
        address[3] memory selectedJurors = _selectRandomJurors(disputeId);
        dispute.assignedJurors = selectedJurors;
        
        // Track dispute for each juror
        for (uint i = 0; i < 3; i++) {
            jurorActiveDisputes[selectedJurors[i]].push(disputeId);
            jurors[selectedJurors[i]].disputesAssigned++;
        }
        
        // Update agreement status
        agreement.status = AgreementStatus.Disputed;
        agreement.disputeId = disputeId;
        agreementToDispute[agreementId] = disputeId;
        
        emit DisputeRaised(agreementId, disputeId, msg.sender, evidenceURI);
        emit DisputeCreated(disputeId, agreementId, msg.sender, selectedJurors);
    }
    
    /**
     * @notice Submit additional evidence for a dispute
     * @param disputeId The dispute ID
     * @param evidenceURI URI pointing to new evidence
     */
    function submitEvidence(uint256 disputeId, string memory evidenceURI)
        external
        disputeActive(disputeId)
    {
        Dispute storage dispute = disputes[disputeId];
        require(
            msg.sender == dispute.landlord || msg.sender == dispute.tenant,
            "Not a party"
        );
        
        emit EvidenceSubmitted(disputeId, msg.sender, evidenceURI);
    }
    
    /**
     * @notice Cast vote as an assigned juror
     * @param disputeId The dispute ID
     * @param vote Vote decision
     */
    function castVote(uint256 disputeId, Vote vote)
        external
        nonReentrant
        disputeActive(disputeId)
    {
        require(vote != Vote.None, "Invalid vote");
        
        Dispute storage dispute = disputes[disputeId];
        require(block.timestamp <= dispute.votingEndTime, "Voting period ended");
        
        // Check if sender is assigned juror
        bool isAssigned = false;
        for (uint i = 0; i < 3; i++) {
            if (dispute.assignedJurors[i] == msg.sender) {
                isAssigned = true;
                break;
            }
        }
        require(isAssigned, "Not assigned juror");
        require(dispute.votes[msg.sender] == Vote.None, "Already voted");
        
        // Record vote
        dispute.votes[msg.sender] = vote;
        
        if (vote == Vote.TenantWins) {
            dispute.tenantVotes++;
        } else {
            dispute.landlordVotes++;
        }
        
        jurors[msg.sender].disputesVoted++;
        
        emit JurorVoted(disputeId, msg.sender, vote);
        
        // Auto-resolve if all voted
        if (dispute.tenantVotes + dispute.landlordVotes == 3) {
            _resolveDispute(disputeId);
        }
    }
    
    /**
     * @notice Resolve dispute after voting period
     * @param disputeId The dispute ID
     */
    function resolveDispute(uint256 disputeId) 
        external 
        nonReentrant 
        disputeActive(disputeId) 
    {
        Dispute storage dispute = disputes[disputeId];
        require(
            block.timestamp > dispute.votingEndTime ||
            (dispute.tenantVotes + dispute.landlordVotes == 3),
            "Cannot resolve yet"
        );
        
        _resolveDispute(disputeId);
    }
    
    /**
     * @dev Internal function to resolve dispute
     */
    function _resolveDispute(uint256 disputeId) private {
        Dispute storage dispute = disputes[disputeId];
        Agreement storage agreement = agreements[dispute.agreementId];
        
        // Determine winner
        bool tenantWins = dispute.tenantVotes > dispute.landlordVotes;
        dispute.tenantWins = tenantWins;
        dispute.status = DisputeStatus.Resolved;
        
        // Distribute juror rewards first and track how much was paid
        uint256 totalVotes = dispute.tenantVotes + dispute.landlordVotes;
        uint256 totalJurorRewards = 0;
        
        if (totalVotes > 0) {
            uint256 correctVotes = tenantWins ? dispute.tenantVotes : dispute.landlordVotes;
            if (correctVotes > 0) {
                uint256 rewardPerJuror = dispute.jurorRewardPool / correctVotes;
                
                // Pay jurors who voted correctly
                for (uint i = 0; i < 3; i++) {
                    address jurorAddr = dispute.assignedJurors[i];
                    Vote jurorVote = dispute.votes[jurorAddr];
                    
                    // Remove from active disputes
                    _removeActiveDispute(jurorAddr, disputeId);
                    
                    if (jurorVote != Vote.None) {
                        bool votedCorrectly = (tenantWins && jurorVote == Vote.TenantWins) ||
                                             (!tenantWins && jurorVote == Vote.LandlordWins);
                        
                        if (votedCorrectly && rewardPerJuror > 0) {
                            jurors[jurorAddr].correctVotes++;
                            jurors[jurorAddr].totalEarned += rewardPerJuror;
                            totalJurorRewards += rewardPerJuror;
                            
                            (bool success, ) = payable(jurorAddr).call{value: rewardPerJuror}("");
                            if (success) {
                                emit JurorRewarded(jurorAddr, disputeId, rewardPerJuror);
                            }
                        }
                    }
                }
            }
        }
        
        // Distribute remaining funds based on dispute outcome
        if (tenantWins) {
            // Tenant wins: gets rent + deposit + remaining dispute fee
            uint256 tenantAmount = agreement.rentAmount + agreement.depositAmount + (agreement.disputeFee - totalJurorRewards);
            (bool success, ) = payable(agreement.tenant).call{value: tenantAmount}("");
            require(success, "Transfer to tenant failed");
        } else {
            // Landlord wins: gets rent + deposit - platform fee, remaining dispute fee stays in contract
            uint256 platformFee = (agreement.rentAmount * platformFeePercent) / 10000;
            uint256 landlordAmount = agreement.rentAmount + agreement.depositAmount - platformFee;
            accumulatedFees += platformFee;
            
            (bool success, ) = payable(agreement.landlord).call{value: landlordAmount}("");
            require(success, "Transfer to landlord failed");
        }
        
        // Mark agreement as completed
        agreement.status = AgreementStatus.Completed;
        
        emit DisputeResolved(disputeId, tenantWins, dispute.jurorRewardPool);
        emit AgreementCompleted(dispute.agreementId);
    }
    
    // ============ Juror Functions ============
    
    /**
     * @notice Stake BNB to become a juror
     */
    function stakeAsJuror() external payable nonReentrant whenNotPaused {
        require(msg.value >= MIN_STAKE, "Below minimum stake");
        require(msg.value <= MAX_STAKE, "Above maximum stake");
        
        Juror storage juror = jurors[msg.sender];
        
        if (!juror.isActive) {
            juror.isActive = true;
            juror.stakedAt = block.timestamp;
            
            jurorPoolIndex[msg.sender] = jurorPool.length;
            jurorPool.push(msg.sender);
            activeJurorCount++;
        }
        
        juror.stakedAmount += msg.value;
        totalStaked += msg.value;
        
        emit JurorStaked(msg.sender, msg.value);
    }
    
    /**
     * @notice Unstake and stop being a juror
     */
    function unstake() external nonReentrant {
        Juror storage juror = jurors[msg.sender];
        require(juror.isActive, "Not a juror");
        require(
            block.timestamp >= juror.stakedAt + UNSTAKE_DELAY,
            "Unstake delay not met"
        );
        require(
            jurorActiveDisputes[msg.sender].length == 0,
            "Has active disputes"
        );
        
        uint256 amount = juror.stakedAmount;
        require(amount > 0, "No stake to withdraw");
        
        // Remove from pool
        _removeFromJurorPool(msg.sender);
        
        // Update state
        juror.stakedAmount = 0;
        juror.isActive = false;
        totalStaked -= amount;
        activeJurorCount--;
        
        // Transfer stake back
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit JurorUnstaked(msg.sender, amount);
    }
    
    // ============ Helper Functions ============
    
    /**
     * @dev Select random jurors for a dispute - Gas optimized version
     */
    function _selectRandomJurors(uint256 disputeId) private view returns (address[3] memory) {
        require(jurorPool.length >= MIN_JURORS, "Not enough jurors");
        
        address[3] memory selected;
        uint256 poolLength = jurorPool.length;
        
        // Create a simple seed that changes for each selection
        uint256 baseSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            disputeId,
            msg.sender
        )));
        
        if (poolLength == 3) {
            // If exactly 3 jurors, select all
            selected[0] = jurorPool[0];
            selected[1] = jurorPool[1];
            selected[2] = jurorPool[2];
        } else {
            // For larger pools, use a more efficient algorithm
            // Use different seeds for each selection to avoid duplicates
            uint256 index1 = baseSeed % poolLength;
            uint256 index2 = (baseSeed + 1) % poolLength;
            uint256 index3 = (baseSeed + 2) % poolLength;
            
            // Simple duplicate avoidance - much more gas efficient
            if (index2 == index1) {
                index2 = (index2 + 1) % poolLength;
            }
            if (index3 == index1 || index3 == index2) {
                index3 = (index3 + 1) % poolLength;
                if (index3 == index1) {
                    index3 = (index3 + 1) % poolLength;
                }
            }
            
            selected[0] = jurorPool[index1];
            selected[1] = jurorPool[index2];
            selected[2] = jurorPool[index3];
        }
        
        return selected;
    }
    
    /**
     * @dev Remove juror from pool
     */
    function _removeFromJurorPool(address juror) private {
        uint256 index = jurorPoolIndex[juror];
        uint256 lastIndex = jurorPool.length - 1;
        
        if (index != lastIndex) {
            address lastJuror = jurorPool[lastIndex];
            jurorPool[index] = lastJuror;
            jurorPoolIndex[lastJuror] = index;
        }
        
        jurorPool.pop();
        delete jurorPoolIndex[juror];
    }
    
    /**
     * @dev Remove dispute from juror's active list
     */
    function _removeActiveDispute(address juror, uint256 disputeId) private {
        uint256[] storage activeDisputes = jurorActiveDisputes[juror];
        
        for (uint i = 0; i < activeDisputes.length; i++) {
            if (activeDisputes[i] == disputeId) {
                activeDisputes[i] = activeDisputes[activeDisputes.length - 1];
                activeDisputes.pop();
                break;
            }
        }
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update platform fee
     * @param newFeePercent New fee in basis points
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= MAX_FEE, "Fee too high");
        uint256 oldFee = platformFeePercent;
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(oldFee, newFeePercent);
    }
    
    /**
     * @notice Withdraw accumulated platform fees
     * @param to Address to withdraw to
     */
    function withdrawFees(address to) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid address");
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees = 0;
        
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Withdrawal failed");
        
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
    
    // ============ View Functions ============
    
    /**
     * @notice Get agreement details
     */
    function getAgreementDetails(uint256 agreementId) 
        external 
        view 
        returns (Agreement memory) 
    {
        return agreements[agreementId];
    }
    
    /**
     * @notice Get tenant's agreements
     */
    function getTenantAgreements(address tenant) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return tenantAgreements[tenant];
    }
    
    /**
     * @notice Get landlord's agreements
     */
    function getLandlordAgreements(address landlord) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return landlordAgreements[landlord];
    }
    
    /**
     * @notice Get agreement by token ID
     */
    function getAgreementByToken(uint256 tokenId) 
        external 
        view 
        returns (uint256) 
    {
        return tokenToAgreement[tokenId];
    }
    
    /**
     * @notice Get dispute details
     */
    function getDispute(uint256 disputeId) external view returns (
        uint256 agreementId,
        address raisedBy,
        address landlord,
        address tenant,
        string memory evidenceURI,
        uint256 createdAt,
        uint256 votingEndTime,
        DisputeStatus status,
        uint256 tenantVotes,
        uint256 landlordVotes,
        bool tenantWins
    ) {
        Dispute storage dispute = disputes[disputeId];
        return (
            dispute.agreementId,
            dispute.raisedBy,
            dispute.landlord,
            dispute.tenant,
            dispute.evidenceURI,
            dispute.createdAt,
            dispute.votingEndTime,
            dispute.status,
            dispute.tenantVotes,
            dispute.landlordVotes,
            dispute.tenantWins
        );
    }
    
    /**
     * @notice Get assigned jurors for a dispute
     */
    function getAssignedJurors(uint256 disputeId) 
        external 
        view 
        returns (address[3] memory) 
    {
        return disputes[disputeId].assignedJurors;
    }
    
    /**
     * @notice Get juror's vote
     */
    function getJurorVote(uint256 disputeId, address juror) 
        external 
        view 
        returns (Vote) 
    {
        return disputes[disputeId].votes[juror];
    }
    
    /**
     * @notice Get juror statistics
     */
    function getJurorStats(address juror) external view returns (
        uint256 stakedAmount,
        uint256 disputesAssigned,
        uint256 disputesVoted,
        uint256 correctVotes,
        uint256 totalEarned,
        bool isActive
    ) {
        Juror memory j = jurors[juror];
        return (
            j.stakedAmount,
            j.disputesAssigned,
            j.disputesVoted,
            j.correctVotes,
            j.totalEarned,
            j.isActive
        );
    }
    
    /**
     * @notice Get juror pool size
     */
    function getJurorPoolSize() external view returns (uint256) {
        return jurorPool.length;
    }
    
    /**
     * @notice Get juror's active disputes
     */
    function getJurorActiveDisputes(address juror) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return jurorActiveDisputes[juror];
    }
    
    /**
     * @notice Get total agreements count
     */
    function getTotalAgreements() external view returns (uint256) {
        return _agreementIdCounter - 1;
    }
    
    /**
     * @notice Get total disputes count
     */
    function getTotalDisputes() external view returns (uint256) {
        return _disputeIdCounter - 1;
    }
    
    /**
     * @notice Check if address is an active juror
     */
    function isActiveJuror(address account) external view returns (bool) {
        return jurors[account].isActive;
    }
    
    /**
     * @notice Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // ============ IERC721Receiver Implementation ============
    
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