-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_bundles" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "identity_key" TEXT NOT NULL,
    "signed_pre_key" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "one_time_pre_keys" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envelopes" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "ephemeral_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_user_id_public_key_key" ON "devices"("user_id", "public_key");

-- CreateIndex
CREATE UNIQUE INDEX "key_bundles_device_id_key" ON "key_bundles"("device_id");

-- CreateIndex
CREATE INDEX "envelopes_recipient_id_delivered_at_idx" ON "envelopes"("recipient_id", "delivered_at");

-- AddForeignKey
ALTER TABLE "key_bundles" ADD CONSTRAINT "key_bundles_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
