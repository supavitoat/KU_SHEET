-- AlterTable
ALTER TABLE "orders" ADD COLUMN "payment_reference" TEXT;

-- CreateTable
CREATE TABLE "reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "sheet_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "full_name" TEXT,
    "faculty" TEXT,
    "major" TEXT,
    "year" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "google_id" TEXT,
    "is_seller" BOOLEAN NOT NULL DEFAULT false,
    "is_first_login" BOOLEAN NOT NULL DEFAULT true,
    "profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "picture" TEXT
);
INSERT INTO "new_users" ("created_at", "email", "faculty", "full_name", "google_id", "id", "is_first_login", "is_seller", "major", "password", "picture", "profile_completed", "role", "updated_at", "year") SELECT "created_at", "email", "faculty", "full_name", "google_id", "id", "is_first_login", "is_seller", "major", "password", "picture", "profile_completed", "role", "updated_at", "year" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_sheet_id_key" ON "reviews"("user_id", "sheet_id");
