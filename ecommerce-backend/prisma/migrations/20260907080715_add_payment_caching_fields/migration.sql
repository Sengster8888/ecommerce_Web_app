-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "expires_at" TIMESTAMP,
ADD COLUMN     "md5" VARCHAR(32),
ADD COLUMN     "qr_string" TEXT;
