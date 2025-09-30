const  ethers  = require("ethers");
require("dotenv").config();

const CONTRACT_ABI = require("../contracts/HealthAccessABI.json");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;

// Setup provider & signer
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

module.exports = {
  createRecord: async (_patient, _recordHash) => {
    try {
      const tx = await contract.createRecord(_patient, _recordHash);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Error creating record:", error);
      return { success: false, error: error.message };
    }
  },

  getLog: async (id) => {
    try {
      const log = await contract.getLog(id);
      return log; 
    } catch (error) {
      console.error("Error fetching log:", error);
      return { success: false, error: error.message };
    }
  },

  logCount: async () => {
    try {
      const count = await contract.logCount();
      return count.toNumber();
    } catch (error) {
      console.error("Error getting log count:", error);
      return { success: false, error: error.message };
    }
  },
};
