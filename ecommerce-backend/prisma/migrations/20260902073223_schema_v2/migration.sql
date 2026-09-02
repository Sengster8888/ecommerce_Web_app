-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refresh_token_hash" VARCHAR(255);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "purpose" VARCHAR(30) NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_verifications_email_code_idx" ON "otp_verifications"("email", "code");
