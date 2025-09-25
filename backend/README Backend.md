# KU Sheet App - Backend Documentation

## 📋 Overview
Backend API server สำหรับแอปพลิเคชัน KU Sheet ที่ให้บริการ API endpoints สำหรับการจัดการชีทสรุป, การซื้อขาย, ระบบชำระเงิน, และการจัดการกลุ่มติว

## 🏗️ Architecture
- **Framework**: Node.js + Express.js
- **Database**: MySQL + Prisma ORM
- **Real-time**: Socket.IO สำหรับแชทกลุ่ม
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Payment**: PromptPay + Stripe integration

## 📁 Project Structure

### 🔧 Configuration Files
```
backend/
├── package.json          # Dependencies และ scripts
├── .env                  # Environment variables (ไม่ commit)
├── Dockerfile           # Docker configuration สำหรับ container
├── .dockerignore        # Files ที่ไม่ต้อง copy เข้า Docker
└── README.md           # เอกสารนี้
```

### 🗄️ Database & Schema
```
prisma/
├── schema.prisma        # Database schema definition
├── dev.db              # SQLite database (development)
├── dev.backup.db       # Backup ของ database
└── migrations_sqlite_backup/  # Migration files
    ├── 20250731101039_init_sqlite/
    ├── 20250813_update_sheet_schema/
    └── ... (migrations อื่นๆ)
```

**หน้าที่**: กำหนดโครงสร้างฐานข้อมูล, ตาราง, และความสัมพันธ์ระหว่างตาราง

### ⚙️ Configuration
```
config/
├── database.js         # การเชื่อมต่อฐานข้อมูล Prisma
└── mailer.js          # การตั้งค่าส่งอีเมล
```

**หน้าที่**: 
- `database.js`: จัดการการเชื่อมต่อฐานข้อมูล, connection pooling, และ error handling
- `mailer.js`: ตั้งค่าส่งอีเมล (ยังไม่ได้ใช้งานเต็มรูปแบบ)

### 🛡️ Middleware
```
middleware/
├── auth.js            # JWT authentication middleware
├── upload.js          # File upload handling (Multer)
└── validation.js      # Input validation helpers
```

**หน้าที่**:
- `auth.js`: ตรวจสอบ JWT token, อนุญาต/ปฏิเสธการเข้าถึง API
- `upload.js`: จัดการการอัปโหลดไฟล์ (PDF, รูปภาพ)
- `validation.js`: ตรวจสอบข้อมูลที่ส่งเข้ามา

### 🎮 Controllers (Business Logic)
```
controllers/
├── adminController.js      # จัดการข้อมูล admin dashboard
├── adminGroupController.js # จัดการกลุ่มติวสำหรับ admin
├── authController.js       # เข้าสู่ระบบ, สมัครสมาชิก, จัดการโปรไฟล์
├── chatController.js       # ระบบแชทกลุ่ม
├── discountController.js   # ระบบคูปองส่วนลด
├── financeController.js    # จัดการการเงิน, รายได้
├── groupController.js      # จัดการกลุ่มติว
├── metadataController.js   # ข้อมูลพื้นฐาน (คณะ, วิชา)
├── notificationController.js # ระบบแจ้งเตือน
├── orderController.js      # จัดการคำสั่งซื้อ
├── paymentController.js    # ระบบชำระเงิน (PromptPay, Stripe)
├── reportController.js     # ระบบรายงาน
├── reputationController.js # ระบบคะแนนความน่าเชื่อถือ
├── reviewController.js     # ระบบรีวิว
├── sellerController.js     # จัดการข้อมูลผู้ขาย
├── sheetController.js      # จัดการชีทสรุป
├── slipController.js       # จัดการสลิปการโอนเงิน
└── wishlistController.js   # ระบบรายการโปรด
```

**หน้าที่**: แต่ละไฟล์มีหน้าที่จัดการ business logic ของแต่ละส่วน เช่น:
- `authController.js`: ตรวจสอบการเข้าสู่ระบบ, สร้าง JWT token
- `sheetController.js`: CRUD operations สำหรับชีทสรุป
- `paymentController.js`: ประมวลผลการชำระเงิน

### 🛣️ Routes (API Endpoints)
```
routes/
├── adminRoutes.js      # /api/admin/* - Admin endpoints
├── authRoutes.js       # /api/auth/* - Authentication endpoints
├── chatRoutes.js       # /api/groups/:id/chat/* - Chat endpoints
├── groupRoutes.js      # /api/groups/* - Group management
├── metadataRoutes.js   # /api/metadata/* - Basic data (faculties, subjects)
├── notificationRoutes.js # /api/notifications/* - Notifications
├── orderRoutes.js      # /api/orders/* - Order management
├── paymentRoutes.js    # /api/payments/* - Payment processing
├── reportRoutes.js     # /api/reports/* - Reporting system
├── reputationRoutes.js # /api/users/:id/feedback - User reputation
├── reviewRoutes.js     # /api/reviews/* - Review system
├── sellerRoutes.js     # /api/seller/* - Seller management
├── sheetRoutes.js      # /api/sheets/* - Sheet management
└── wishlistRoutes.js   # /api/wishlist/* - Wishlist management
```

**หน้าที่**: กำหนด API endpoints และเชื่อมต่อกับ controllers

### 🔄 Real-time Communication
```
realtime/
└── socket.js          # Socket.IO server configuration
```

**หน้าที่**: จัดการ real-time communication สำหรับ:
- แชทกลุ่ม (group chat)
- การแจ้งเตือนแบบ real-time
- การส่งข้อความทันทีโดยไม่ต้อง refresh

### ⏰ Background Jobs
```
schedulers/
└── groupReminder.js   # ระบบแจ้งเตือนกลุ่มติว
```

