const pinataSDK = require('@pinata/sdk');
require('dotenv').config();

let pinata;

if (process.env.PINATA_JWT) {
  console.log("Using JWT for Pinata auth");
  pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });
} else if (process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET) {
  console.log("Using API Key/Secret for Pinata auth");
  pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);
} else {
  throw new Error("Pinata credentials missing. Set PINATA_JWT or (PINATA_API_KEY + PINATA_API_SECRET) in .env");
}

module.exports = {
  pinJSON: async (json) => {
    try {
      const result = await pinata.pinJSONToIPFS(json);
      console.log("JSON pinned:", result);
      return { success: true, hash: result.IpfsHash };
    } catch (error) {
      console.error("Pinata error:", error);
      return { success: false, error: error?.message || JSON.stringify(error) };
    }
  },
};
