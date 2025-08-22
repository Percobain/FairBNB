const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with:", deployer.address);
    console.log("Network:", hre.network.name);

    // Deploy FairBNB
    console.log("\nDeploying FairBNB...");
    const FairBNB = await hre.ethers.getContractFactory("FairBNB");
    const fairBNB = await FairBNB.deploy();
    await fairBNB.waitForDeployment();
    const fairBNBAddress = await fairBNB.getAddress();
    console.log("FairBNB deployed to:", fairBNBAddress);

    // Save deployment info for verify.js
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      contracts: {
        fairBNB: {
          address: fairBNBAddress,
          name: "FairBNB Property",
          symbol: "FBNB"
        }
      }
    };
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\nSaved deployment info to:", deploymentPath);

    console.log("\nDone.");
    console.log("FairBNB:", fairBNBAddress);
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