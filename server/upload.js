import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { Client } from "@bnb-chain/greenfield-js-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Initialize Greenfield client with proper configuration
const initClient = async () => {
  const client = Client.create(
    process.env.BNB_GREENFIELD_RPC || "https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org",
    String(process.env.BNB_GREENFIELD_CHAIN_ID || "5600") // testnet chain ID
  );
  
  // Set up authentication with private key
  const privateKey = process.env.BNB_PRIVATE_KEY;
  const address = process.env.BNB_ADDRESS;
  
  if (!privateKey || !address) {
    throw new Error("BNB_PRIVATE_KEY and BNB_ADDRESS must be set in .env");
  }
  
  return { client, privateKey, address };
};

// Helper function to ensure bucket exists
const ensureBucketExists = async (client, bucketName, address) => {
  try {
    // Check if bucket exists
    const headBucketRes = await client.bucket.headBucket(bucketName);
    
    if (headBucketRes.code === 0) {
      console.log(`Bucket ${bucketName} already exists`);
      return true;
    }
  } catch (error) {
    console.log(`Bucket ${bucketName} doesn't exist, creating...`);
    
    // Create bucket if it doesn't exist
    const createBucketTx = await client.bucket.createBucket({
      bucketName: bucketName,
      creator: address,
      visibility: "VISIBILITY_TYPE_PUBLIC_READ", // or VISIBILITY_TYPE_PRIVATE
      chargedReadQuota: "0",
      primarySpAddress: process.env.BNB_SP_ADDRESS, // Storage Provider address
      paymentAddress: address,
    });
    
    const simulateInfo = await createBucketTx.simulate({
      denom: "BNB",
    });
    
    const res = await createBucketTx.broadcast({
      denom: "BNB",
      gasLimit: Number(simulateInfo.gasLimit),
      gasPrice: simulateInfo.gasPrice,
      payer: address,
      granter: "",
      privateKey: process.env.BNB_PRIVATE_KEY,
    });
    
    if (res.code === 0) {
      console.log(`Bucket ${bucketName} created successfully`);
      return true;
    } else {
      throw new Error(`Failed to create bucket: ${res.rawLog}`);
    }
  }
};

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { client, privateKey, address } = await initClient();
    
    const bucketName = process.env.BNB_BUCKET;
    if (!bucketName) {
      throw new Error("BNB_BUCKET must be set in .env");
    }
    
    // Ensure bucket exists
    await ensureBucketExists(client, bucketName, address);
    
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    
    // Choose a unique object name
    const objectName = `${Date.now()}-${req.file.originalname}`;
    
    // Create the object first
    const createObjectTx = await client.object.createObject({
      bucketName: bucketName,
      objectName: objectName,
      creator: address,
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      contentType: req.file.mimetype || "application/octet-stream",
      redundancyType: "REDUNDANCY_EC_TYPE",
      payloadSize: fileStats.size.toString(),
      expectChecksums: [], // You can calculate checksums if needed
    });
    
    // Simulate transaction
    const simulateInfo = await createObjectTx.simulate({
      denom: "BNB",
    });
    
    // Broadcast transaction
    const createRes = await createObjectTx.broadcast({
      denom: "BNB",
      gasLimit: Number(simulateInfo.gasLimit),
      gasPrice: simulateInfo.gasPrice,
      payer: address,
      granter: "",
      privateKey: privateKey,
    });
    
    if (createRes.code !== 0) {
      throw new Error(`Failed to create object: ${createRes.rawLog}`);
    }
    
    // Now upload the actual file content to the storage provider
    const uploadRes = await client.object.uploadObject({
      bucketName: bucketName,
      objectName: objectName,
      body: fileBuffer,
      txnHash: createRes.transactionHash,
      endpoint: process.env.BNB_SP_ENDPOINT, // Storage provider endpoint
      signType: "authTypeV2",
      privateKey: privateKey,
    });
    
    // Cleanup local file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      objectName,
      txHash: createRes.transactionHash,
      message: "File uploaded successfully to BNB Greenfield",
      url: `${process.env.BNB_SP_ENDPOINT}/view/${bucketName}/${objectName}`
    });
    
  } catch (err) {
    console.error("Upload failed:", err);
    
    // Cleanup file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: "Upload failed", 
      details: err.message 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("Make sure you have set the following environment variables:");
  console.log("- BNB_GREENFIELD_RPC");
  console.log("- BNB_GREENFIELD_CHAIN_ID");
  console.log("- BNB_PRIVATE_KEY");
  console.log("- BNB_ADDRESS");
  console.log("- BNB_BUCKET");
  console.log("- BNB_SP_ADDRESS (Storage Provider Address)");
  console.log("- BNB_SP_ENDPOINT (Storage Provider Endpoint)");
});