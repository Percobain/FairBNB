export const EscrowABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "EnforcedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ExpectedPause",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "AgreementCancelled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "AgreementCompleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "landlord",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "tenant",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalLocked",
          "type": "uint256"
        }
      ],
      "name": "AgreementCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "tenant",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "DepositReturned",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "raisedBy",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address[3]",
          "name": "assignedJurors",
          "type": "address[3]"
        }
      ],
      "name": "DisputeCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "raisedBy",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "DisputeRaised",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "tenantWins",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "jurorRewards",
          "type": "uint256"
        }
      ],
      "name": "DisputeResolved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "submitter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "evidenceURI",
          "type": "string"
        }
      ],
      "name": "EvidenceSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "FeesWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "juror",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "JurorRewarded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "juror",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "JurorStaked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "juror",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "JurorUnstaked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "juror",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "enum IntegratedEscrow.Vote",
          "name": "vote",
          "type": "uint8"
        }
      ],
      "name": "JurorVoted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "oldFee",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newFee",
          "type": "uint256"
        }
      ],
      "name": "PlatformFeeUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "landlord",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "RentReleased",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "newAddress",
          "type": "address"
        }
      ],
      "name": "RentalNFTUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "MAX_FEE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_STAKE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_JURORS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_STAKE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "UNSTAKE_DELAY",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "VOTING_PERIOD",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "accumulatedFees",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "activeJurorCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "agreementToDispute",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "agreements",
      "outputs": [
        {
          "internalType": "address",
          "name": "landlord",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tenant",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "nftContract",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "rentAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "depositAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "disputeFee",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalLocked",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "startTimestamp",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "durationMonths",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastRentPaid",
          "type": "uint256"
        },
        {
          "internalType": "enum IntegratedEscrow.AgreementStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "landlordWithdrawn",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "tenantWithdrawn",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "cancelAgreement",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "internalType": "enum IntegratedEscrow.Vote",
          "name": "vote",
          "type": "uint8"
        }
      ],
      "name": "castVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "landlord",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "nftContract",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "tokenId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "rentAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "depositAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "disputeFee",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "durationMonths",
              "type": "uint256"
            }
          ],
          "internalType": "struct IntegratedEscrow.RentalParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "createAgreement",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "disputes",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "raisedBy",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "landlord",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tenant",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "evidenceURI",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "votingEndTime",
          "type": "uint256"
        },
        {
          "internalType": "enum IntegratedEscrow.DisputeStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "tenantVotes",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "landlordVotes",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "tenantWins",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "jurorRewardPool",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "getAgreementByToken",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "getAgreementDetails",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "landlord",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "tenant",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "nftContract",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "tokenId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "rentAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "depositAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "disputeFee",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalLocked",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "startTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "durationMonths",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lastRentPaid",
              "type": "uint256"
            },
            {
              "internalType": "enum IntegratedEscrow.AgreementStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "bool",
              "name": "landlordWithdrawn",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "tenantWithdrawn",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "disputeId",
              "type": "uint256"
            }
          ],
          "internalType": "struct IntegratedEscrow.Agreement",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        }
      ],
      "name": "getAssignedJurors",
      "outputs": [
        {
          "internalType": "address[3]",
          "name": "",
          "type": "address[3]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getContractBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        }
      ],
      "name": "getDispute",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "raisedBy",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "landlord",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tenant",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "evidenceURI",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "votingEndTime",
          "type": "uint256"
        },
        {
          "internalType": "enum IntegratedEscrow.DisputeStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "tenantVotes",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "landlordVotes",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "tenantWins",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "juror",
          "type": "address"
        }
      ],
      "name": "getJurorActiveDisputes",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getJurorPoolSize",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "juror",
          "type": "address"
        }
      ],
      "name": "getJurorStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "stakedAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "disputesAssigned",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "disputesVoted",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "correctVotes",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalEarned",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "juror",
          "type": "address"
        }
      ],
      "name": "getJurorVote",
      "outputs": [
        {
          "internalType": "enum IntegratedEscrow.Vote",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "landlord",
          "type": "address"
        }
      ],
      "name": "getLandlordAgreements",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tenant",
          "type": "address"
        }
      ],
      "name": "getTenantAgreements",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalAgreements",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalDisputes",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "isActiveJuror",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "jurorActiveDisputes",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "jurorPool",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "jurorPoolIndex",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "jurors",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "stakedAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "stakedAt",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "disputesAssigned",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "disputesVoted",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "correctVotes",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalEarned",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "landlordAgreements",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "name": "onERC721Received",
      "outputs": [
        {
          "internalType": "bytes4",
          "name": "",
          "type": "bytes4"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paused",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "platformFeePercent",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "evidenceURI",
          "type": "string"
        }
      ],
      "name": "raiseDispute",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "releaseRentToLandlord",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rentalNFT",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        }
      ],
      "name": "resolveDispute",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "returnDepositToTenant",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_rentalNFT",
          "type": "address"
        }
      ],
      "name": "setRentalNFT",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "stakeAsJuror",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "disputeId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "evidenceURI",
          "type": "string"
        }
      ],
      "name": "submitEvidence",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "tenantAgreements",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "tokenToAgreement",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalStaked",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unstake",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newFeePercent",
          "type": "uint256"
        }
      ],
      "name": "updatePlatformFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "withdrawFees",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
]