**หน้าที่**: งานที่ทำงานในพื้นหลัง เช่น:
- ส่งการแจ้งเตือนก่อนเริ่มกลุ่มติว 1 ชั่วโมง
- งานที่ต้องทำเป็นระยะๆ

### 🛠️ Utilities
```
utils/
├── appSettings.js     # การตั้งค่าแอปพลิเคชัน
├── cache.js          # ระบบ cache (ยังไม่ได้ใช้งานเต็มรูปแบบ)
├── dateHelpers.js    # ฟังก์ชันช่วยจัดการวันที่
├── downloadImage.js  # ดาวน์โหลดรูปภาพจาก URL
├── prismaRetry.js    # Retry mechanism สำหรับ Prisma
├── sseHub.js         # Server-Sent Events hub
├── subjectNameHelpers.js # ช่วยจัดการชื่อวิชา
└── validation.js     # ฟังก์ชัน validation เพิ่มเติม
```

**หน้าที่**: ฟังก์ชันช่วยเหลือที่ใช้ร่วมกันทั่วทั้งแอป

### 📁 File Storage
```
uploads/
├── covers/           # รูปหน้าปกชีท
├── previews/         # รูปตัวอย่างเนื้อหา
├── profiles/         # รูปโปรไฟล์ผู้ใช้
├── sheets/           # ไฟล์ PDF ชีทสรุป
└── slips/            # สลิปการโอนเงิน
```

**หน้าที่**: เก็บไฟล์ที่อัปโหลดจากผู้ใช้

### 🚀 Main Server
```
server.js             # Main server file
```

**หน้าที่**: 
- เริ่มต้น Express server
- ตั้งค่า middleware (CORS, security, rate limiting)
- เชื่อมต่อฐานข้อมูล
- เริ่มต้น Socket.IO
- เริ่มต้น background schedulers

## 🔌 API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /register` - สมัครสมาชิก
- `POST /login` - เข้าสู่ระบบ
- `GET /me` - ดูข้อมูลผู้ใช้ปัจจุบัน
- `PUT /profile` - แก้ไขโปรไฟล์

### Sheets (`/api/sheets`)
- `GET /` - ดูรายการชีททั้งหมด
- `GET /:id` - ดูรายละเอียดชีท
- `GET /:id/download` - ดาวน์โหลดชีท (ต้องซื้อแล้ว)
- `GET /:id/download-free` - ดาวน์โหลดชีทฟรี

### Groups (`/api/groups`)
- `GET /` - ดูรายการกลุ่มติว
- `POST /` - สร้างกลุ่มติวใหม่
- `GET /:id` - ดูรายละเอียดกลุ่ม
- `POST /:id/join` - เข้าร่วมกลุ่ม

### Chat (`/api/groups/:id/chat`)
- `GET /` - ดูข้อความในแชท
- `POST /messages` - ส่งข้อความ
- `GET /stream` - SSE stream สำหรับ real-time

### Payments (`/api/payments`)
- `POST /promptpay/create` - สร้าง PromptPay session
- `POST /promptpay/verify` - ตรวจสอบการชำระเงิน
- `POST /stripe/create-checkout-session` - สร้าง Stripe session

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (USER, ADMIN)
- Protected routes middleware

### Security Middleware
- Helmet.js สำหรับ security headers
- CORS configuration
- Rate limiting (1000 requests/15min)
- Input validation และ sanitization

### File Upload Security
- File type validation
- File size limits
- Secure file storage

## 🗄️ Database Schema

### Main Tables
- `users` - ข้อมูลผู้ใช้
- `sellers` - ข้อมูลผู้ขาย
- `sheets` - ข้อมูลชีทสรุป
- `orders` - คำสั่งซื้อ
- `groups` - กลุ่มติว
- `chat_messages` - ข้อความในแชท
- `reviews` - รีวิว
- `notifications` - การแจ้งเตือน

### Key Relationships
- User → Seller (1:1)
- Seller → Sheets (1:many)
- User → Orders (1:many)
- Group → Chat Messages (1:many)
- User → Reviews (1:many)

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Docker (optional)

### Environment Variables
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/ku_sheet_db"

# JWT
JWT_SECRET="your-secret-key"

# CORS
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

# Email (optional)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASS="your-app-password"

# Payment (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Installation
```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### Docker Setup
```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f backend
```

## 📊 Monitoring & Logging

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/ready` - Database connectivity check

### Logging
- Console logging for development
- Error tracking และ debugging
- Request/response logging (optional)

## 🔄 Real-time Features

### Socket.IO Events
- `chat:join` - เข้าร่วมแชทกลุ่ม
- `chat:send` - ส่งข้อความ
- `chat:message` - รับข้อความใหม่
- `chat:typing` - แสดงสถานะกำลังพิมพ์

### Server-Sent Events (SSE)
- Fallback สำหรับ Socket.IO
- Real-time chat updates
- Connection management

## 🛠️ Development Tips

### Database Operations
```bash
# Reset database
npx prisma db push --force-reset

# View database
npx prisma studio

# Generate Prisma client
npx prisma generate
```

### Testing API
```bash
# Health check
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Debugging
- ใช้ `console.log()` สำหรับ debugging
- ตรวจสอบ logs ใน Docker: `docker compose logs backend`
- ใช้ Prisma Studio สำหรับดูข้อมูลในฐานข้อมูล

## 📝 Notes

### Performance Considerations
- Database connection pooling
- File upload size limits
- Rate limiting
- Caching strategies (future enhancement)

### Scalability
- Stateless design
- Database indexing
- File storage optimization
- Load balancing ready

### Future Enhancements
- Redis caching
- Email notifications
- Advanced analytics
- Mobile app API
- Webhook integrations
