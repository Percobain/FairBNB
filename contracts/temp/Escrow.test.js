const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Escrow", function () {
  // Deploy fixture
  async function deployEscrowFixture() {
    const [owner, landlord, tenant, tenant2, disputeDAO, platform, other] = await ethers.getSigners();

    // Deploy RentalNFT
    const RentalNFT = await ethers.getContractFactory("RentalNFT");
    const rentalNFT = await RentalNFT.deploy("FairBNB Rental", "FBNB");
    await rentalNFT.waitForDeployment();

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    // Setup contracts
    await rentalNFT.setEscrowContract(await escrow.getAddress());
    await escrow.setContracts(
      await rentalNFT.getAddress(),
      disputeDAO.address
    );

    // Grant landlord role and mint a property NFT
    await rentalNFT.grantLandlordRole(landlord.address);
    const tokenURI = "greenfield://fairbnb-bucket/metadata/property1.json";
    await rentalNFT.connect(landlord).mint(landlord.address, tokenURI);

    // Sample rental terms (0.001-0.009 BNB range)
    const rentalTerms = {
      rentAmount: ethers.parseEther("0.002"),
      depositAmount: ethers.parseEther("0.004"),
      disputeFee: ethers.parseEther("0.001"),
      durationMonths: 12,
      tokenId: 1
    };

    const totalRequired = rentalTerms.rentAmount + rentalTerms.depositAmount + rentalTerms.disputeFee;

    // Helper to create agreement and return params
    async function createAgreementHelper(signer = tenant, overrides = {}) {
      const params = {
        landlord: landlord.address,
        nftContract: await rentalNFT.getAddress(),
        tokenId: rentalTerms.tokenId,
        rentAmount: rentalTerms.rentAmount,
        depositAmount: rentalTerms.depositAmount,
        disputeFee: rentalTerms.disputeFee,
        durationMonths: rentalTerms.durationMonths,
        ...overrides
      };
      
      // Calculate total for overridden amounts
      const total = (overrides.rentAmount || rentalTerms.rentAmount) +
                   (overrides.depositAmount || rentalTerms.depositAmount) +
                   (overrides.disputeFee || rentalTerms.disputeFee);
      
      if (signer) {
        await escrow.connect(signer).createAgreement(params, { value: total });
      }
      
      return { params, total };
    }

    return {
      escrow,
      rentalNFT,
      owner,
      landlord,
      tenant,
      tenant2,
      disputeDAO,
      platform,
      other,
      rentalTerms,
      totalRequired,
      createAgreementHelper
    };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);
      expect(await escrow.platformFeePercent()).to.equal(100); // 1%
      expect(await escrow.accumulatedFees()).to.equal(0);
    });

    it("Should set contracts correctly", async function () {
      const { escrow, rentalNFT, disputeDAO } = await loadFixture(deployEscrowFixture);
      expect(await escrow.rentalNFT()).to.equal(await rentalNFT.getAddress());
      expect(await escrow.disputeDAO()).to.equal(disputeDAO.address);
    });
  });

  describe("Agreement Creation", function () {
    it("Should create an agreement successfully", async function () {
      const { escrow, rentalNFT, landlord, tenant, rentalTerms, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      const { params, total } = await createAgreementHelper(null);
      
      await expect(escrow.connect(tenant).createAgreement(params, { value: total }))
        .to.emit(escrow, "AgreementCreated")
        .withArgs(1, landlord.address, tenant.address, rentalTerms.tokenId, total);

      // Verify agreement details
      const agreement = await escrow.getAgreement(1);
      expect(agreement.landlord).to.equal(landlord.address);
      expect(agreement.tenant).to.equal(tenant.address);
      expect(agreement.rentAmount).to.equal(rentalTerms.rentAmount);
      expect(agreement.depositAmount).to.equal(rentalTerms.depositAmount);
      expect(agreement.status).to.equal(1); // Active

      // Verify NFT transferred to tenant
      expect(await rentalNFT.ownerOf(rentalTerms.tokenId)).to.equal(tenant.address);
    });

    it("Should track agreements by tenant and landlord", async function () {
      const { escrow, tenant, landlord, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      const tenantAgreements = await escrow.getTenantAgreements(tenant.address);
      expect(tenantAgreements.length).to.equal(1);
      expect(tenantAgreements[0]).to.equal(1);

      const landlordAgreements = await escrow.getLandlordAgreements(landlord.address);
      expect(landlordAgreements.length).to.equal(1);
      expect(landlordAgreements[0]).to.equal(1);
    });

    it("Should reject incorrect payment amount", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      const { params } = await createAgreementHelper(null);
      const wrongAmount = ethers.parseEther("0.005");
      
      await expect(escrow.connect(tenant).createAgreement(params, { value: wrongAmount }))
        .to.be.revertedWith("Escrow: Incorrect payment amount");
    });

    it("Should reject if landlord doesn't own NFT", async function () {
      const { escrow, rentalNFT, landlord, tenant, tenant2, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      // Transfer NFT to someone else
      await rentalNFT.connect(landlord).transferFrom(landlord.address, tenant2.address, 1);
      
      const { params, total } = await createAgreementHelper(null);
      
      await expect(escrow.connect(tenant).createAgreement(params, { value: total }))
        .to.be.revertedWith("Escrow: Landlord doesn't own NFT");
    });

    it("Should reject self-rental", async function () {
      const { escrow, landlord, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      const { params, total } = await createAgreementHelper(null);
      
      await expect(escrow.connect(landlord).createAgreement(params, { value: total }))
        .to.be.revertedWith("Escrow: Cannot rent to yourself");
    });

    it("Should reject invalid duration", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      const { params, total } = await createAgreementHelper(null, { durationMonths: 61 });
      
      await expect(escrow.connect(tenant).createAgreement(params, { value: total }))
        .to.be.revertedWith("Escrow: Invalid duration");
    });
  });

  describe("Rent Release", function () {
    it("Should release rent to landlord", async function () {
      const { escrow, landlord, tenant, rentalTerms, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      const landlordBalanceBefore = await ethers.provider.getBalance(landlord.address);
      
      await expect(escrow.connect(tenant).releaseRentToLandlord(1))
        .to.emit(escrow, "RentReleased");

      const landlordBalanceAfter = await ethers.provider.getBalance(landlord.address);
      
      // Landlord should receive rent minus platform fee (1%)
      const expectedAmount = rentalTerms.rentAmount * 99n / 100n;
      expect(landlordBalanceAfter - landlordBalanceBefore).to.be.closeTo(
        expectedAmount,
        ethers.parseEther("0.0001")
      );

      // Check platform fees accumulated
      expect(await escrow.accumulatedFees()).to.equal(rentalTerms.rentAmount / 100n);
    });

    it("Should prevent double withdrawal by landlord", async function () {
      const { escrow, landlord, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);
      await escrow.connect(landlord).releaseRentToLandlord(1);
      
      await expect(escrow.connect(landlord).releaseRentToLandlord(1))
        .to.be.revertedWith("Escrow: Already withdrawn");
    });

    it("Should allow owner to release rent", async function () {
      const { escrow, owner, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await expect(escrow.connect(owner).releaseRentToLandlord(1))
        .to.emit(escrow, "RentReleased");
    });
  });

  describe("Deposit Return", function () {
    it("Should return deposit to tenant after rental period", async function () {
      const { escrow, tenant, rentalTerms, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      // Fast forward time to end of rental period
      await time.increase(rentalTerms.durationMonths * 30 * 24 * 60 * 60);

      const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);
      
      await expect(escrow.connect(tenant).returnDepositToTenant(1))
        .to.emit(escrow, "DepositReturned");

      const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);
      
      // Tenant should receive deposit + dispute fee
      const expectedReturn = rentalTerms.depositAmount + rentalTerms.disputeFee;
      expect(tenantBalanceAfter - tenantBalanceBefore).to.be.closeTo(
        expectedReturn,
        ethers.parseEther("0.001")
      );
    });

    it("Should allow landlord to return deposit early", async function () {
      const { escrow, landlord, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await expect(escrow.connect(landlord).returnDepositToTenant(1))
        .to.emit(escrow, "DepositReturned");
    });

    it("Should prevent tenant from withdrawing deposit early", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await expect(escrow.connect(tenant).returnDepositToTenant(1))
        .to.be.revertedWith("Escrow: Rental period not over");
    });

    it("Should mark agreement as completed after both withdrawals", async function () {
      const { escrow, landlord, tenant, rentalTerms, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await escrow.connect(landlord).releaseRentToLandlord(1);
      
      await time.increase(rentalTerms.durationMonths * 30 * 24 * 60 * 60);
      await expect(escrow.connect(tenant).returnDepositToTenant(1))
        .to.emit(escrow, "AgreementCompleted")
        .withArgs(1);

      const agreement = await escrow.getAgreement(1);
      expect(agreement.status).to.equal(3); // Completed
    });
  });

  describe("Dispute Handling", function () {
    it("Should allow tenant to raise a dispute", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await expect(escrow.connect(tenant).raiseDispute(1, "Property has leaks"))
        .to.emit(escrow, "DisputeRaised")
        .withArgs(1, 1, tenant.address, "Property has leaks");

      const agreement = await escrow.getAgreement(1);
      expect(agreement.status).to.equal(2); // Disputed
    });

    it("Should allow landlord to raise a dispute", async function () {
      const { escrow, landlord, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await expect(escrow.connect(landlord).raiseDispute(1, "Property damage"))
        .to.emit(escrow, "DisputeRaised");
    });

    it("Should prevent non-parties from raising disputes", async function () {
      const { escrow, tenant, other, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await expect(escrow.connect(other).raiseDispute(1, "Random dispute"))
        .to.be.revertedWith("Escrow: Not a party");
    });

    it("Should resolve dispute in favor of tenant", async function () {
      const { escrow, tenant, disputeDAO, rentalTerms, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);
      await escrow.connect(tenant).raiseDispute(1, "Property issues");
      
      const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);
      
      await expect(escrow.connect(disputeDAO).resolveDispute(1, true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1, 1, true);

      const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);
      
      const expectedAmount = rentalTerms.rentAmount + rentalTerms.depositAmount + rentalTerms.disputeFee;
      expect(tenantBalanceAfter - tenantBalanceBefore).to.equal(expectedAmount);
    });

    it("Should resolve dispute in favor of landlord", async function () {
      const { escrow, landlord, tenant, disputeDAO, rentalTerms, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);
      await escrow.connect(landlord).raiseDispute(1, "Property damage");
      
      const landlordBalanceBefore = await ethers.provider.getBalance(landlord.address);
      
      await expect(escrow.connect(disputeDAO).resolveDispute(1, false))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1, 1, false);

      const landlordBalanceAfter = await ethers.provider.getBalance(landlord.address);
      
      const platformFee = rentalTerms.rentAmount / 100n;
      const expectedAmount = rentalTerms.rentAmount + rentalTerms.depositAmount + rentalTerms.disputeFee - platformFee;
      expect(landlordBalanceAfter - landlordBalanceBefore).to.equal(expectedAmount);
    });
  });

  describe("Agreement Cancellation", function () {
    it("Should allow tenant to cancel within 24 hours", async function () {
      const { escrow, rentalNFT, landlord, tenant, rentalTerms, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);
      
      await expect(escrow.connect(tenant).cancelAgreement(1))
        .to.emit(escrow, "AgreementCancelled")
        .withArgs(1);

      const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);
      
      const refund = rentalTerms.rentAmount + rentalTerms.depositAmount;
      expect(tenantBalanceAfter - tenantBalanceBefore).to.be.closeTo(
        refund,
        ethers.parseEther("0.001")
      );

      expect(await rentalNFT.ownerOf(rentalTerms.tokenId)).to.equal(landlord.address);
    });

    it("Should prevent cancellation after 24 hours", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await time.increase(25 * 60 * 60);

      await expect(escrow.connect(tenant).cancelAgreement(1))
        .to.be.revertedWith("Escrow: Cancellation period over");
    });

    it("Should only allow tenant to cancel", async function () {
      const { escrow, landlord, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      await expect(escrow.connect(landlord).cancelAgreement(1))
        .to.be.revertedWith("Escrow: Only tenant can cancel");
    });
  });

  describe("Platform Fee Management", function () {
    it("Should update platform fee", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await expect(escrow.connect(owner).updatePlatformFee(200))
        .to.emit(escrow, "PlatformFeeUpdated")
        .withArgs(100, 200);

      expect(await escrow.platformFeePercent()).to.equal(200);
    });

    it("Should prevent setting fee too high", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await expect(escrow.connect(owner).updatePlatformFee(1001))
        .to.be.revertedWith("Escrow: Fee too high");
    });

    it("Should withdraw accumulated fees", async function () {
      const { escrow, landlord, tenant, owner, platform, rentalTerms, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);
      await escrow.connect(landlord).releaseRentToLandlord(1);
      
      const expectedFees = rentalTerms.rentAmount / 100n;
      expect(await escrow.accumulatedFees()).to.equal(expectedFees);

      const platformBalanceBefore = await ethers.provider.getBalance(platform.address);
      
      await expect(escrow.connect(owner).withdrawFees(platform.address))
        .to.emit(escrow, "FeesWithdrawn")
        .withArgs(platform.address, expectedFees);

      const platformBalanceAfter = await ethers.provider.getBalance(platform.address);
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(expectedFees);
      expect(await escrow.accumulatedFees()).to.equal(0);
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause contract", async function () {
      const { escrow, owner, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).pause();

      const { params, total } = await createAgreementHelper(null);
      
      await expect(escrow.connect(tenant).createAgreement(params, { value: total }))
        .to.be.revertedWithCustomError(escrow, "EnforcedPause");

      await escrow.connect(owner).unpause();

      await expect(escrow.connect(tenant).createAgreement(params, { value: total }))
        .to.emit(escrow, "AgreementCreated");
    });
  });

  describe("View Functions", function () {
    it("Should get agreement by token ID", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      const agreementId = await escrow.getAgreementByToken(1);
      expect(agreementId).to.equal(1);
    });

    it("Should handle multiple agreements", async function () {
      const { escrow, rentalNFT, landlord, tenant, tenant2, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      await createAgreementHelper(tenant);

      // Mint second property
      await rentalNFT.connect(landlord).mint(
        landlord.address,
        "greenfield://fairbnb-bucket/metadata/property2.json"
      );

      // Second agreement with different tenant
      await createAgreementHelper(tenant2, { tokenId: 2 });

      const landlordAgreements = await escrow.getLandlordAgreements(landlord.address);
      expect(landlordAgreements.length).to.equal(2);
      expect(landlordAgreements[0]).to.equal(1);
      expect(landlordAgreements[1]).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amounts correctly", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      const { params, total } = await createAgreementHelper(null, { rentAmount: 0 });
      
      await expect(escrow.connect(tenant).createAgreement(params, { value: total }))
        .to.be.revertedWith("Escrow: Invalid rent");
    });

    it("Should handle maximum duration", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      const { params, total } = await createAgreementHelper(null, { durationMonths: 60 });
      
      await expect(escrow.connect(tenant).createAgreement(params, { value: total }))
        .to.emit(escrow, "AgreementCreated");
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs", async function () {
      const { escrow, tenant, createAgreementHelper } = 
        await loadFixture(deployEscrowFixture);

      const { params, total } = await createAgreementHelper(null);
      
      const tx = await escrow.connect(tenant).createAgreement(params, { value: total });
      const receipt = await tx.wait();
      
      console.log("Gas used for agreement creation:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lt(400000n);
    });
  });
});