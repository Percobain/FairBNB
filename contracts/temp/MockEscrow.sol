// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockEscrow
 * @notice Mock escrow contract for testing DisputeDAO
 */
contract MockEscrow {
    
    struct Agreement {
        address landlord;
        address tenant;
        uint256 disputeFee;
        uint8 status;
    }
    
    mapping(uint256 => Agreement) public agreements;
    mapping(uint256 => bool) public disputeResolutions;
    mapping(uint256 => bool) public tenantWinsRecord;
    
    event DisputeResolved(uint256 agreementId, bool tenantWins);
    
    constructor() {
        // Create a sample agreement for testing
        agreements[1] = Agreement({
            landlord: address(0x1),
            tenant: address(0x2),
            disputeFee: 0.001 ether,
            status: 1 // Active
        });
    }
    
    function setAgreement(
        uint256 agreementId,
        address landlord,
        address tenant,
        uint256 disputeFee
    ) external {
        agreements[agreementId] = Agreement({
            landlord: landlord,
            tenant: tenant,
            disputeFee: disputeFee,
            status: 1
        });
    }
    
    function resolveDispute(uint256 agreementId, bool tenantWins) external {
        disputeResolutions[agreementId] = true;
        tenantWinsRecord[agreementId] = tenantWins;
        emit DisputeResolved(agreementId, tenantWins);
    }
    
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
    ) {
        Agreement memory a = agreements[agreementId];
        
        // Return mock data with actual landlord, tenant, and dispute fee
        return (
            a.landlord != address(0) ? a.landlord : address(0x1),
            a.tenant != address(0) ? a.tenant : address(0x2),
            address(0x3),  // nftContract
            agreementId,   // tokenId
            0.002 ether,   // rentAmount
            0.004 ether,   // depositAmount
            a.disputeFee != 0 ? a.disputeFee : 0.001 ether,
            0.007 ether,   // totalLocked
            block.timestamp - 86400, // startTimestamp (1 day ago)
            12,            // durationMonths
            block.timestamp - 86400, // lastRentPaid
            a.status != 0 ? a.status : 1,
            false,         // landlordWithdrawn
            false,         // tenantWithdrawn
            0              // disputeId
        );
    }
    
    // Allow receiving ETH for dispute fees
    receive() external payable {}
}