const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with:", deployer.address);
    console.log("Network:", hre.network.name);

    // Deploy RentalNFT
    console.log("\nDeploying RentalNFT...");
    const RentalNFT = await hre.ethers.getContractFactory("RentalNFT");
    const rentalNFT = await RentalNFT.deploy("FairBNB Rental", "FBNB");
    await rentalNFT.waitForDeployment();
    const rentalNFTAddress = await rentalNFT.getAddress();
    console.log("RentalNFT deployed to:", rentalNFTAddress);

    // Deploy IntegratedEscrow
    console.log("\nDeploying IntegratedEscrow...");
    const IntegratedEscrow = await hre.ethers.getContractFactory("IntegratedEscrow");
    const integratedEscrow = await IntegratedEscrow.deploy();
    await integratedEscrow.waitForDeployment();
    const integratedEscrowAddress = await integratedEscrow.getAddress();
    console.log("IntegratedEscrow deployed to:", integratedEscrowAddress);

    // Wire contracts
    console.log("\nConfiguring contracts...");
    const tx1 = await rentalNFT.setEscrowContract(integratedEscrowAddress);
    await tx1.wait();
    console.log("Set escrow contract in RentalNFT.");

    const tx2 = await integratedEscrow.setRentalNFT(rentalNFTAddress);
    await tx2.wait();
    console.log("Set RentalNFT in IntegratedEscrow.");

    // Grant landlord role to deployer for convenience
    const landlordRole = await rentalNFT.LANDLORD_ROLE();
    const grantTx = await rentalNFT.grantLandlordRole(deployer.address);
    await grantTx.wait();
    const hasRole = await rentalNFT.hasRole(landlordRole, deployer.address);
    console.log("Deployer has LANDLORD_ROLE:", hasRole);

    // Save deployment info for verify.js
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      contracts: {
        rentalNFT: {
          address: rentalNFTAddress,
          name: "FairBNB Rental",
          symbol: "FBNB"
        },
        integratedEscrow: {
          address: integratedEscrowAddress
        }
      }
    };
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\nSaved deployment info to:", deploymentPath);

    console.log("\nDone.");
    console.log("RentalNFT:", rentalNFTAddress);
    console.log("IntegratedEscrow:", integratedEscrowAddress);
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });