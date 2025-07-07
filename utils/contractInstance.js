const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Contract configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL =
  process.env.RPC_URL || "https://base-sepolia-rpc.publicnode.com";

// Function to initialize our blockchain connection
// Think of this as "plugging into" the Ethereum network

let contract;
let provider;
let signer;

// Function to load contract ABI from the JSON file
// This is the blueprint that tells us how to interact with your smart contract
function loadContractABI() {
  try {
    console.log("Loading contract ABI from file...");
    const abiPath = path.join(__dirname, "./abi.json");
    const abi = fs.readFileSync(abiPath, "utf8");
    const parsedABI = JSON.parse(abi);
    return parsedABI;
  } catch (error) {
    console.error("Failed to load contract ABI:", error.message);
    throw new Error(`ABI loading failed: ${error.message}`);
  }
}

async function initializeContract() {
  try {
    // Create connection to the blockchain network
    provider = new ethers.JsonRpcProvider(RPC_URL);

    // Create wallet instance that can sign transactions
    signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Load the contract's interface (ABI)
    const contractABI = loadContractABI();
    const abi = contractABI.abi || contractABI;

    // Create contract instance - this is your gateway to interact with the smart contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    return contract;
  } catch (error) {
    console.error("Failed to initialize contract:", error.message);
    throw new Error(`Contract initialization failed: ${error.message}`);
  }
}

// Get contract instance
function getContract() {
  if (!contract) {
    throw new Error(
      "Contract not initialized. Call initializeContract() first."
    );
  }
  return contract;
}

module.exports = {
  initializeContract,
  getContract,
};
