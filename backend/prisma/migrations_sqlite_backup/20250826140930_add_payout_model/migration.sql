/*
  Warnings:

  - You are about to alter the column `payout_id` on the `payout_slips` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- CreateTable
CREATE TABLE "payouts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "net_amount" REAL NOT NULL,
    "commission" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payout_slips" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "payout_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "slip_image_path" TEXT NOT NULL,
    "upload_date" DATETIME NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payout_slips_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payout_slips_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payout_slips_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_payout_slips" ("amount", "created_at", "id", "payout_id", "seller_id", "slip_image_path", "status", "updated_at", "upload_date", "uploaded_by") SELECT "amount", "created_at", "id", "payout_id", "seller_id", "slip_image_path", "status", "updated_at", "upload_date", "uploaded_by" FROM "payout_slips";
DROP TABLE "payout_slips";
ALTER TABLE "new_payout_slips" RENAME TO "payout_slips";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
