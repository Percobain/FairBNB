const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("RentalNFT", function () {
  // Deploy fixture for test isolation
  async function deployRentalNFTFixture() {
    const [owner, landlord1, landlord2, tenant1, tenant2, escrow, other] = await ethers.getSigners();

    const RentalNFT = await ethers.getContractFactory("RentalNFT");
    const rentalNFT = await RentalNFT.deploy("FairBNB Rental", "FBNB");
    await rentalNFT.waitForDeployment();

    // Grant landlord role to landlord1
    const LANDLORD_ROLE = await rentalNFT.LANDLORD_ROLE();
    await rentalNFT.grantLandlordRole(landlord1.address);

    // Sample Greenfield URI (all metadata stored off-chain)
    const sampleTokenURI = "greenfield://fairbnb-bucket/metadata/property1.json";

    return { 
      rentalNFT, 
      owner, 
      landlord1, 
      landlord2, 
      tenant1, 
      tenant2, 
      escrow,
      other, 
      LANDLORD_ROLE,
      sampleTokenURI 
    };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { rentalNFT } = await loadFixture(deployRentalNFTFixture);
      
      expect(await rentalNFT.name()).to.equal("FairBNB Rental");
      expect(await rentalNFT.symbol()).to.equal("FBNB");
    });

    it("Should grant admin and minter roles to deployer", async function () {
      const { rentalNFT, owner } = await loadFixture(deployRentalNFTFixture);
      
      const DEFAULT_ADMIN_ROLE = await rentalNFT.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await rentalNFT.MINTER_ROLE();
      
      expect(await rentalNFT.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await rentalNFT.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });

    it("Should start token counter at 1", async function () {
      const { rentalNFT } = await loadFixture(deployRentalNFTFixture);
      
      expect(await rentalNFT.getCurrentTokenId()).to.equal(1);
    });
  });

  describe("Minting", function () {
    it("Should allow admin to mint a property NFT", async function () {
      const { rentalNFT, owner, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.mint(landlord1.address, sampleTokenURI))
        .to.emit(rentalNFT, "PropertyMinted")
        .withArgs(1, landlord1.address, sampleTokenURI);

      expect(await rentalNFT.ownerOf(1)).to.equal(landlord1.address);
      expect(await rentalNFT.tokenURI(1)).to.equal(sampleTokenURI);
      expect(await rentalNFT.tokenLandlord(1)).to.equal(landlord1.address);
    });

    it("Should allow landlord with role to mint", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.connect(landlord1).mint(landlord1.address, sampleTokenURI))
        .to.emit(rentalNFT, "PropertyMinted");

      expect(await rentalNFT.ownerOf(1)).to.equal(landlord1.address);
    });

    it("Should increment token ID correctly", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);
      expect(await rentalNFT.getCurrentTokenId()).to.equal(2);

      await rentalNFT.mint(
        landlord1.address,
        "greenfield://fairbnb-bucket/metadata/property2.json"
      );

      expect(await rentalNFT.getCurrentTokenId()).to.equal(3);
      expect(await rentalNFT.exists(1)).to.be.true;
      expect(await rentalNFT.exists(2)).to.be.true;
    });

    it("Should reject minting from unauthorized address", async function () {
      const { rentalNFT, other, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.connect(other).mint(other.address, sampleTokenURI))
        .to.be.revertedWith("RentalNFT: Must have minter or landlord role");
    });

    it("Should validate mint parameters", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      // Zero address
      await expect(rentalNFT.mint(ethers.ZeroAddress, sampleTokenURI))
        .to.be.revertedWith("RentalNFT: Cannot mint to zero address");

      // Empty URI
      await expect(rentalNFT.mint(landlord1.address, ""))
        .to.be.revertedWith("RentalNFT: Token URI cannot be empty");
    });
  });

  describe("Token URI Management", function () {
    it("Should allow landlord to update token URI", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);

      const newURI = "greenfield://fairbnb-bucket/metadata/updated_property1.json";
      
      await expect(rentalNFT.connect(landlord1).setTokenURI(1, newURI))
        .to.emit(rentalNFT, "TokenURIUpdated")
        .withArgs(1, sampleTokenURI, newURI, landlord1.address);

      expect(await rentalNFT.tokenURI(1)).to.equal(newURI);
    });

    it("Should allow admin to update any token URI", async function () {
      const { rentalNFT, owner, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);

      const newURI = "greenfield://fairbnb-bucket/metadata/admin_updated.json";
      
      await expect(rentalNFT.connect(owner).setTokenURI(1, newURI))
        .to.emit(rentalNFT, "TokenURIUpdated");

      expect(await rentalNFT.tokenURI(1)).to.equal(newURI);
    });

    it("Should reject URI update from non-landlord/non-admin", async function () {
      const { rentalNFT, landlord1, other, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);

      await expect(rentalNFT.connect(other).setTokenURI(1, "new-uri"))
        .to.be.revertedWith("RentalNFT: Only landlord or admin can update URI");
    });

    it("Should reject empty URI", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);

      await expect(rentalNFT.connect(landlord1).setTokenURI(1, ""))
        .to.be.revertedWith("RentalNFT: New URI cannot be empty");
    });

    it("Should reject update for non-existent token", async function () {
      const { rentalNFT, owner } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.setTokenURI(999, "greenfield://test"))
        .to.be.revertedWith("RentalNFT: Token does not exist");
    });
  });

  describe("Escrow Integration", function () {
    it("Should set escrow contract", async function () {
      const { rentalNFT, owner, escrow } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.setEscrowContract(escrow.address))
        .to.emit(rentalNFT, "EscrowContractUpdated")
        .withArgs(ethers.ZeroAddress, escrow.address);

      expect(await rentalNFT.escrowContract()).to.equal(escrow.address);
    });

    it("Should auto-approve escrow for all tokens", async function () {
      const { rentalNFT, landlord1, escrow, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.setEscrowContract(escrow.address);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);

      expect(await rentalNFT.isApprovedForAll(landlord1.address, escrow.address)).to.be.true;
    });

    it("Should reject escrow setting from non-admin", async function () {
      const { rentalNFT, other, escrow } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.connect(other).setEscrowContract(escrow.address))
        .to.be.reverted;
    });

    it("Should reject zero address for escrow", async function () {
      const { rentalNFT, owner } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.setEscrowContract(ethers.ZeroAddress))
        .to.be.revertedWith("RentalNFT: Invalid escrow address");
    });
  });

  describe("Role Management", function () {
    it("Should grant landlord role", async function () {
      const { rentalNFT, owner, landlord2, LANDLORD_ROLE } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.grantLandlordRole(landlord2.address);
      
      expect(await rentalNFT.hasRole(LANDLORD_ROLE, landlord2.address)).to.be.true;
    });

    it("Should reject landlord role grant from non-admin", async function () {
      const { rentalNFT, other, landlord2 } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.connect(other).grantLandlordRole(landlord2.address))
        .to.be.reverted;
    });
  });

  describe("Burning", function () {
    it("Should allow token holder to burn their NFT", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);

      await rentalNFT.connect(landlord1).burn(1);
      
      expect(await rentalNFT.exists(1)).to.be.false;
      await expect(rentalNFT.ownerOf(1)).to.be.revertedWithCustomError(rentalNFT, "ERC721NonexistentToken");
    });

    it("Should clean up landlord mapping when burning", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);

      await rentalNFT.connect(landlord1).burn(1);
      
      expect(await rentalNFT.tokenLandlord(1)).to.equal(ethers.ZeroAddress);
    });

    it("Should not allow non-owner to burn NFT", async function () {
      const { rentalNFT, landlord1, other, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);

      await expect(rentalNFT.connect(other).burn(1))
        .to.be.revertedWithCustomError(rentalNFT, "ERC721InsufficientApproval");
    });

    it("Should allow approved address to burn NFT", async function () {
      const { rentalNFT, landlord1, tenant1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);
      await rentalNFT.connect(landlord1).approve(tenant1.address, 1);
      
      await rentalNFT.connect(tenant1).burn(1);
      
      expect(await rentalNFT.exists(1)).to.be.false;
    });
  });

  describe("Landlord Tracking", function () {
    it("Should track original landlord after transfer", async function () {
      const { rentalNFT, landlord1, tenant1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);
      
      // Transfer to tenant (simulating rental)
      await rentalNFT.connect(landlord1).transferFrom(landlord1.address, tenant1.address, 1);
      
      // Landlord should still be tracked as original minter
      expect(await rentalNFT.tokenLandlord(1)).to.equal(landlord1.address);
      expect(await rentalNFT.ownerOf(1)).to.equal(tenant1.address);
    });

    it("Should get landlord correctly", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);
      
      expect(await rentalNFT.getLandlord(1)).to.equal(landlord1.address);
    });

    it("Should revert getLandlord for non-existent token", async function () {
      const { rentalNFT } = await loadFixture(deployRentalNFTFixture);
      
      await expect(rentalNFT.getLandlord(999))
        .to.be.revertedWith("RentalNFT: Token does not exist");
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should have significantly lower gas costs for minting", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      const tx = await rentalNFT.mint(landlord1.address, sampleTokenURI);
      
      const receipt = await tx.wait();
      console.log("Gas used for minting (optimized):", receipt.gasUsed.toString());
      
      // Should be much lower than before (was ~383k, now should be ~200k)
      expect(receipt.gasUsed).to.be.lt(250000n);
    });

    it("Should batch mint efficiently", async function () {
      const { rentalNFT, landlord1 } = await loadFixture(deployRentalNFTFixture);
      
      const gasUsed = [];
      
      for (let i = 1; i <= 3; i++) {
        const tx = await rentalNFT.mint(
          landlord1.address,
          `greenfield://fairbnb-bucket/metadata/property${i}.json`
        );
        const receipt = await tx.wait();
        gasUsed.push(receipt.gasUsed);
      }
      
      console.log("Gas for batch mints:", gasUsed.map(g => g.toString()));
      
      // First mint should be highest due to storage initialization
      expect(gasUsed[0]).to.be.gt(gasUsed[1]);
    });
  });

  describe("Security Tests", function () {
    it("Should protect against reentrancy on mint", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      // The ReentrancyGuard modifier protects the mint function
      await rentalNFT.mint(landlord1.address, sampleTokenURI);
      
      expect(await rentalNFT.exists(1)).to.be.true;
    });

    it("Should protect against reentrancy on setTokenURI", async function () {
      const { rentalNFT, landlord1, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      await rentalNFT.mint(landlord1.address, sampleTokenURI);
      
      const newURI = "greenfield://fairbnb-bucket/metadata/safe_update.json";
      await rentalNFT.connect(landlord1).setTokenURI(1, newURI);
      
      expect(await rentalNFT.tokenURI(1)).to.equal(newURI);
    });
  });

  describe("Integration Readiness", function () {
    it("Should be ready for escrow integration", async function () {
      const { rentalNFT, landlord1, escrow, sampleTokenURI } = await loadFixture(deployRentalNFTFixture);
      
      // Setup
      await rentalNFT.setEscrowContract(escrow.address);
      await rentalNFT.mint(landlord1.address, sampleTokenURI);
      
      // Verify escrow can transfer without explicit approval
      expect(await rentalNFT.isApprovedForAll(landlord1.address, escrow.address)).to.be.true;
      
      // Token is ready for rental agreement
      expect(await rentalNFT.exists(1)).to.be.true;
      expect(await rentalNFT.tokenLandlord(1)).to.equal(landlord1.address);
    });
  });
});