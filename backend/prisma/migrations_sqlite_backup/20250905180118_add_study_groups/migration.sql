/*
  Warnings:

  - You are about to drop the `payout_slips` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `week_end` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `week_start` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `real_name` on the `sellers` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "payout_slips";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "groups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizer_id" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'onsite',
    "location_name" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "meeting_url" TEXT,
    "start_at" DATETIME NOT NULL,
    "end_at" DATETIME NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "joinPolicy" TEXT NOT NULL DEFAULT 'auto',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "sheet_id" INTEGER,
    "subject_code" TEXT,
    "subject_name" TEXT,
    "faculty" TEXT,
    "major" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "groups_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "group_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payouts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "net_amount" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmed_at" DATETIME,
    "slip_image_path" TEXT,
    "slip_upload_date" DATETIME,
    "slip_uploaded_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payouts_slip_uploaded_by_fkey" FOREIGN KEY ("slip_uploaded_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payouts" ("amount", "commission", "confirmed_at", "created_at", "id", "net_amount", "seller_id", "status", "updated_at") SELECT "amount", "commission", "confirmed_at", "created_at", "id", "net_amount", "seller_id", "status", "updated_at" FROM "payouts";
DROP TABLE "payouts";
ALTER TABLE "new_payouts" RENAME TO "payouts";
CREATE TABLE "new_sellers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "pen_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_account" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "prompt_pay_id" TEXT,
    "total_revenue" REAL NOT NULL DEFAULT 0,
    "seller_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sellers" ("account_name", "bank_account", "bank_name", "created_at", "id", "pen_name", "phone", "prompt_pay_id", "seller_id", "total_revenue", "updated_at", "user_id") SELECT "account_name", "bank_account", "bank_name", "created_at", "id", "pen_name", "phone", "prompt_pay_id", "seller_id", "total_revenue", "updated_at", "user_id" FROM "sellers";
DROP TABLE "sellers";
ALTER TABLE "new_sellers" RENAME TO "sellers";
CREATE UNIQUE INDEX "sellers_user_id_key" ON "sellers"("user_id");
CREATE UNIQUE INDEX "sellers_pen_name_key" ON "sellers"("pen_name");
CREATE UNIQUE INDEX "sellers_seller_id_key" ON "sellers"("seller_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "groups_organizer_id_idx" ON "groups"("organizer_id");

-- CreateIndex
CREATE INDEX "groups_start_at_idx" ON "groups"("start_at");

-- CreateIndex
CREATE INDEX "groups_faculty_idx" ON "groups"("faculty");

-- CreateIndex
CREATE INDEX "groups_major_idx" ON "groups"("major");

-- CreateIndex
CREATE INDEX "group_members_user_id_idx" ON "group_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");
