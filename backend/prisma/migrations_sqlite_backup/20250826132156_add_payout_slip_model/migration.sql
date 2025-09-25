-- CreateTable
CREATE TABLE "payout_slips" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "payout_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "slip_image_path" TEXT NOT NULL,
    "upload_date" DATETIME NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payout_slips_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payout_slips_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
