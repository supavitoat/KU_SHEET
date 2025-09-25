/*
  Warnings:

  - You are about to drop the `admin_notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seller_notifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "admin_notifications";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "seller_notifications";
PRAGMA foreign_keys=on;

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
    CONSTRAINT "payout_slips_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payout_slips_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_payout_slips" ("amount", "created_at", "id", "payout_id", "seller_id", "slip_image_path", "status", "updated_at", "upload_date", "uploaded_by") SELECT "amount", "created_at", "id", "payout_id", "seller_id", "slip_image_path", "status", "updated_at", "upload_date", "uploaded_by" FROM "payout_slips";
DROP TABLE "payout_slips";
ALTER TABLE "new_payout_slips" RENAME TO "payout_slips";
CREATE TABLE "new_payouts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "net_amount" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "week_start" DATETIME NOT NULL,
    "week_end" DATETIME NOT NULL,
    "confirmed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payouts" ("amount", "commission", "confirmed_at", "created_at", "id", "net_amount", "seller_id", "status", "updated_at", "week_end", "week_start") SELECT "amount", "commission", "confirmed_at", "created_at", "id", "net_amount", "seller_id", "status", "updated_at", "week_end", "week_start" FROM "payouts";
DROP TABLE "payouts";
ALTER TABLE "new_payouts" RENAME TO "payouts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
