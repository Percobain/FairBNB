// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IEscrow {
    function resolveDispute(uint256 agreementId, bool tenantWins) external;
    function getAgreement(uint256 agreementId) external view returns (
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
    );
}

/**
 * @title DisputeDAO
 * @author FairBNB Team
 * @notice Handles dispute resolution through community voting
 * @dev Jurors stake tokens, get randomly selected, vote on disputes, and earn fees
 */
contract DisputeDAO is Ownable, ReentrancyGuard, Pausable {
    
    // Dispute status enum
    enum DisputeStatus {
        None,           // 0: Doesn't exist
        Active,         // 1: Voting in progress
        Resolved,       // 2: Voting completed, resolution executed
        Cancelled       // 3: Dispute cancelled
    }
    
    // Vote enum
    enum Vote {
        None,           // 0: Not voted
        TenantWins,     // 1: Vote for tenant
        LandlordWins    // 2: Vote for landlord
    }
    
    // Juror struct
    struct Juror {
        uint256 stakedAmount;
        uint256 stakedAt;
        bool isActive;
        uint256 disputesAssigned;
        uint256 disputesVoted;
        uint256 correctVotes;
        uint256 totalEarned;
    }
    
    // Dispute struct
    struct Dispute {
        uint256 agreementId;
        address raisedBy;
        address landlord;
        address tenant;
        string evidenceURI;         // Link to evidence on Greenfield
        uint256 createdAt;
        uint256 votingEndTime;
        DisputeStatus status;
        address[3] assignedJurors;
        mapping(address => Vote) votes;
        uint256 tenantVotes;
        uint256 landlordVotes;
        bool tenantWins;
        uint256 jurorRewardPool;    // Total dispute fees for distribution
    }
    
    // State variables
    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant MAX_STAKE = 0.1 ether;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_JURORS = 3;
    uint256 public constant UNSTAKE_DELAY = 7 days;
    
    address public escrowContract;
    uint256 private _disputeIdCounter;
    uint256 public totalStaked;
    uint256 public activeJurorCount;
    
    // Mappings
    mapping(address => Juror) public jurors;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256[]) public jurorActiveDisputes;
    mapping(uint256 => uint256) public agreementToDispute; // agreementId => disputeId
    
    address[] public jurorPool;
    mapping(address => uint256) public jurorPoolIndex;
    
    // Events
    event JurorStaked(address indexed juror, uint256 amount);
    event JurorUnstaked(address indexed juror, uint256 amount);
    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed agreementId,
        address indexed raisedBy,
        address[3] assignedJurors
    );
    event JurorVoted(
        uint256 indexed disputeId,
        address indexed juror,
        Vote vote
    );
    event DisputeResolved(
        uint256 indexed disputeId,
        bool tenantWins,
        uint256 jurorRewards
    );
    event JurorRewarded(
        address indexed juror,
        uint256 indexed disputeId,
        uint256 amount
    );
    event EvidenceSubmitted(
        uint256 indexed disputeId,
        address indexed submitter,
        string evidenceURI
    );
    
    // Modifiers
    modifier onlyEscrow() {
        require(msg.sender == escrowContract, "DisputeDAO: Only escrow");
        _;
    }
    
    modifier onlyActiveJuror() {
        require(jurors[msg.sender].isActive, "DisputeDAO: Not active juror");
        _;
    }
    
    modifier disputeExists(uint256 disputeId) {
        require(disputes[disputeId].status != DisputeStatus.None, "DisputeDAO: Dispute not found");
        _;
    }
    
    modifier disputeActive(uint256 disputeId) {
        require(disputes[disputeId].status == DisputeStatus.Active, "DisputeDAO: Dispute not active");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        _disputeIdCounter = 1;
    }

    /**
     * @notice Set the escrow contract address
     * @param _escrowContract Address of the escrow contract
     */
    function setEscrowContract(address _escrowContract) external onlyOwner {
        require(_escrowContract != address(0), "DisputeDAO: Invalid address");
        escrowContract = _escrowContract;
    }

    /**
     * @notice Stake BNB to become a juror
     */
    function stakeAsJuror() external payable nonReentrant whenNotPaused {
        require(msg.value >= MIN_STAKE, "DisputeDAO: Below minimum stake");
        require(msg.value <= MAX_STAKE, "DisputeDAO: Above maximum stake");
        
        Juror storage juror = jurors[msg.sender];
        
        if (!juror.isActive) {
            // New juror
            juror.isActive = true;
            juror.stakedAt = block.timestamp;
            
            // Add to pool
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
        require(juror.isActive, "DisputeDAO: Not a juror");
        require(
            block.timestamp >= juror.stakedAt + UNSTAKE_DELAY,
            "DisputeDAO: Unstake delay not met"
        );
        require(
            jurorActiveDisputes[msg.sender].length == 0,
            "DisputeDAO: Has active disputes"
        );
        
        uint256 amount = juror.stakedAmount;
        require(amount > 0, "DisputeDAO: No stake to withdraw");
        
        // Remove from pool
        _removeFromJurorPool(msg.sender);
        
        // Update state
        juror.stakedAmount = 0;
        juror.isActive = false;
        totalStaked -= amount;
        activeJurorCount--;
        
        // Transfer stake back
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "DisputeDAO: Transfer failed");
        
        emit JurorUnstaked(msg.sender, amount);
    }

    /**
     * @notice Create a new dispute (called by escrow)
     * @param agreementId The rental agreement ID
     * @param raisedBy Address that raised the dispute
     * @param evidenceURI URI pointing to evidence on Greenfield
     */
    function createDispute(
        uint256 agreementId,
        address raisedBy,
        string memory evidenceURI
    ) external onlyEscrow nonReentrant whenNotPaused returns (uint256) {
        require(activeJurorCount >= MIN_JURORS, "DisputeDAO: Not enough jurors");
        require(agreementToDispute[agreementId] == 0, "DisputeDAO: Dispute already exists");
        
        // Get agreement details from escrow
        (
            address landlord,
            address tenant,
            ,,,,
            uint256 disputeFee,
            ,,,,,,,
        ) = IEscrow(escrowContract).getAgreement(agreementId);
        
        uint256 disputeId = _disputeIdCounter++;
        Dispute storage dispute = disputes[disputeId];
        
        dispute.agreementId = agreementId;
        dispute.raisedBy = raisedBy;
        dispute.landlord = landlord;
        dispute.tenant = tenant;
        dispute.evidenceURI = evidenceURI;
        dispute.createdAt = block.timestamp;
        dispute.votingEndTime = block.timestamp + VOTING_PERIOD;
        dispute.status = DisputeStatus.Active;
        dispute.jurorRewardPool = disputeFee * 2; // Both parties' dispute fees
        
        // Select random jurors
        address[3] memory selectedJurors = _selectRandomJurors(disputeId);
        dispute.assignedJurors = selectedJurors;
        
        // Track dispute for each juror
        for (uint i = 0; i < 3; i++) {
            jurorActiveDisputes[selectedJurors[i]].push(disputeId);
            jurors[selectedJurors[i]].disputesAssigned++;
        }
        
        agreementToDispute[agreementId] = disputeId;
        
        emit DisputeCreated(disputeId, agreementId, raisedBy, selectedJurors);
        
        return disputeId;
    }

    /**
     * @notice Submit additional evidence for a dispute
     * @param disputeId The dispute ID
     * @param evidenceURI URI pointing to new evidence
     */
    function submitEvidence(
        uint256 disputeId,
        string memory evidenceURI
    ) external disputeActive(disputeId) {
        Dispute storage dispute = disputes[disputeId];
        require(
            msg.sender == dispute.landlord || msg.sender == dispute.tenant,
            "DisputeDAO: Not a party"
        );
        
        emit EvidenceSubmitted(disputeId, msg.sender, evidenceURI);
    }

    /**
     * @notice Cast vote as an assigned juror
     * @param disputeId The dispute ID
     * @param vote Vote decision (TenantWins or LandlordWins)
     */
    function castVote(
        uint256 disputeId,
        Vote vote
    ) external nonReentrant disputeActive(disputeId) {
        require(vote != Vote.None, "DisputeDAO: Invalid vote");
        
        Dispute storage dispute = disputes[disputeId];
        require(block.timestamp <= dispute.votingEndTime, "DisputeDAO: Voting period ended");
        
        // Check if sender is assigned juror
        bool isAssigned = false;
        for (uint i = 0; i < 3; i++) {
            if (dispute.assignedJurors[i] == msg.sender) {
                isAssigned = true;
                break;
            }
        }
        require(isAssigned, "DisputeDAO: Not assigned juror");
        require(dispute.votes[msg.sender] == Vote.None, "DisputeDAO: Already voted");
        
        // Record vote
        dispute.votes[msg.sender] = vote;
        
        if (vote == Vote.TenantWins) {
            dispute.tenantVotes++;
        } else {
            dispute.landlordVotes++;
        }
        
        jurors[msg.sender].disputesVoted++;
        
        emit JurorVoted(disputeId, msg.sender, vote);
        
        // Check if all jurors have voted
        if (dispute.tenantVotes + dispute.landlordVotes == 3) {
            _resolveDispute(disputeId);
        }
    }

    /**
     * @notice Resolve dispute after voting period or when all votes are in
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
            "DisputeDAO: Cannot resolve yet"
        );
        
        _resolveDispute(disputeId);
    }

    /**
     * @dev Internal function to resolve dispute
     */
    function _resolveDispute(uint256 disputeId) private {
        Dispute storage dispute = disputes[disputeId];
        
        // Determine winner (majority vote)
        bool tenantWins = dispute.tenantVotes > dispute.landlordVotes;
        dispute.tenantWins = tenantWins;
        dispute.status = DisputeStatus.Resolved;
        
        // Calculate rewards per juror who voted correctly
        uint256 totalVotes = dispute.tenantVotes + dispute.landlordVotes;
        uint256 rewardPerJuror = 0;
        
        if (totalVotes > 0) {
            uint256 correctVotes = tenantWins ? dispute.tenantVotes : dispute.landlordVotes;
            if (correctVotes > 0) {
                rewardPerJuror = dispute.jurorRewardPool / correctVotes;
            }
        }
        
        // Distribute rewards to jurors who voted correctly
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
                    
                    // Transfer reward
                    (bool success, ) = payable(jurorAddr).call{value: rewardPerJuror}("");
                    if (success) {
                        emit JurorRewarded(jurorAddr, disputeId, rewardPerJuror);
                    }
                }
            }
        }
        
        // Notify escrow of resolution
        IEscrow(escrowContract).resolveDispute(dispute.agreementId, tenantWins);
        
        emit DisputeResolved(disputeId, tenantWins, dispute.jurorRewardPool);
    }

    /**
     * @dev Select random jurors for a dispute
     */
    function _selectRandomJurors(uint256 disputeId) private view returns (address[3] memory) {
        require(jurorPool.length >= MIN_JURORS, "DisputeDAO: Not enough jurors in pool");
        
        address[3] memory selected;
        uint256[] memory usedIndices = new uint256[](3);
        
        for (uint i = 0; i < 3; i++) {
            uint256 randomIndex;
            bool isDuplicate;
            
            do {
                isDuplicate = false;
                // Pseudo-random selection (acceptable for MVP/hackathon)
                randomIndex = uint256(keccak256(abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    disputeId,
                    i
                ))) % jurorPool.length;
                
                // Check if already selected
                for (uint j = 0; j < i; j++) {
                    if (usedIndices[j] == randomIndex) {
                        isDuplicate = true;
                        break;
                    }
                }
            } while (isDuplicate);
            
            usedIndices[i] = randomIndex;
            selected[i] = jurorPool[randomIndex];
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
     * @notice Get dispute details
     * @param disputeId The dispute ID
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
     * @param disputeId The dispute ID
     */
    function getAssignedJurors(uint256 disputeId) 
        external 
        view 
        returns (address[3] memory) 
    {
        return disputes[disputeId].assignedJurors;
    }

    /**
     * @notice Get juror's vote for a dispute
     * @param disputeId The dispute ID
     * @param juror Juror address
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
     * @param juror Juror address
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
     * @notice Get total number of jurors in pool
     */
    function getJurorPoolSize() external view returns (uint256) {
        return jurorPool.length;
    }

    /**
     * @notice Get active disputes for a juror
     * @param juror Juror address
     */
    function getJurorActiveDisputes(address juror) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return jurorActiveDisputes[juror];
    }

    /**
     * @notice Receive function to accept dispute fees from escrow
     */
    receive() external payable {}
}