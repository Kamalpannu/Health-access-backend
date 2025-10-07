-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "blockchainTx" TEXT,
ADD COLUMN     "syncStatus" TEXT NOT NULL DEFAULT 'PENDING';
