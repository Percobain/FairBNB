const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting contract verification...");
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployment.json not found. Run deploy.js first.");
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  console.log("Found deployment info for network:", deploymentInfo.network);
  console.log("RentalNFT:", deploymentInfo.contracts.rentalNFT.address);
  console.log("IntegratedEscrow:", deploymentInfo.contracts.integratedEscrow.address);

  // Verify RentalNFT
  console.log("\nVerifying RentalNFT...");
  try {
    await hre.run("verify:verify", {
      address: deploymentInfo.contracts.rentalNFT.address,
      constructorArguments: [
        deploymentInfo.contracts.rentalNFT.name,
        deploymentInfo.contracts.rentalNFT.symbol
      ],
    });
    console.log("RentalNFT verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("RentalNFT already verified");
    } else {
      console.log("RentalNFT verification failed:", error.message);
    }
  }

  // Verify IntegratedEscrow
  console.log("\nVerifying IntegratedEscrow...");
  try {
    await hre.run("verify:verify", {
      address: deploymentInfo.contracts.integratedEscrow.address,
      constructorArguments: [],
    });
    console.log("IntegratedEscrow verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("IntegratedEscrow already verified");
    } else {
      console.log("IntegratedEscrow verification failed:", error.message);
    }
  }

  console.log("\nVerification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
