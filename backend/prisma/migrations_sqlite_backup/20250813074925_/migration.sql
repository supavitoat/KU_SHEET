/*
  Warnings:

  - You are about to drop the `faculties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sheets_new` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `faculty_id` on the `sheets` table. All the data in the column will be lost.
  - You are about to drop the column `subject_id` on the `sheets` table. All the data in the column will be lost.
  - You are about to drop the column `subject_name` on the `sheets` table. All the data in the column will be lost.
  - Added the required column `subject_name_json` to the `sheets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "faculties_code_key";

-- DropIndex
DROP INDEX "faculties_name_key";

-- DropIndex
DROP INDEX "subjects_code_faculty_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "faculties";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "sheets_new";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "subjects";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "wishlists" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "sheet_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wishlists_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "sheet_id" INTEGER NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_price" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_status" TEXT DEFAULT 'PENDING',
    "payment_method" TEXT DEFAULT 'PENDING',
    "is_free_order" BOOLEAN NOT NULL DEFAULT false,
    "payment_slip" TEXT,
    "payment_date" DATETIME,
    "verified_date" DATETIME,
    "paid_at" DATETIME,
    "admin_notes" TEXT,
    "order_number" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("admin_notes", "amount", "created_at", "id", "order_number", "payment_date", "payment_slip", "seller_id", "sheet_id", "status", "updated_at", "user_id", "verified_date") SELECT "admin_notes", "amount", "created_at", "id", "order_number", "payment_date", "payment_slip", "seller_id", "sheet_id", "status", "updated_at", "user_id", "verified_date" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE TABLE "new_sheets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "faculty" TEXT,
    "major" TEXT,
    "title" TEXT NOT NULL,
    "subject_code" TEXT NOT NULL,
    "subject_name_json" TEXT NOT NULL,
    "section" TEXT,
    "short_description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "preview_images" TEXT,
    "pdf_file" TEXT NOT NULL,
    "admin_message" TEXT,
    "seller_message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sheets_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sheets" ("admin_message", "created_at", "download_count", "id", "is_free", "pdf_file", "preview_images", "price", "section", "seller_id", "seller_message", "short_description", "status", "subject_code", "term", "title", "type", "updated_at", "year") SELECT "admin_message", "created_at", "download_count", "id", "is_free", "pdf_file", "preview_images", "price", "section", "seller_id", "seller_message", "short_description", "status", "subject_code", "term", "title", "type", "updated_at", "year" FROM "sheets";
DROP TABLE "sheets";
ALTER TABLE "new_sheets" RENAME TO "sheets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_sheet_id_key" ON "wishlists"("user_id", "sheet_id");
