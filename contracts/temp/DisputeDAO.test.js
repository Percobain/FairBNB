const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DisputeDAO", function () {
  // Deploy fixture
  async function deployDisputeDAOFixture() {
    const [owner, juror1, juror2, juror3, juror4, landlord, tenant, other] = 
      await ethers.getSigners();

    // Deploy DisputeDAO
    const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
    const disputeDAO = await DisputeDAO.deploy();
    await disputeDAO.waitForDeployment();

    // Deploy MockEscrow
    const MockEscrow = await ethers.getContractFactory("MockEscrow");
    const mockEscrow = await MockEscrow.deploy();
    await mockEscrow.waitForDeployment();

    // Set escrow contract to the mock
    await disputeDAO.setEscrowContract(await mockEscrow.getAddress());

    // Send some ETH to mockEscrow for dispute fees
    await owner.sendTransaction({
      to: await mockEscrow.getAddress(),
      value: ethers.parseEther("1")
    });

    // Constants
    const MIN_STAKE = ethers.parseEther("0.001");
    const MAX_STAKE = ethers.parseEther("0.1");
    const VOTING_PERIOD = 3 * 24 * 60 * 60; // 3 days
    const UNSTAKE_DELAY = 7 * 24 * 60 * 60; // 7 days

    // Sample dispute data
    const sampleDispute = {
      agreementId: 1,
      evidenceURI: "greenfield://fairbnb/disputes/1/evidence.json",
      disputeFee: ethers.parseEther("0.001")
    };

    // Helper to stake multiple jurors
    async function stakeJurors() {
      await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });
      await disputeDAO.connect(juror2).stakeAsJuror({ value: MIN_STAKE });
      await disputeDAO.connect(juror3).stakeAsJuror({ value: MIN_STAKE });
    }

    // Setup mock agreement data
    await mockEscrow.setAgreement(
      sampleDispute.agreementId,
      landlord.address,
      tenant.address,
      sampleDispute.disputeFee
    );

    return {
      disputeDAO,
      mockEscrow,
      owner,
      juror1,
      juror2,
      juror3,
      juror4,
      landlord,
      tenant,
      other,
      MIN_STAKE,
      MAX_STAKE,
      VOTING_PERIOD,
      UNSTAKE_DELAY,
      sampleDispute,
      stakeJurors
    };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { disputeDAO, owner } = await loadFixture(deployDisputeDAOFixture);
      expect(await disputeDAO.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct values", async function () {
      const { disputeDAO, MIN_STAKE, MAX_STAKE, VOTING_PERIOD, UNSTAKE_DELAY } = 
        await loadFixture(deployDisputeDAOFixture);
      
      expect(await disputeDAO.MIN_STAKE()).to.equal(MIN_STAKE);
      expect(await disputeDAO.MAX_STAKE()).to.equal(MAX_STAKE);
      expect(await disputeDAO.VOTING_PERIOD()).to.equal(VOTING_PERIOD);
      expect(await disputeDAO.UNSTAKE_DELAY()).to.equal(UNSTAKE_DELAY);
      expect(await disputeDAO.MIN_JURORS()).to.equal(3);
    });

    it("Should set escrow contract", async function () {
      const { disputeDAO, mockEscrow } = await loadFixture(deployDisputeDAOFixture);
      expect(await disputeDAO.escrowContract()).to.equal(await mockEscrow.getAddress());
    });
  });

  describe("Juror Staking", function () {
    it("Should allow staking to become a juror", async function () {
      const { disputeDAO, juror1, MIN_STAKE } = await loadFixture(deployDisputeDAOFixture);
      
      await expect(disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE }))
        .to.emit(disputeDAO, "JurorStaked")
        .withArgs(juror1.address, MIN_STAKE);

      const jurorInfo = await disputeDAO.jurors(juror1.address);
      expect(jurorInfo.stakedAmount).to.equal(MIN_STAKE);
      expect(jurorInfo.isActive).to.be.true;

      expect(await disputeDAO.activeJurorCount()).to.equal(1);
      expect(await disputeDAO.totalStaked()).to.equal(MIN_STAKE);
    });

    it("Should allow additional staking", async function () {
      const { disputeDAO, juror1, MIN_STAKE } = await loadFixture(deployDisputeDAOFixture);
      
      await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });
      await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });

      const jurorInfo = await disputeDAO.jurors(juror1.address);
      expect(jurorInfo.stakedAmount).to.equal(MIN_STAKE * 2n);
      expect(await disputeDAO.activeJurorCount()).to.equal(1); // Still 1 juror
    });

    it("Should reject stake below minimum", async function () {
      const { disputeDAO, juror1 } = await loadFixture(deployDisputeDAOFixture);
      
      const belowMin = ethers.parseEther("0.0005");
      await expect(disputeDAO.connect(juror1).stakeAsJuror({ value: belowMin }))
        .to.be.revertedWith("DisputeDAO: Below minimum stake");
    });

    it("Should reject stake above maximum", async function () {
      const { disputeDAO, juror1 } = await loadFixture(deployDisputeDAOFixture);
      
      const aboveMax = ethers.parseEther("0.2");
      await expect(disputeDAO.connect(juror1).stakeAsJuror({ value: aboveMax }))
        .to.be.revertedWith("DisputeDAO: Above maximum stake");
    });

    it("Should track juror pool correctly", async function () {
      const { disputeDAO, juror1, juror2, juror3, MIN_STAKE, stakeJurors } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      expect(await disputeDAO.getJurorPoolSize()).to.equal(3);
      expect(await disputeDAO.activeJurorCount()).to.equal(3);
      expect(await disputeDAO.totalStaked()).to.equal(MIN_STAKE * 3n);
    });
  });

  describe("Juror Unstaking", function () {
    it("Should allow unstaking after delay period", async function () {
      const { disputeDAO, juror1, MIN_STAKE, UNSTAKE_DELAY } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });
      
      // Fast forward past unstake delay
      await time.increase(UNSTAKE_DELAY + 1);

      const balanceBefore = await ethers.provider.getBalance(juror1.address);
      
      await expect(disputeDAO.connect(juror1).unstake())
        .to.emit(disputeDAO, "JurorUnstaked")
        .withArgs(juror1.address, MIN_STAKE);

      const balanceAfter = await ethers.provider.getBalance(juror1.address);
      expect(balanceAfter - balanceBefore).to.be.closeTo(
        MIN_STAKE,
        ethers.parseEther("0.001") // Gas tolerance
      );

      const jurorInfo = await disputeDAO.jurors(juror1.address);
      expect(jurorInfo.isActive).to.be.false;
      expect(jurorInfo.stakedAmount).to.equal(0);
    });

    it("Should reject unstaking before delay period", async function () {
      const { disputeDAO, juror1, MIN_STAKE } = await loadFixture(deployDisputeDAOFixture);
      
      await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });
      
      await expect(disputeDAO.connect(juror1).unstake())
        .to.be.revertedWith("DisputeDAO: Unstake delay not met");
    });

    it("Should reject unstaking with active disputes", async function () {
      const { disputeDAO, mockEscrow, juror1, tenant, MIN_STAKE, UNSTAKE_DELAY, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();
      
      // Create a dispute (juror1 might be selected)
      const mockEscrowAddress = await mockEscrow.getAddress();
      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      // Fast forward past unstake delay
      await time.increase(UNSTAKE_DELAY + 1);

      // Check if juror1 was assigned
      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      const isAssigned = assignedJurors.includes(juror1.address);

      if (isAssigned) {
        await expect(disputeDAO.connect(juror1).unstake())
          .to.be.revertedWith("DisputeDAO: Has active disputes");
      }
    });

    it("Should update pool after unstaking", async function () {
      const { disputeDAO, juror1, juror2, MIN_STAKE, UNSTAKE_DELAY, stakeJurors } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();
      expect(await disputeDAO.getJurorPoolSize()).to.equal(3);

      await time.increase(UNSTAKE_DELAY + 1);
      await disputeDAO.connect(juror1).unstake();

      expect(await disputeDAO.getJurorPoolSize()).to.equal(2);
      expect(await disputeDAO.activeJurorCount()).to.equal(2);
    });
  });

  describe("Dispute Creation", function () {
    it("Should create dispute with sufficient jurors", async function () {
      const { disputeDAO, mockEscrow, tenant, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await expect(disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      )).to.emit(disputeDAO, "DisputeCreated");

      const dispute = await disputeDAO.getDispute(1);
      expect(dispute.agreementId).to.equal(sampleDispute.agreementId);
      expect(dispute.raisedBy).to.equal(tenant.address);
      expect(dispute.evidenceURI).to.equal(sampleDispute.evidenceURI);
      expect(dispute.status).to.equal(1); // Active
    });

    it("Should assign exactly 3 jurors", async function () {
      const { disputeDAO, mockEscrow, tenant, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      expect(assignedJurors.length).to.equal(3);
      
      // Check all assigned jurors are unique
      const uniqueJurors = new Set(assignedJurors);
      expect(uniqueJurors.size).to.equal(3);
    });

    it("Should reject dispute creation without enough jurors", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, MIN_STAKE, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      // Only stake 2 jurors (need 3)
      await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });

      await expect(disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      )).to.be.revertedWith("DisputeDAO: Not enough jurors");
    });

    it("Should reject duplicate dispute for same agreement", async function () {
      const { disputeDAO, mockEscrow, tenant, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 4n // For two disputes
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      await expect(disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        "new-evidence"
      )).to.be.revertedWith("DisputeDAO: Dispute already exists");
    });

    it("Should only allow escrow to create disputes", async function () {
      const { disputeDAO, other, tenant, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      await expect(disputeDAO.connect(other).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      )).to.be.revertedWith("DisputeDAO: Only escrow");
    });
  });

  describe("Evidence Submission", function () {
    it("Should allow parties to submit evidence", async function () {
      const { disputeDAO, mockEscrow, landlord, tenant, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );
      
      const newEvidence = "greenfield://fairbnb/disputes/1/additional-evidence.json";
      
      // Submit evidence as landlord
      await expect(disputeDAO.connect(landlord).submitEvidence(1, newEvidence))
        .to.emit(disputeDAO, "EvidenceSubmitted")
        .withArgs(1, landlord.address, newEvidence);

      // Submit evidence as tenant
      await expect(disputeDAO.connect(tenant).submitEvidence(1, newEvidence))
        .to.emit(disputeDAO, "EvidenceSubmitted")
        .withArgs(1, tenant.address, newEvidence);
    });
  });

  describe("Voting", function () {
    it("Should allow assigned jurors to vote", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, juror2, juror3, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      
      // Find which test signer is assigned and vote
      const jurors = [juror1, juror2, juror3];
      for (let i = 0; i < assignedJurors.length; i++) {
        const assignedAddress = assignedJurors[i];
        const juror = jurors.find(j => j.address === assignedAddress);
        
        if (juror) {
          await expect(disputeDAO.connect(juror).castVote(1, 1)) // Vote.TenantWins
            .to.emit(disputeDAO, "JurorVoted")
            .withArgs(1, juror.address, 1);
          
          const vote = await disputeDAO.getJurorVote(1, juror.address);
          expect(vote).to.equal(1); // TenantWins
          break; // Test one vote only
        }
      }
    });

    it("Should reject vote from non-assigned juror", async function () {
      const { disputeDAO, mockEscrow, tenant, other, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      await expect(disputeDAO.connect(other).castVote(1, 1))
        .to.be.revertedWith("DisputeDAO: Not assigned juror");
    });

    it("Should reject double voting", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, juror2, juror3, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      const jurors = [juror1, juror2, juror3];
      
      // Find an assigned juror
      let assignedJuror;
      for (const addr of assignedJurors) {
        assignedJuror = jurors.find(j => j.address === addr);
        if (assignedJuror) break;
      }

      if (assignedJuror) {
        await disputeDAO.connect(assignedJuror).castVote(1, 1);
        
        await expect(disputeDAO.connect(assignedJuror).castVote(1, 2))
          .to.be.revertedWith("DisputeDAO: Already voted");
      }
    });

    it("Should reject voting after period ends", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, juror2, juror3, VOTING_PERIOD, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);

      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      const jurors = [juror1, juror2, juror3];
      
      // Find an assigned juror
      let assignedJuror;
      for (const addr of assignedJurors) {
        assignedJuror = jurors.find(j => j.address === addr);
        if (assignedJuror) break;
      }

      if (assignedJuror) {
        await expect(disputeDAO.connect(assignedJuror).castVote(1, 1))
          .to.be.revertedWith("DisputeDAO: Voting period ended");
      }
    });

    it("Should auto-resolve when all jurors vote", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, juror2, juror3, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      const jurors = [juror1, juror2, juror3];

      // Have all assigned jurors vote
      for (const addr of assignedJurors) {
        const juror = jurors.find(j => j.address === addr);
        if (juror) {
          await disputeDAO.connect(juror).castVote(1, 1); // All vote for tenant
        }
      }

      // Check dispute is resolved
      const dispute = await disputeDAO.getDispute(1);
      expect(dispute.status).to.equal(2); // Resolved
    });
  });

  describe("Dispute Resolution", function () {
    it("Should resolve dispute after voting period", async function () {
      const { disputeDAO, mockEscrow, tenant, VOTING_PERIOD, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);

      await expect(disputeDAO.resolveDispute(1))
        .to.emit(disputeDAO, "DisputeResolved");
    });

    it("Should determine winner by majority vote", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, juror2, juror3, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      const jurors = [juror1, juror2, juror3];
      
      // Have jurors vote (2 for tenant, 1 for landlord)
      let voteCount = 0;
      for (const addr of assignedJurors) {
        const juror = jurors.find(j => j.address === addr);
        if (juror) {
          const vote = voteCount < 2 ? 1 : 2; // First 2 vote for tenant, last for landlord
          await disputeDAO.connect(juror).castVote(1, vote);
          voteCount++;
        }
      }

      // Check dispute resolution
      const dispute = await disputeDAO.getDispute(1);
      expect(dispute.status).to.equal(2); // Resolved
      expect(dispute.tenantWins).to.be.true; // Tenant should win with 2 votes
    });

    it("Should distribute rewards to correct voters", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, juror2, juror3, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      const jurors = [juror1, juror2, juror3];
      
      // Track jurors who vote for tenant
      const tenantVoters = [];
      
      // Have all jurors vote for tenant
      for (const addr of assignedJurors) {
        const juror = jurors.find(j => j.address === addr);
        if (juror) {
          await disputeDAO.connect(juror).castVote(1, 1); // Vote for tenant
          tenantVoters.push(juror.address);
        }
      }

      // Check that jurors received rewards
      for (const voterAddr of tenantVoters) {
        const stats = await disputeDAO.getJurorStats(voterAddr);
        expect(stats.correctVotes).to.equal(1);
        expect(stats.totalEarned).to.be.gt(0);
      }
    });
  });

  describe("Juror Statistics", function () {
    it("Should track juror performance", async function () {
      const { disputeDAO, juror1, MIN_STAKE } = await loadFixture(deployDisputeDAOFixture);
      
      await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });

      const stats = await disputeDAO.getJurorStats(juror1.address);
      expect(stats.stakedAmount).to.equal(MIN_STAKE);
      expect(stats.isActive).to.be.true;
      expect(stats.disputesAssigned).to.equal(0);
      expect(stats.disputesVoted).to.equal(0);
      expect(stats.correctVotes).to.equal(0);
      expect(stats.totalEarned).to.equal(0);
    });

    it("Should update stats after participation", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, juror2, juror3, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      const assignedJurors = await disputeDAO.getAssignedJurors(1);
      const jurors = [juror1, juror2, juror3];
      
      // Have all assigned jurors vote
      for (const addr of assignedJurors) {
        const juror = jurors.find(j => j.address === addr);
        if (juror) {
          await disputeDAO.connect(juror).castVote(1, 1); // Vote for tenant
        }
      }

      // Check stats for assigned jurors
      for (const addr of assignedJurors) {
        const stats = await disputeDAO.getJurorStats(addr);
        expect(stats.disputesAssigned).to.be.gt(0);
        expect(stats.disputesVoted).to.be.gt(0);
      }
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause contract", async function () {
      const { disputeDAO, owner, juror1, MIN_STAKE } = await loadFixture(deployDisputeDAOFixture);
      
      await disputeDAO.connect(owner).pause();

      await expect(disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE }))
        .to.be.revertedWithCustomError(disputeDAO, "EnforcedPause");

      await disputeDAO.connect(owner).unpause();

      await expect(disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE }))
        .to.emit(disputeDAO, "JurorStaked");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle minimum juror count edge case", async function () {
      const { disputeDAO, mockEscrow, tenant, juror1, juror2, juror3, MIN_STAKE, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      // Stake exactly 3 jurors (minimum)
      await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });
      await disputeDAO.connect(juror2).stakeAsJuror({ value: MIN_STAKE });
      await disputeDAO.connect(juror3).stakeAsJuror({ value: MIN_STAKE });

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await expect(disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      )).to.not.be.reverted;
    });

    it("Should handle tie votes correctly", async function () {
      // With 3 jurors, ties are not possible (always odd number)
      // But test handles edge case of no votes
      const { disputeDAO, mockEscrow, tenant, VOTING_PERIOD, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );

      // Fast forward past voting period without any votes
      await time.increase(VOTING_PERIOD + 1);

      await disputeDAO.resolveDispute(1);

      const dispute = await disputeDAO.getDispute(1);
      expect(dispute.status).to.equal(2); // Resolved
      // With no votes, landlord wins by default (tenantVotes = 0, landlordVotes = 0)
      expect(dispute.tenantWins).to.be.false;
    });

    it("Should handle maximum stake correctly", async function () {
      const { disputeDAO, juror1, MAX_STAKE } = await loadFixture(deployDisputeDAOFixture);
      
      await expect(disputeDAO.connect(juror1).stakeAsJuror({ value: MAX_STAKE }))
        .to.not.be.reverted;

      const jurorInfo = await disputeDAO.jurors(juror1.address);
      expect(jurorInfo.stakedAmount).to.equal(MAX_STAKE);
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for staking", async function () {
      const { disputeDAO, juror1, MIN_STAKE } = await loadFixture(deployDisputeDAOFixture);
      
      const tx = await disputeDAO.connect(juror1).stakeAsJuror({ value: MIN_STAKE });
      const receipt = await tx.wait();
      
      console.log("Gas used for staking:", receipt.gasUsed.toString());
      // Ignoring gas fee assertion as requested
      // expect(receipt.gasUsed).to.be.lt(150000n);
    });

    it("Should have reasonable gas costs for dispute creation", async function () {
      const { disputeDAO, mockEscrow, tenant, stakeJurors, sampleDispute } = 
        await loadFixture(deployDisputeDAOFixture);
      
      await stakeJurors();

      // Send dispute fees to DisputeDAO
      const disputeDAOAddress = await disputeDAO.getAddress();
      await mockEscrow.runner.sendTransaction({
        to: disputeDAOAddress,
        value: sampleDispute.disputeFee * 2n
      });

      const tx = await disputeDAO.connect(mockEscrow.runner).createDispute(
        sampleDispute.agreementId,
        tenant.address,
        sampleDispute.evidenceURI
      );
      const receipt = await tx.wait();
      
      console.log("Gas used for dispute creation:", receipt.gasUsed.toString());
      // Ignoring gas fee assertion as requested
      // expect(receipt.gasUsed).to.be.lt(300000n);
    });
  });
});