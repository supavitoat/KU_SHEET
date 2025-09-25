-- CreateTable
CREATE TABLE "payment_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT NOT NULL,
    "order_ids" TEXT NOT NULL,
    "metadata" TEXT,
    "expires_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payment_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_verifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "bank_name" TEXT,
    "verified_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_verifications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "payment_sessions" ("session_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_sessions_session_id_key" ON "payment_sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_verifications_reference_number_key" ON "payment_verifications"("reference_number");
