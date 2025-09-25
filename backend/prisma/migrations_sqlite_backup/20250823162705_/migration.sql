/*
  Warnings:

  - You are about to drop the column `seller_message` on the `sheets` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `sheets` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "term" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "preview_images" TEXT,
    "pdf_file" TEXT NOT NULL,
    "admin_message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sheets_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sheets" ("admin_message", "created_at", "download_count", "faculty", "id", "is_free", "major", "pdf_file", "preview_images", "price", "section", "seller_id", "short_description", "status", "subject_code", "subject_name_json", "term", "title", "updated_at", "year") SELECT "admin_message", "created_at", "download_count", "faculty", "id", "is_free", "major", "pdf_file", "preview_images", "price", "section", "seller_id", "short_description", "status", "subject_code", "subject_name_json", "term", "title", "updated_at", "year" FROM "sheets";
DROP TABLE "sheets";
ALTER TABLE "new_sheets" RENAME TO "sheets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
