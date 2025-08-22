const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FairBNB Contract", function () {
  let fairBNB;
  let owner, landlord, tenant, jury, newJury, user1, user2;

  // Realistic IPFS URIs for property metadata
  const PROPERTY_1_URI = "ipfs://QmXvKzB5VD8p3dH7xJ6hQkP4ZR5SmV9UjqWHm8QvYzB1x9"; // 2BHK Mumbai
  const PROPERTY_2_URI = "ipfs://QmYpQzB8VD9p4dI8yK7iRlQ5aS6TnW0VkrXIn9RwZaC2yA"; // 3BHK Delhi
  const PROPERTY_3_URI = "ipfs://QmZpQzB8VD9p4dI8yK7iRlQ5aS6TnW0VkrXIn9RwZaC2yB"; // 1BHK Bangalore
  const PLACEHOLDER_URI = "ipfs://QmPLACEHOLDER"; // Used if minting before IPFS upload

  // Rental amounts (small for testnet)
  const RENT = ethers.parseEther("0.00002");        // ~0.00002 tBNB rent
  const DEPOSIT = ethers.parseEther("0.00001");     // ~0.00001 tBNB deposit
  const DISPUTE_FEE = ethers.parseEther("0.000001"); // ~0.000001 tBNB dispute fee
  const TOTAL_PAYMENT = RENT + DEPOSIT + DISPUTE_FEE;

  beforeEach(async function () {
    // Get signers
    [owner, landlord, tenant, jury, newJury, user1, user2] = await ethers.getSigners();
    
    // Deploy contract
    const FairBNB = await ethers.getContractFactory("FairBNB");
    fairBNB = await FairBNB.deploy();
    await fairBNB.waitForDeployment();
    
    // Change jury to our test jury address
    await fairBNB.changeJury(jury.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await fairBNB.name()).to.equal("FairBNB Property");
      expect(await fairBNB.symbol()).to.equal("FBNB");
    });

    it("Should have correct initial jury address", async function () {
      // We changed it in beforeEach
      expect(await fairBNB.jury()).to.equal(jury.address);
    });

    it("Should start with 0 total supply", async function () {
      expect(await fairBNB.totalSupply()).to.equal(0);
    });
  });

  describe("Minting Properties", function () {
    it("Should mint a property NFT with IPFS metadata", async function () {
      // Simulate: Upload to IPFS first, get CID, then mint
      await expect(fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI))
        .to.emit(fairBNB, "PropertyMinted")
        .withArgs(1, landlord.address, PROPERTY_1_URI);
      
      expect(await fairBNB.ownerOf(1)).to.equal(landlord.address);
      expect(await fairBNB.tokenURI(1)).to.equal(PROPERTY_1_URI);
      expect(await fairBNB.totalSupply()).to.equal(1);
    });

    it("Should track user tokens correctly", async function () {
      // Upload to IPFS first (simulated), then mint
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
      await fairBNB.connect(landlord).mintProperty(PROPERTY_2_URI);
      
      const userTokens = await fairBNB.getUserTokens(landlord.address);
      expect(userTokens.length).to.equal(2);
      expect(userTokens[0]).to.equal(1);
      expect(userTokens[1]).to.equal(2);
      
      expect(await fairBNB.getUserTokenCount(landlord.address)).to.equal(2);
    });

    it("Should increment token IDs correctly", async function () {
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
      await fairBNB.connect(user1).mintProperty(PROPERTY_2_URI);
      
      expect(await fairBNB.ownerOf(1)).to.equal(landlord.address);
      expect(await fairBNB.ownerOf(2)).to.equal(user1.address);
    });
  });

  describe("Listing Properties", function () {
    beforeEach(async function () {
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
    });

    it("Should list a property for rent", async function () {
      await expect(fairBNB.connect(landlord).listProperty(1, RENT, DEPOSIT, DISPUTE_FEE))
        .to.emit(fairBNB, "PropertyListed")
        .withArgs(1, RENT, DEPOSIT, DISPUTE_FEE);
      
      const listing = await fairBNB.getListingDetails(1);
      expect(listing.rent).to.equal(RENT);
      expect(listing.deposit).to.equal(DEPOSIT);
      expect(listing.disputeFee).to.equal(DISPUTE_FEE);
      expect(listing.isListed).to.be.true;
    });

    it("Should allow anyone to list any property (permissive)", async function () {
      // User2 lists landlord's property (shouldn't revert)
      await expect(fairBNB.connect(user2).listProperty(1, RENT, DEPOSIT, DISPUTE_FEE))
        .to.not.be.reverted;
    });
  });

  describe("Renting Properties", function () {
    beforeEach(async function () {
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
      await fairBNB.connect(landlord).listProperty(1, RENT, DEPOSIT, DISPUTE_FEE);
    });

    it("Should rent a property with correct payment", async function () {
      await expect(fairBNB.connect(tenant).rentProperty(1, { value: TOTAL_PAYMENT }))
        .to.emit(fairBNB, "PropertyRented")
        .withArgs(1, tenant.address, TOTAL_PAYMENT);
      
      const rental = await fairBNB.getRentalDetails(1);
      expect(rental.landlord).to.equal(landlord.address);
      expect(rental.tenant).to.equal(tenant.address);
      expect(rental.rent).to.equal(RENT);
      expect(rental.deposit).to.equal(DEPOSIT);
      expect(rental.disputeFee).to.equal(DISPUTE_FEE);
      expect(rental.isActive).to.be.true;
      expect(rental.tenantHappy).to.be.false;
      expect(rental.landlordHappy).to.be.false;
    });

    it("Should accept any payment amount (no reverts)", async function () {
      // Send less than required
      await expect(fairBNB.connect(tenant).rentProperty(1, { value: ethers.parseEther("0.00001") }))
        .to.not.be.reverted;
      
      // Send more than required
      await expect(fairBNB.connect(user1).rentProperty(1, { value: ethers.parseEther("0.1") }))
        .to.not.be.reverted;
    });
  });

  describe("Happy Path Flow", function () {
    beforeEach(async function () {
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
      await fairBNB.connect(landlord).listProperty(1, RENT, DEPOSIT, DISPUTE_FEE);
      await fairBNB.connect(tenant).rentProperty(1, { value: TOTAL_PAYMENT });
    });

    it("Should complete rental when tenant confirms happy", async function () {
      await expect(fairBNB.connect(tenant).confirmHappy(1, false))
        .to.emit(fairBNB, "HappyConfirmed")
        .withArgs(1, tenant.address, false);
      
      // Check funds are allocated
      expect(await fairBNB.pendingWithdrawals(landlord.address)).to.equal(RENT + DEPOSIT);
      expect(await fairBNB.pendingWithdrawals(tenant.address)).to.equal(DISPUTE_FEE);
      
      // Rental should be inactive
      const rental = await fairBNB.getRentalDetails(1);
      expect(rental.isActive).to.be.false;
    });

    it("Should complete rental when landlord confirms happy", async function () {
      await expect(fairBNB.connect(landlord).confirmHappy(1, true))
        .to.emit(fairBNB, "HappyConfirmed")
        .withArgs(1, landlord.address, true);
      
      // Check funds are allocated
      expect(await fairBNB.pendingWithdrawals(landlord.address)).to.equal(RENT + DEPOSIT);
      expect(await fairBNB.pendingWithdrawals(tenant.address)).to.equal(DISPUTE_FEE);
    });

    it("Should allow withdrawals after happy path", async function () {
      await fairBNB.connect(tenant).confirmHappy(1, false);
      
      const landlordBalanceBefore = await ethers.provider.getBalance(landlord.address);
      await fairBNB.connect(landlord).withdraw();
      const landlordBalanceAfter = await ethers.provider.getBalance(landlord.address);
      
      // Landlord should receive rent + deposit (minus gas)
      expect(landlordBalanceAfter).to.be.gt(landlordBalanceBefore);
      
      // Tenant withdraws dispute fee
      const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);
      await fairBNB.connect(tenant).withdraw();
      const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);
      
      expect(tenantBalanceAfter).to.be.gt(tenantBalanceBefore);
    });
  });

  describe("Dispute Resolution", function () {
    beforeEach(async function () {
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
      await fairBNB.connect(landlord).listProperty(1, RENT, DEPOSIT, DISPUTE_FEE);
      await fairBNB.connect(tenant).rentProperty(1, { value: TOTAL_PAYMENT });
    });

    it("Should raise a dispute", async function () {
      await expect(fairBNB.connect(tenant).raiseDispute(1))
        .to.emit(fairBNB, "DisputeRaised")
        .withArgs(1);
      
      const rental = await fairBNB.getRentalDetails(1);
      expect(rental.isDisputed).to.be.true;
    });

    it("Should resolve dispute in favor of tenant", async function () {
      await fairBNB.connect(tenant).raiseDispute(1);
      
      const juryReward = DISPUTE_FEE / 2n;
      const tenantRefund = RENT + DEPOSIT + juryReward;
      
      await expect(fairBNB.connect(jury).resolveDispute(1, true))
        .to.emit(fairBNB, "DisputeResolved")
        .withArgs(1, true, juryReward);
      
      expect(await fairBNB.pendingWithdrawals(tenant.address)).to.equal(tenantRefund);
      expect(await fairBNB.pendingWithdrawals(jury.address)).to.equal(juryReward);
      
      const rental = await fairBNB.getRentalDetails(1);
      expect(rental.isActive).to.be.false;
      expect(rental.isDisputed).to.be.false;
    });

    it("Should resolve dispute in favor of landlord", async function () {
      await fairBNB.connect(tenant).raiseDispute(1);
      
      const juryReward = DISPUTE_FEE / 2n;
      
      await expect(fairBNB.connect(jury).resolveDispute(1, false))
        .to.emit(fairBNB, "DisputeResolved")
        .withArgs(1, false, juryReward);
      
      expect(await fairBNB.pendingWithdrawals(landlord.address)).to.equal(RENT + DEPOSIT);
      expect(await fairBNB.pendingWithdrawals(jury.address)).to.equal(juryReward);
    });

    it("Should allow anyone to resolve dispute (permissive)", async function () {
      await fairBNB.connect(tenant).raiseDispute(1);
      
      // Random user resolves dispute (shouldn't revert)
      await expect(fairBNB.connect(user2).resolveDispute(1, true))
        .to.not.be.reverted;
    });
  });

  describe("Jury Management", function () {
    it("Should change jury address", async function () {
      await expect(fairBNB.connect(owner).changeJury(newJury.address))
        .to.emit(fairBNB, "JuryChanged")
        .withArgs(jury.address, newJury.address);
      
      expect(await fairBNB.jury()).to.equal(newJury.address);
    });

    it("Should allow anyone to change jury (permissive)", async function () {
      await expect(fairBNB.connect(user1).changeJury(user2.address))
        .to.not.be.reverted;
      
      expect(await fairBNB.jury()).to.equal(user2.address);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Setup: Create 3 properties with IPFS metadata, list 2, rent 1
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
      await fairBNB.connect(landlord).mintProperty(PROPERTY_2_URI);
      await fairBNB.connect(user1).mintProperty(PROPERTY_3_URI);
      
      await fairBNB.connect(landlord).listProperty(1, RENT, DEPOSIT, DISPUTE_FEE);
      await fairBNB.connect(landlord).listProperty(2, RENT * 2n, DEPOSIT * 2n, DISPUTE_FEE);
      
      await fairBNB.connect(tenant).rentProperty(1, { value: TOTAL_PAYMENT });
    });

    it("Should get all properties", async function () {
      const properties = await fairBNB.getAllProperties();
      expect(properties.length).to.equal(3);
      expect(properties[0]).to.equal(1);
      expect(properties[1]).to.equal(2);
      expect(properties[2]).to.equal(3);
    });

    it("Should get all NFTs with details", async function () {
      const result = await fairBNB.getAllNFTsWithDetails();
      
      expect(result.tokenIds.length).to.equal(3);
      expect(result.owners[0]).to.equal(landlord.address);
      expect(result.owners[2]).to.equal(user1.address);
      expect(result.isListed[0]).to.be.true;
      expect(result.isListed[2]).to.be.false;
      expect(result.isRented[0]).to.be.true;
      expect(result.isRented[1]).to.be.false;
    });

    it("Should get available listings only", async function () {
      const result = await fairBNB.getAvailableListings();
      
      // Only property 2 is listed and not rented
      expect(result.availableTokenIds.length).to.equal(1);
      expect(result.availableTokenIds[0]).to.equal(2);
      expect(result.landlords[0]).to.equal(landlord.address);
      expect(result.rents[0]).to.equal(RENT * 2n);
    });

    it("Should get user tokens", async function () {
      const landlordTokens = await fairBNB.getUserTokens(landlord.address);
      expect(landlordTokens.length).to.equal(2);
      expect(landlordTokens[0]).to.equal(1);
      expect(landlordTokens[1]).to.equal(2);
      
      const user1Tokens = await fairBNB.getUserTokens(user1.address);
      expect(user1Tokens.length).to.equal(1);
      expect(user1Tokens[0]).to.equal(3);
    });
  });

  describe("NFT Transfers", function () {
    beforeEach(async function () {
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
      await fairBNB.connect(landlord).mintProperty(PROPERTY_2_URI);
    });

    it("Should update user tokens on transfer", async function () {
      // Initial state
      expect(await fairBNB.getUserTokenCount(landlord.address)).to.equal(2);
      expect(await fairBNB.getUserTokenCount(user1.address)).to.equal(0);
      
      // Transfer token 1 from landlord to user1
      await fairBNB.connect(landlord).transferFrom(landlord.address, user1.address, 1);
      
      // Check updated ownership
      expect(await fairBNB.ownerOf(1)).to.equal(user1.address);
      expect(await fairBNB.getUserTokenCount(landlord.address)).to.equal(1);
      expect(await fairBNB.getUserTokenCount(user1.address)).to.equal(1);
      
      const landlordTokens = await fairBNB.getUserTokens(landlord.address);
      expect(landlordTokens[0]).to.equal(2);
      
      const user1Tokens = await fairBNB.getUserTokens(user1.address);
      expect(user1Tokens[0]).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle minting with empty URI", async function () {
      await expect(fairBNB.connect(landlord).mintProperty(""))
        .to.not.be.reverted;
    });

    it("Should handle multiple rentals on same property", async function () {
      await fairBNB.connect(landlord).mintProperty(PROPERTY_1_URI);
      await fairBNB.connect(landlord).listProperty(1, RENT, DEPOSIT, DISPUTE_FEE);
      
      // First rental
      await fairBNB.connect(tenant).rentProperty(1, { value: TOTAL_PAYMENT });
      
      // Second rental overwrites first (permissive design)
      await fairBNB.connect(user1).rentProperty(1, { value: TOTAL_PAYMENT });
      
      const rental = await fairBNB.getRentalDetails(1);
      expect(rental.tenant).to.equal(user1.address);
    });

    it("Should handle withdraw with zero balance", async function () {
      await expect(fairBNB.connect(user1).withdraw())
        .to.not.be.reverted;
    });

    it("Should accept BNB via fallback", async function () {
      await expect(owner.sendTransaction({
        to: await fairBNB.getAddress(),
        value: ethers.parseEther("0.001") // Small amount for testnet
      })).to.not.be.reverted;
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should efficiently handle multiple properties", async function () {
      // Mint 10 properties
      for (let i = 0; i < 10; i++) {
        await fairBNB.connect(landlord).mintProperty(`ipfs://Qm${i}`);
      }
      
      expect(await fairBNB.totalSupply()).to.equal(10);
      
      // Get all properties should still work
      const allProps = await fairBNB.getAllProperties();
      expect(allProps.length).to.equal(10);
    });
  });
});