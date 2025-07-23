# 🐬 MySQL Setup สำหรับ KU SHEET

## 🎯 เปลี่ยนจาก SQLite เป็น MySQL

เราได้เตรียม Prisma schema สำหรับ MySQL แล้ว! ตอนนี้คุณสามารถใช้ MySQL ได้หลายวิธี:

### 📋 **Prisma Schema (MySQL-ready)**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Models พร้อม MySQL data types:
// - @db.VarChar(255) 
// - @db.Text
// - @db.Decimal(10,2)
// - Json support
// - Enums
```

## 🔧 **วิธีที่ 1: ใช้ Docker MySQL (แนะนำ)**

```bash
# รัน MySQL container
docker run -d \
  --name ku-sheet-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=ku_sheet_db \
  -p 3306:3306 \
  mysql:8.0

# หรือใช้ docker-compose
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: ku-sheet-mysql
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: ku_sheet_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## 🔧 **วิธีที่ 2: Local MySQL**

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# สร้าง database
sudo mysql -e "CREATE DATABASE ku_sheet_db;"
sudo mysql -e "CREATE USER 'kusheet'@'localhost' IDENTIFIED BY 'password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ku_sheet_db.* TO 'kusheet'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

## 🔧 **วิธีที่ 3: Cloud MySQL**

### PlanetScale (แนะนำสำหรับ Production)
```bash
# DATABASE_URL="mysql://username:password@host:3306/database?sslaccept=strict"
```

### Railway MySQL
```bash
# DATABASE_URL="mysql://root:password@containers-us-west-xxx.railway.app:7600/railway"
```

## ⚙️ **Configuration**

### **.env**
```env
# MySQL Database URL
DATABASE_URL="mysql://root:password@localhost:3306/ku_sheet_db"

# หรือใช้ user เฉพาะ
DATABASE_URL="mysql://kusheet:password@localhost:3306/ku_sheet_db"
```

## 🚀 **Migration & Seed**

```bash
# สร้าง migration สำหรับ MySQL
npx prisma migrate dev --name init_mysql

# Generate Prisma client
npx prisma generate

# Seed ข้อมูล
npm run seed

# เปิด Prisma Studio
npx prisma studio
```

## 🔄 **สลับระหว่าง SQLite และ MySQL**

### สำหรับ Development (SQLite):
```env
DATABASE_URL="file:./dev.db"
```

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### สำหรับ Production (MySQL):
```env
DATABASE_URL="mysql://user:password@host:3306/database"
```

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## 📊 **ข้อดีของ MySQL vs SQLite**

### MySQL:
- ✅ Production-ready
- ✅ Better performance
- ✅ Multiple connections
- ✅ Advanced features
- ✅ JSON support
- ✅ Full-text search

### SQLite:
- ✅ Zero configuration
- ✅ Single file database
- ✅ Perfect for development
- ✅ No server needed

## 🎯 **Status ปัจจุบัน**

- ✅ **Prisma Schema**: รองรับ MySQL แล้ว
- ✅ **Data Types**: ใช้ MySQL types
- ✅ **Enums**: MySQL enums พร้อมใช้
- ✅ **Relations**: Foreign keys ถูกต้อง
- ⏳ **Local MySQL**: มีปัญหาใน environment นี้

## 🔧 **แนะนำ: ใช้ Docker**

```bash
# Quick start with Docker
docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 mysql:8.0

# Wait for MySQL to start
sleep 30

# Create database
docker exec mysql mysql -uroot -ppassword -e "CREATE DATABASE ku_sheet_db;"

# Test connection
mysql -h127.0.0.1 -P3306 -uroot -ppassword -e "SHOW DATABASES;"
```

---

**Schema พร้อมแล้ว! เพียงแค่เชื่อมต่อ MySQL และรัน migration** 🎉