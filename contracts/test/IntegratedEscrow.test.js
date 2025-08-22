const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("IntegratedEscrow", function () {
    let escrow, rentalNFT;
    let owner, landlord, tenant, juror1, juror2, juror3, juror4, otherUser;
    
    const RENT_AMOUNT = ethers.parseEther("0.5");
    const DEPOSIT_AMOUNT = ethers.parseEther("1.0");
    const DISPUTE_FEE = ethers.parseEther("0.05");
    const DURATION_MONTHS = 6;
    const MIN_STAKE = ethers.parseEther("0.001");
    const MAX_STAKE = ethers.parseEther("0.1");
    const VOTING_PERIOD = 3 * 24 * 60 * 60; // 3 days
    const UNSTAKE_DELAY = 7 * 24 * 60 * 60; // 7 days
    
    beforeEach(async function () {
        // Get signers
        [owner, landlord, tenant, juror1, juror2, juror3, juror4, otherUser] = await ethers.getSigners();
        
        // Deploy RentalNFT with correct constructor parameters
        const RentalNFT = await ethers.getContractFactory("RentalNFT");
        rentalNFT = await RentalNFT.deploy("RentalNFT", "RENT");
        await rentalNFT.waitForDeployment();
        
        // Deploy IntegratedEscrow
        const IntegratedEscrow = await ethers.getContractFactory("IntegratedEscrow");
        escrow = await IntegratedEscrow.deploy();
        await escrow.waitForDeployment();
        
        // Set rental NFT contract
        await escrow.setRentalNFT(await rentalNFT.getAddress());
        
        // Mint NFT to landlord for testing using the correct function
        await rentalNFT.mint(
            landlord.address,
            "ipfs://test-uri"
        );
        
        // Approve escrow to transfer NFT
        await rentalNFT.connect(landlord).approve(await escrow.getAddress(), 1);
    });
    
    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await escrow.owner()).to.equal(owner.address);
        });
        
        it("Should initialize with correct default values", async function () {
            expect(await escrow.platformFeePercent()).to.equal(100); // 1%
            expect(await escrow.getTotalAgreements()).to.equal(0);
            expect(await escrow.getTotalDisputes()).to.equal(0);
            expect(await escrow.activeJurorCount()).to.equal(0);
        });
    });
    
    describe("Agreement Creation", function () {
        it("Should create agreement successfully", async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            
            const tx = await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            await expect(tx)
                .to.emit(escrow, "AgreementCreated")
                .withArgs(1, landlord.address, tenant.address, 1, totalPayment);
            
            // Check agreement details
            const agreement = await escrow.getAgreementDetails(1);
            expect(agreement.landlord).to.equal(landlord.address);
            expect(agreement.tenant).to.equal(tenant.address);
            expect(agreement.rentAmount).to.equal(RENT_AMOUNT);
            expect(agreement.depositAmount).to.equal(DEPOSIT_AMOUNT);
            expect(agreement.status).to.equal(1); // Active
            
            // Check NFT ownership transferred to tenant
            expect(await rentalNFT.ownerOf(1)).to.equal(tenant.address);
        });
        
        it("Should revert with incorrect payment amount", async function () {
            const wrongPayment = RENT_AMOUNT + DEPOSIT_AMOUNT; // Missing dispute fee
            
            await expect(
                escrow.connect(tenant).createAgreement({
                    landlord: landlord.address,
                    nftContract: await rentalNFT.getAddress(),
                    tokenId: 1,
                    rentAmount: RENT_AMOUNT,
                    depositAmount: DEPOSIT_AMOUNT,
                    disputeFee: DISPUTE_FEE,
                    durationMonths: DURATION_MONTHS
                }, { value: wrongPayment, gasLimit: 500000 })
            ).to.be.revertedWith("Incorrect payment amount");
        });
        
        it("Should revert when landlord doesn't own NFT", async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            
            await expect(
                escrow.connect(tenant).createAgreement({
                    landlord: otherUser.address, // Wrong landlord
                    nftContract: await rentalNFT.getAddress(),
                    tokenId: 1,
                    rentAmount: RENT_AMOUNT,
                    depositAmount: DEPOSIT_AMOUNT,
                    disputeFee: DISPUTE_FEE,
                    durationMonths: DURATION_MONTHS
                }, { value: totalPayment, gasLimit: 500000 })
            ).to.be.revertedWith("Landlord doesn't own NFT");
        });
        
        it("Should track agreements for tenant and landlord", async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            const tenantAgreements = await escrow.getTenantAgreements(tenant.address);
            expect(tenantAgreements.length).to.equal(1);
            expect(tenantAgreements[0]).to.equal(1);
            
            const landlordAgreements = await escrow.getLandlordAgreements(landlord.address);
            expect(landlordAgreements.length).to.equal(1);
            expect(landlordAgreements[0]).to.equal(1);
        });
    });
    
    describe("Rent Release", function () {
        beforeEach(async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
        });
        
        it("Should release rent to landlord", async function () {
            const initialBalance = await ethers.provider.getBalance(landlord.address);
            
            await escrow.connect(landlord).releaseRentToLandlord(1, { gasLimit: 200000 });
            
            const finalBalance = await ethers.provider.getBalance(landlord.address);
            const platformFee = (RENT_AMOUNT * 100n) / 10000n; // 1%
            const expectedAmount = RENT_AMOUNT - platformFee;
            
            expect(finalBalance).to.be.closeTo(
                initialBalance + expectedAmount,
                ethers.parseEther("0.01") // Account for gas
            );
            
            // Check platform fees accumulated
            expect(await escrow.accumulatedFees()).to.equal(platformFee);
        });
        
        it("Should prevent double withdrawal by landlord", async function () {
            await escrow.connect(landlord).releaseRentToLandlord(1, { gasLimit: 200000 });
            
            await expect(
                escrow.connect(landlord).releaseRentToLandlord(1, { gasLimit: 200000 })
            ).to.be.revertedWith("Already withdrawn");
        });
        
        it("Should allow tenant to release rent", async function () {
            await expect(escrow.connect(tenant).releaseRentToLandlord(1, { gasLimit: 200000 }))
                .to.emit(escrow, "RentReleased");
        });
    });
    
    describe("Deposit Return", function () {
        beforeEach(async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
        });
        
        it("Should return deposit after rental period", async function () {
            // Fast forward time
            await time.increase(DURATION_MONTHS * 30 * 24 * 60 * 60);
            
            const initialBalance = await ethers.provider.getBalance(tenant.address);
            
            await escrow.connect(tenant).returnDepositToTenant(1, { gasLimit: 200000 });
            
            const finalBalance = await ethers.provider.getBalance(tenant.address);
            const expectedReturn = DEPOSIT_AMOUNT + DISPUTE_FEE;
            
            expect(finalBalance).to.be.closeTo(
                initialBalance + expectedReturn,
                ethers.parseEther("0.01") // Account for gas
            );
        });
        
        it("Should allow landlord to return deposit early", async function () {
            await expect(escrow.connect(landlord).returnDepositToTenant(1, { gasLimit: 200000 }))
                .to.emit(escrow, "DepositReturned");
        });
        
        it("Should prevent tenant from returning deposit before rental period ends", async function () {
            await expect(
                escrow.connect(tenant).returnDepositToTenant(1, { gasLimit: 200000 })
            ).to.be.revertedWith("Rental period not over");
        });
        
        it("Should complete agreement when both parties withdraw", async function () {
            await escrow.connect(landlord).releaseRentToLandlord(1, { gasLimit: 200000 });
            
            // Fast forward time
            await time.increase(DURATION_MONTHS * 30 * 24 * 60 * 60);
            
            await expect(escrow.connect(tenant).returnDepositToTenant(1, { gasLimit: 200000 }))
                .to.emit(escrow, "AgreementCompleted")
                .withArgs(1);
            
            const agreement = await escrow.getAgreementDetails(1);
            expect(agreement.status).to.equal(3); // Completed
        });
    });
    
    describe("Agreement Cancellation", function () {
        beforeEach(async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
        });
        
        it("Should allow tenant to cancel within 24 hours", async function () {
            // Need to approve escrow again since NFT is now owned by tenant
            await rentalNFT.connect(tenant).approve(await escrow.getAddress(), 1);
            
            await expect(escrow.connect(tenant).cancelAgreement(1, { gasLimit: 300000 }))
                .to.emit(escrow, "AgreementCancelled")
                .withArgs(1);
            
            // Check NFT returned to landlord
            expect(await rentalNFT.ownerOf(1)).to.equal(landlord.address);
            
            // Check agreement status
            const agreement = await escrow.getAgreementDetails(1);
            expect(agreement.status).to.equal(4); // Cancelled
        });
        
        it("Should not allow cancellation after 24 hours", async function () {
            await time.increase(25 * 60 * 60); // 25 hours
            
            await expect(
                escrow.connect(tenant).cancelAgreement(1, { gasLimit: 300000 })
            ).to.be.revertedWith("Cancellation period over");
        });
        
        it("Should only allow tenant to cancel", async function () {
            await expect(
                escrow.connect(landlord).cancelAgreement(1, { gasLimit: 300000 })
            ).to.be.revertedWith("Only tenant can cancel");
        });
    });
    
    describe("Juror Management", function () {
        it("Should allow staking as juror", async function () {
            await expect(
                escrow.connect(juror1).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 })
            ).to.emit(escrow, "JurorStaked")
            .withArgs(juror1.address, MIN_STAKE);
            
            expect(await escrow.activeJurorCount()).to.equal(1);
            expect(await escrow.isActiveJuror(juror1.address)).to.be.true;
            
            const stats = await escrow.getJurorStats(juror1.address);
            expect(stats.stakedAmount).to.equal(MIN_STAKE);
            expect(stats.isActive).to.be.true;
        });
        
        it("Should reject stake below minimum", async function () {
            const belowMin = ethers.parseEther("0.0005");
            await expect(
                escrow.connect(juror1).stakeAsJuror({ value: belowMin, gasLimit: 200000 })
            ).to.be.revertedWith("Below minimum stake");
        });
        
        it("Should reject stake above maximum", async function () {
            const aboveMax = ethers.parseEther("0.2");
            await expect(
                escrow.connect(juror1).stakeAsJuror({ value: aboveMax, gasLimit: 200000 })
            ).to.be.revertedWith("Above maximum stake");
        });
        
        it("Should allow unstaking after delay period", async function () {
            await escrow.connect(juror1).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            
            // Try unstaking immediately - should fail
            await expect(
                escrow.connect(juror1).unstake({ gasLimit: 200000 })
            ).to.be.revertedWith("Unstake delay not met");
            
            // Fast forward past delay period
            await time.increase(UNSTAKE_DELAY + 1);
            
            const initialBalance = await ethers.provider.getBalance(juror1.address);
            
            await escrow.connect(juror1).unstake({ gasLimit: 200000 });
            
            const finalBalance = await ethers.provider.getBalance(juror1.address);
            expect(finalBalance).to.be.closeTo(
                initialBalance + MIN_STAKE,
                ethers.parseEther("0.01")
            );
            
            expect(await escrow.activeJurorCount()).to.equal(0);
            expect(await escrow.isActiveJuror(juror1.address)).to.be.false;
        });
    });
    
    describe("Dispute Resolution", function () {
        beforeEach(async function () {
            // Create agreement
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            // Setup jurors
            await escrow.connect(juror1).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            await escrow.connect(juror2).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            await escrow.connect(juror3).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
        });
        
        it("Should allow raising a dispute", async function () {
            await expect(
                escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 })
            ).to.emit(escrow, "DisputeRaised")
            .withArgs(1, 1, tenant.address, "ipfs://evidence");
            
            const agreement = await escrow.getAgreementDetails(1);
            expect(agreement.status).to.equal(2); // Disputed
            
            const dispute = await escrow.getDispute(1);
            expect(dispute.agreementId).to.equal(1);
            expect(dispute.raisedBy).to.equal(tenant.address);
        });
        
        it("Should not allow dispute without enough jurors", async function () {
            // Unstake all jurors
            await time.increase(UNSTAKE_DELAY + 1);
            await escrow.connect(juror1).unstake({ gasLimit: 200000 });
            await escrow.connect(juror2).unstake({ gasLimit: 200000 });
            await escrow.connect(juror3).unstake({ gasLimit: 200000 });
            
            await expect(
                escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 })
            ).to.be.revertedWith("Not enough jurors");
        });
        
        it("Should assign random jurors to dispute", async function () {
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            const assignedJurors = await escrow.getAssignedJurors(1);
            expect(assignedJurors.length).to.equal(3);
            
            // Check all assigned jurors are from the pool
            for (let juror of assignedJurors) {
                expect(await escrow.isActiveJuror(juror)).to.be.true;
            }
        });
        
        it("Should allow jurors to vote", async function () {
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            const assignedJurors = await escrow.getAssignedJurors(1);
            
            // Find which test juror was assigned
            let assignedJuror;
            if (assignedJurors.includes(juror1.address)) {
                assignedJuror = juror1;
            } else if (assignedJurors.includes(juror2.address)) {
                assignedJuror = juror2;
            } else {
                assignedJuror = juror3;
            }
            
            await expect(
                escrow.connect(assignedJuror).castVote(1, 1, { gasLimit: 200000 }) // Vote for tenant
            ).to.emit(escrow, "JurorVoted")
            .withArgs(1, assignedJuror.address, 1);
            
            const vote = await escrow.getJurorVote(1, assignedJuror.address);
            expect(vote).to.equal(1); // TenantWins
        });
        
        it("Should not allow non-assigned juror to vote", async function () {
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            // Add a 4th juror who won't be assigned
            await escrow.connect(juror4).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            
            const assignedJurors = await escrow.getAssignedJurors(1);
            
            // Find non-assigned juror
            let nonAssignedJuror;
            if (!assignedJurors.includes(juror4.address)) {
                nonAssignedJuror = juror4;
            } else if (!assignedJurors.includes(juror1.address)) {
                nonAssignedJuror = juror1;
            } else if (!assignedJurors.includes(juror2.address)) {
                nonAssignedJuror = juror2;
            } else {
                nonAssignedJuror = juror3;
            }
            
            await expect(
                escrow.connect(nonAssignedJuror).castVote(1, 1, { gasLimit: 200000 })
            ).to.be.revertedWith("Not assigned juror");
        });
        
        it("Should resolve dispute after all votes", async function () {
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            const assignedJurors = await escrow.getAssignedJurors(1);
            
            // Map addresses to signers
            const jurorSigners = [];
            for (let addr of assignedJurors) {
                if (addr === juror1.address) jurorSigners.push(juror1);
                else if (addr === juror2.address) jurorSigners.push(juror2);
                else if (addr === juror3.address) jurorSigners.push(juror3);
            }
            
            // Vote: 2 for tenant, 1 for landlord
            await escrow.connect(jurorSigners[0]).castVote(1, 1, { gasLimit: 500000 }); // TenantWins
            await escrow.connect(jurorSigners[1]).castVote(1, 1, { gasLimit: 500000 }); // TenantWins
            
            // The third vote triggers _resolveDispute, so needs much more gas
            await expect(
                escrow.connect(jurorSigners[2]).castVote(1, 2, { gasLimit: 5000000 }) // LandlordWins
            ).to.emit(escrow, "DisputeResolved");
            
            const dispute = await escrow.getDispute(1);
            expect(dispute.status).to.equal(2); // Resolved
            expect(dispute.tenantWins).to.be.true;
            
            const agreement = await escrow.getAgreementDetails(1);
            expect(agreement.status).to.equal(3); // Completed
        });
        
        it("Should distribute rewards to correct voters", async function () {
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            const assignedJurors = await escrow.getAssignedJurors(1);
            
            // Map addresses to signers
            const jurorSigners = [];
            for (let addr of assignedJurors) {
                if (addr === juror1.address) jurorSigners.push(juror1);
                else if (addr === juror2.address) jurorSigners.push(juror2);
                else if (addr === juror3.address) jurorSigners.push(juror3);
            }
            
            // Track initial stats
            const initialStats0 = await escrow.getJurorStats(jurorSigners[0].address);
            const initialStats1 = await escrow.getJurorStats(jurorSigners[1].address);
            
            // Vote: 2 for tenant, 1 for landlord
            await escrow.connect(jurorSigners[0]).castVote(1, 1, { gasLimit: 500000 }); // TenantWins
            await escrow.connect(jurorSigners[1]).castVote(1, 1, { gasLimit: 500000 }); // TenantWins
            await escrow.connect(jurorSigners[2]).castVote(1, 2, { gasLimit: 5000000 }); // LandlordWins - triggers resolution
            
            // Check stats after resolution
            const finalStats0 = await escrow.getJurorStats(jurorSigners[0].address);
            const finalStats1 = await escrow.getJurorStats(jurorSigners[1].address);
            const finalStats2 = await escrow.getJurorStats(jurorSigners[2].address);
            
            // Jurors 0 and 1 should have earned rewards
            expect(finalStats0.correctVotes).to.equal(initialStats0.correctVotes + 1n);
            expect(finalStats1.correctVotes).to.equal(initialStats1.correctVotes + 1n);
            expect(finalStats0.totalEarned).to.be.gt(initialStats0.totalEarned);
            expect(finalStats1.totalEarned).to.be.gt(initialStats1.totalEarned);
            
            // Juror 2 should not have earned
            expect(finalStats2.correctVotes).to.equal(0);
        });
        
        it("Should allow submitting additional evidence", async function () {
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            await expect(
                escrow.connect(landlord).submitEvidence(1, "ipfs://counter-evidence", { gasLimit: 200000 })
            ).to.emit(escrow, "EvidenceSubmitted")
            .withArgs(1, landlord.address, "ipfs://counter-evidence");
        });
        
        it("Should resolve dispute after voting period", async function () {
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            // Fast forward past voting period
            await time.increase(VOTING_PERIOD + 1);
            
            await expect(
                escrow.resolveDispute(1, { gasLimit: 500000 })
            ).to.emit(escrow, "DisputeResolved");
        });
    });
    
    describe("Platform Fee Management", function () {
        it("Should update platform fee", async function () {
            const newFee = 200; // 2%
            
            await expect(
                escrow.updatePlatformFee(newFee, { gasLimit: 100000 })
            ).to.emit(escrow, "PlatformFeeUpdated")
            .withArgs(100, newFee);
            
            expect(await escrow.platformFeePercent()).to.equal(newFee);
        });
        
        it("Should not allow fee above maximum", async function () {
            const tooHighFee = 1001; // > 10%
            
            await expect(
                escrow.updatePlatformFee(tooHighFee, { gasLimit: 100000 })
            ).to.be.revertedWith("Fee too high");
        });
        
        it("Should withdraw accumulated fees", async function () {
            // Create agreement and release rent to accumulate fees
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            await escrow.releaseRentToLandlord(1, { gasLimit: 200000 });
            
            const fees = await escrow.accumulatedFees();
            expect(fees).to.be.gt(0);
            
            const initialBalance = await ethers.provider.getBalance(owner.address);
            
            await escrow.withdrawFees(owner.address, { gasLimit: 200000 });
            
            const finalBalance = await ethers.provider.getBalance(owner.address);
            expect(finalBalance).to.be.closeTo(
                initialBalance + fees,
                ethers.parseEther("0.01")
            );
            
            expect(await escrow.accumulatedFees()).to.equal(0);
        });
        
        it("Should not allow withdrawing zero fees", async function () {
            await expect(
                escrow.withdrawFees(owner.address, { gasLimit: 200000 })
            ).to.be.revertedWith("No fees to withdraw");
        });
    });
    
    describe("Pause Functionality", function () {
        it("Should pause and unpause contract", async function () {
            await escrow.pause({ gasLimit: 100000 });
            
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            
            await expect(
                escrow.connect(tenant).createAgreement({
                    landlord: landlord.address,
                    nftContract: await rentalNFT.getAddress(),
                    tokenId: 1,
                    rentAmount: RENT_AMOUNT,
                    depositAmount: DEPOSIT_AMOUNT,
                    disputeFee: DISPUTE_FEE,
                    durationMonths: DURATION_MONTHS
                }, { value: totalPayment, gasLimit: 500000 })
            ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
            
            await escrow.unpause({ gasLimit: 100000 });
            
            // Should work after unpause
            await expect(
                escrow.connect(tenant).createAgreement({
                    landlord: landlord.address,
                    nftContract: await rentalNFT.getAddress(),
                    tokenId: 1,
                    rentAmount: RENT_AMOUNT,
                    depositAmount: DEPOSIT_AMOUNT,
                    disputeFee: DISPUTE_FEE,
                    durationMonths: DURATION_MONTHS
                }, { value: totalPayment, gasLimit: 500000 })
            ).to.emit(escrow, "AgreementCreated");
        });
        
        it("Should only allow owner to pause", async function () {
            await expect(
                escrow.connect(tenant).pause({ gasLimit: 100000 })
            ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
        });
    });
    
    describe("View Functions", function () {
        beforeEach(async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
        });
        
        it("Should get agreement by token ID", async function () {
            const agreementId = await escrow.getAgreementByToken(1);
            expect(agreementId).to.equal(1);
        });
        
        it("Should get total agreements count", async function () {
            expect(await escrow.getTotalAgreements()).to.equal(1);
        });
        
        it("Should get contract balance", async function () {
            const expectedBalance = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            expect(await escrow.getContractBalance()).to.equal(expectedBalance);
        });
        
        it("Should get juror pool size", async function () {
            await escrow.connect(juror1).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            await escrow.connect(juror2).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            
            expect(await escrow.getJurorPoolSize()).to.equal(2);
        });
    });
    
    describe("Edge Cases", function () {
        it("Should handle multiple agreements from same tenant", async function () {
            // First agreement
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            // Mint another NFT
            await rentalNFT.mint(
                landlord.address,
                "ipfs://test-uri-2"
            );
            await rentalNFT.connect(landlord).approve(await escrow.getAddress(), 2);
            
            // Second agreement
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 2,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            const tenantAgreements = await escrow.getTenantAgreements(tenant.address);
            expect(tenantAgreements.length).to.equal(2);
            expect(await escrow.getTotalAgreements()).to.equal(2);
        });
        
        it("Should prevent creating agreement with zero values", async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            
            await expect(
                escrow.connect(tenant).createAgreement({
                    landlord: landlord.address,
                    nftContract: await rentalNFT.getAddress(),
                    tokenId: 1,
                    rentAmount: 0,
                    depositAmount: DEPOSIT_AMOUNT,
                    disputeFee: DISPUTE_FEE,
                    durationMonths: DURATION_MONTHS
                }, { value: totalPayment, gasLimit: 500000 })
            ).to.be.revertedWith("Invalid rent");
            
            await expect(
                escrow.connect(tenant).createAgreement({
                    landlord: landlord.address,
                    nftContract: await rentalNFT.getAddress(),
                    tokenId: 1,
                    rentAmount: RENT_AMOUNT,
                    depositAmount: 0,
                    disputeFee: DISPUTE_FEE,
                    durationMonths: DURATION_MONTHS
                }, { value: totalPayment, gasLimit: 500000 })
            ).to.be.revertedWith("Invalid deposit");
            
            await expect(
                escrow.connect(tenant).createAgreement({
                    landlord: landlord.address,
                    nftContract: await rentalNFT.getAddress(),
                    tokenId: 1,
                    rentAmount: RENT_AMOUNT,
                    depositAmount: DEPOSIT_AMOUNT,
                    disputeFee: 0,
                    durationMonths: DURATION_MONTHS
                }, { value: totalPayment, gasLimit: 500000 })
            ).to.be.revertedWith("Invalid dispute fee");
        });
        
        it("Should prevent renting to yourself", async function () {
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            
            await expect(
                escrow.connect(landlord).createAgreement({
                    landlord: landlord.address,
                    nftContract: await rentalNFT.getAddress(),
                    tokenId: 1,
                    rentAmount: RENT_AMOUNT,
                    depositAmount: DEPOSIT_AMOUNT,
                    disputeFee: DISPUTE_FEE,
                    durationMonths: DURATION_MONTHS
                }, { value: totalPayment, gasLimit: 500000 })
            ).to.be.revertedWith("Cannot rent to yourself");
        });
        
        it("Should handle juror unstaking with no active disputes", async function () {
            await escrow.connect(juror1).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            
            // Wait for unstake delay
            await time.increase(UNSTAKE_DELAY + 1);
            
            // Should successfully unstake
            await expect(escrow.connect(juror1).unstake({ gasLimit: 200000 }))
                .to.emit(escrow, "JurorUnstaked")
                .withArgs(juror1.address, MIN_STAKE);
        });
        
        it("Should prevent juror unstaking with active disputes", async function () {
            // Setup
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            await escrow.connect(juror1).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            await escrow.connect(juror2).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            await escrow.connect(juror3).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            
            // Raise dispute
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            // Wait for unstake delay
            await time.increase(UNSTAKE_DELAY + 1);
            
            // Try to unstake assigned jurors
            const assignedJurors = await escrow.getAssignedJurors(1);
            for (let addr of assignedJurors) {
                let juror;
                if (addr === juror1.address) juror = juror1;
                else if (addr === juror2.address) juror = juror2;
                else if (addr === juror3.address) juror = juror3;
                
                if (juror) {
                    await expect(
                        escrow.connect(juror).unstake({ gasLimit: 200000 })
                    ).to.be.revertedWith("Has active disputes");
                }
            }
        });
    });
    
    describe("Integration Tests", function () {
        it("Should handle complete rental lifecycle", async function () {
            // 1. Create agreement
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            // 2. Landlord releases rent
            await escrow.connect(landlord).releaseRentToLandlord(1, { gasLimit: 200000 });
            
            // 3. Time passes
            await time.increase(DURATION_MONTHS * 30 * 24 * 60 * 60);
            
            // 4. Tenant gets deposit back
            await escrow.connect(tenant).returnDepositToTenant(1, { gasLimit: 200000 });
            
            // 5. Check agreement completed
            const agreement = await escrow.getAgreementDetails(1);
            expect(agreement.status).to.equal(3); // Completed
        });
        
        it("Should handle complete dispute lifecycle", async function () {
            // 1. Create agreement
            const totalPayment = RENT_AMOUNT + DEPOSIT_AMOUNT + DISPUTE_FEE;
            await escrow.connect(tenant).createAgreement({
                landlord: landlord.address,
                nftContract: await rentalNFT.getAddress(),
                tokenId: 1,
                rentAmount: RENT_AMOUNT,
                depositAmount: DEPOSIT_AMOUNT,
                disputeFee: DISPUTE_FEE,
                durationMonths: DURATION_MONTHS
            }, { value: totalPayment, gasLimit: 500000 });
            
            // 2. Setup jurors
            await escrow.connect(juror1).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            await escrow.connect(juror2).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            await escrow.connect(juror3).stakeAsJuror({ value: MIN_STAKE, gasLimit: 200000 });
            
            // 3. Raise dispute
            await escrow.connect(tenant).raiseDispute(1, "ipfs://evidence", { gasLimit: 10000000 });
            
            // 4. Submit additional evidence
            await escrow.connect(landlord).submitEvidence(1, "ipfs://counter-evidence", { gasLimit: 200000 });
            
            // 5. Jurors vote
            const assignedJurors = await escrow.getAssignedJurors(1);
            const jurorSigners = [];
            for (let addr of assignedJurors) {
                if (addr === juror1.address) jurorSigners.push(juror1);
                else if (addr === juror2.address) jurorSigners.push(juror2);
                else if (addr === juror3.address) jurorSigners.push(juror3);
            }
            
            await escrow.connect(jurorSigners[0]).castVote(1, 1, { gasLimit: 500000 }); // TenantWins
            await escrow.connect(jurorSigners[1]).castVote(1, 1, { gasLimit: 500000 }); // TenantWins
            await escrow.connect(jurorSigners[2]).castVote(1, 2, { gasLimit: 5000000 }); // LandlordWins - triggers resolution
            
            // 6. Check resolution
            const dispute = await escrow.getDispute(1);
            expect(dispute.status).to.equal(2); // Resolved
            expect(dispute.tenantWins).to.be.true;
            
            const agreement = await escrow.getAgreementDetails(1);
            expect(agreement.status).to.equal(3); // Completed
        });
    });
});

// Mock RentalNFT contract for testing
// Save this as contracts/mocks/RentalNFT.sol
/*
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RentalNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    struct Property {
        string metadataURI;
        string propertyName;
        string propertyAddress;
        uint256 monthlyRent;
    }
    
    mapping(uint256 => Property) public properties;
    
    constructor() ERC721("RentalNFT", "RENT") {}
    
    function mintProperty(
        address to,
        string memory metadataURI,
        string memory propertyName,
        string memory propertyAddress,
        uint256 monthlyRent
    ) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(to, newTokenId);
        
        properties[newTokenId] = Property({
            metadataURI: metadataURI,
            propertyName: propertyName,
            propertyAddress: propertyAddress,
            monthlyRent: monthlyRent
        });
        
        return newTokenId;
    }
}
*/