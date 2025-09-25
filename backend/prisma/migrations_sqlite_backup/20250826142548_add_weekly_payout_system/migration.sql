/*
  Warnings:

  - Added the required column `week_end` to the `payouts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `week_start` to the `payouts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "seller_notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "seller_notifications_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payouts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "net_amount" REAL NOT NULL,
    "commission" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "week_start" DATETIME NOT NULL,
    "week_end" DATETIME NOT NULL,
    "confirmed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payouts" ("amount", "commission", "confirmed_at", "created_at", "id", "net_amount", "seller_id", "status", "updated_at") SELECT "amount", "commission", "confirmed_at", "created_at", "id", "net_amount", "seller_id", "status", "updated_at" FROM "payouts";
DROP TABLE "payouts";
ALTER TABLE "new_payouts" RENAME TO "payouts";
CREATE UNIQUE INDEX "payouts_seller_id_week_start_key" ON "payouts"("seller_id", "week_start");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
