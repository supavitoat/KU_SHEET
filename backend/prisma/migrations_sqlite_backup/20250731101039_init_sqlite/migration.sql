-- CreateTable
CREATE TABLE "users" (
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "picture" TEXT
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "pen_name" TEXT NOT NULL,
    "real_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_account" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "total_revenue" REAL NOT NULL DEFAULT 0,
    "seller_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "credits" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subjects_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sheets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seller_id" INTEGER NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subject_code" TEXT NOT NULL,
    "subject_name" TEXT NOT NULL,
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
    CONSTRAINT "sheets_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sheets_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sheets_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "sheet_id" INTEGER NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "payment_slip" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_date" DATETIME,
    "verified_date" DATETIME,
    "admin_notes" TEXT,
    "order_number" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_user_id_key" ON "sellers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_pen_name_key" ON "sellers"("pen_name");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_seller_id_key" ON "sellers"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_name_key" ON "faculties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_faculty_id_key" ON "subjects"("code", "faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
