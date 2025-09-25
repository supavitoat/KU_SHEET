-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_groups" (
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
    "reminder_one_hour_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_one_day_sent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "groups_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "groups_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("address", "capacity", "created_at", "description", "end_at", "faculty", "id", "joinPolicy", "latitude", "location_name", "longitude", "major", "meeting_url", "mode", "organizer_id", "sheet_id", "start_at", "status", "subject_code", "subject_name", "title", "updated_at", "visibility") SELECT "address", "capacity", "created_at", "description", "end_at", "faculty", "id", "joinPolicy", "latitude", "location_name", "longitude", "major", "meeting_url", "mode", "organizer_id", "sheet_id", "start_at", "status", "subject_code", "subject_name", "title", "updated_at", "visibility" FROM "groups";
DROP TABLE "groups";
ALTER TABLE "new_groups" RENAME TO "groups";
CREATE INDEX "groups_organizer_id_idx" ON "groups"("organizer_id");
CREATE INDEX "groups_start_at_idx" ON "groups"("start_at");
CREATE INDEX "groups_faculty_idx" ON "groups"("faculty");
CREATE INDEX "groups_major_idx" ON "groups"("major");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
