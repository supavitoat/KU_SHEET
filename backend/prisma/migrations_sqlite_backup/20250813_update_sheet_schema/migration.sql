-- Update Sheet table schema to use names instead of IDs
PRAGMA foreign_keys=off;

-- Create new table structure
CREATE TABLE "sheets_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "faculty_name" TEXT NOT NULL,
    "subject_name" TEXT NOT NULL,
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

-- Copy data from old table to new table (if exists)
-- INSERT INTO "sheets_new" SELECT * FROM "sheets";

-- Drop old table
-- DROP TABLE "sheets";

-- Rename new table
-- ALTER TABLE "sheets_new" RENAME TO "sheets";

PRAGMA foreign_keys=on;
