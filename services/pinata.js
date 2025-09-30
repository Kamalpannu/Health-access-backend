const pinataSDK = require('@pinata/sdk');
require('dotenv').config();

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

module.exports = {
  pinJSON: async (json) => {
    try {
      const result = await pinata.pinJSONToIPFS(json);
      console.log("JSON pinned:", result.IpfsHash);
      return { success: true, hash: result.IpfsHash };
    } catch (error) {
      console.error("Pinata error:", error);
      return { success: false, error: error.message };
    }
  },
};
