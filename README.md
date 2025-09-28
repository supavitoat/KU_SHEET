# KU SHEET — แพลตฟอร์มซื้อ-ขายและแชร์ชีทสรุป ออนไลน์

![KU SHEET Banner1](frontend/src/assets/Review/R1.png)

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](./frontend)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white)](./frontend)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-43853D?logo=node.js&logoColor=white)](./backend)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/DB-MySQL-0F5D95?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Stripe](https://img.shields.io/badge/Payment-Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)


แอปพลิเคชันเว็บเต็มรูปแบบสำหรับนิสิต/นักศึกษาในการซื้อ-ขายและแบ่งปันชีทสรุปบทเรียน พร้อมระบบกลุ่มติว, ห้องแชท, รีวิว, Wishlist, การแจ้งเตือน และระบบชำระเงินทั้ง PromptPay Stripe

---

## 📋 ภาพรวมและคุณสมบัติเด่น
- ซื้อ-ขายชีทสรุป (ไฟล์ PDF พร้อมรูปตัวอย่างหน้าปก/พรีวิว)
- ระบบผู้ขาย (Seller): สร้าง/แก้ไขชีท, ดูรายได้, อัปโหลดไฟล์
- ระบบผู้ดูแล (Admin): จัดการผู้ใช้/ชีท/ออเดอร์/กลุ่มติว/การเงิน/รายงาน
- กลุ่มติวและห้องแชท
- ระบบคะแนนความน่าเชื่อถือ รีวิว และ Wishlist
- Notification Center
- ระบบชำระเงิน: PromptPay และ Stripe Checkout/Webhook
- ระบบไฟล์อัปโหลด: โปรไฟล์/ตัวอย่าง/สลิป
- ระบบค้นหา/กรอง

---

## 🏗️ สถาปัตยกรรมและเทคโนโลยี

```
- Frontend: React + Vite (Dev), Build เสิร์ฟผ่าน Nginx (Prod)
- Backend: Express (REST) + Prisma (ORM)
- Database: MySQL 8
- Files: จัดเก็บโลคัล `/uploads/{sheets,previews,slips,profiles}`
- Payments: Stripe (Checkout/Webhook)
- Realtime: Chat / Notification 
- Schedulers: งานแจ้งเตือน / งานกลุ่มติว
- Security: JWT Auth, Helmet, Rate Limit, Validation, Webhook Verify

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน

1) ติดตั้งเครื่องมือ
- Node.js 20+
- MySQL 8.0+ (หรือใช้ Docker แยกก็ได้)

2) Backend
- สร้างไฟล์ `backend/.env` ตามตัวอย่างด้านล่าง
- ติดตั้งและเตรียมฐานข้อมูล

```powershell
cd backend
npm install
npx prisma generate ; npx prisma db push
npm run dev
```

เริ่มที่ http://localhost:5000 (Health: `/api/health`)

3) Frontend
- คอนฟิก `.env` ที่โฟลเดอร์ `frontend/` (ดูตัวอย่างด้านล่าง)
- รัน dev server

```powershell
cd ../frontend
npm install
npm run dev
```

เปิด http://localhost:5173

1) สร้างไฟล์ `backend/.env` (ตัวอย่างด้านล่าง) และ `frontend/.env` โดยตั้งค่า `VITE_API_URL` ให้ชี้ไปที่ backend บนพอร์ต 5001 ดังนี้:
```env
# frontend/.env (สำหรับ Docker)
VITE_API_URL=http://localhost:5001/api
VITE_APP_NAME="KU SHEET"
VITE_APP_VERSION="1.0.0"
```

2) เปิดใช้งาน
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api

---

## 🔐 การตั้งค่า Environment Variables

### Backend (`backend/.env`)
ตัวอย่างค่าที่ใช้ได้ทันที (ปรับตามเครื่องคุณ):
```env
# Database (Docker Compose จะใช้ค่านี้ใน container: DATABASE_URL=mysql://app:app@db:3306/ku_sheet_db)
DATABASE_URL="mysql://root:root@localhost:3307/ku_sheet_db"

# JWT
JWT_SECRET="your-secret-key"

# CORS (Origin ของ Frontend ตอน dev)
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

# Email (ถ้าต้องการ)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASS="your-app-password"

# Stripe (ถ้าเปิดใช้งาน Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

เริ่มเซิร์ฟเวอร์ด้วย:
```powershell
cd backend
npm run dev
```

### Frontend (`frontend/.env`)
พัฒนาแบบ local (ใช้ proxy):
```env
VITE_API_URL=/api
VITE_APP_NAME="KU SHEET"
VITE_APP_VERSION="1.0.0"
```

Optional services:
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Google Maps (ถ้าใช้แผนที่)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

---

## 🖼️ สกรีนช็อต/รูปตัวอย่าง

หน้าหลัก (ตัวอย่าง UI):

![1](frontend/src/assets/Review/R1.png)
![2](frontend/src/assets/Review/R2.png)
![3](frontend/src/assets/Review/R3.png)
![4](frontend/src/assets/Review/R4.png)
![5](frontend/src/assets/Review/R5.png)
![6](frontend/src/assets/Review/R6.png)
![7](frontend/src/assets/Review/R7.png)
![8](frontend/src/assets/Review/R8.png)

---

## 📄 License
-

---


