# 🚀 คู่มือเริ่มต้นใช้งาน KU SHEET

## ✅ สถานะปัจจุบัน
โปรเจ็คทำงานได้แล้ว! ✨

### 🌐 เข้าใช้งานระบบ
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

### 🔑 ข้อมูลผู้ดูแลระบบ
- **Email**: admin@kusheet.com
- **Password**: admin123

## 🛠️ การรันโปรเจ็ค

### Backend
```bash
cd backend
npm start
```

### Frontend  
```bash
cd frontend
npm run dev
```

### สร้างข้อมูลเริ่มต้น
```bash
cd backend
npm run seed
```

## ⚙️ การแก้ไขปัญหา

### 1. MySQL Connection Error
**ปัญหา**: `Error: Referencing column 'user_id' and referenced column 'id' in foreign key constraint`

**แก้ไข**: เปลี่ยนใช้ SQLite แทน MySQL
- ✅ ติดตั้ง `sqlite3`: `npm install sqlite3`
- ✅ แก้ไข `config/database.js` ให้ใช้ SQLite
- ✅ ฐานข้อมูลจะถูกสร้างเป็นไฟล์ `database.sqlite`

### 2. Dependencies Issues
**ปัญหา**: React Query version conflicts

**แก้ไข**:
- ✅ ใช้ `@tanstack/react-query` แทน `react-query`
- ✅ ใช้ `--legacy-peer-deps` เมื่อ install

### 3. Tailwind CSS Issues
**ปัญหา**: PostCSS plugin errors

**แก้ไข**:
- ✅ ติดตั้ง `@tailwindcss/postcss`
- ✅ แก้ไข CSS classes ที่ไม่มีอยู่

## 📁 โครงสร้างโปรเจ็ค

```
ku-sheet-app/
├── backend/
│   ├── config/          # การตั้งค่าฐานข้อมูล
│   ├── controllers/     # Business logic
│   ├── middleware/      # Authentication, validation
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── seeds/           # Initial data
│   ├── uploads/         # File storage
│   ├── .env             # Environment variables
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Global state
│   │   ├── pages/       # Page components
│   │   ├── services/    # API calls
│   │   └── index.css    # Tailwind styles
│   └── package.json
│
└── README.md
```

## 🧪 ทดสอบระบบ

### Backend API
```bash
# Health Check
curl http://localhost:5000/health

# Get all faculties
curl http://localhost:5000/api/metadata/faculties

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kusheet.com","password":"admin123"}'
```

### Frontend
- เปิดเบราว์เซอร์ไปที่ http://localhost:5173
- ทดสอบการ login ด้วยข้อมูล admin
- ทดสอบการนำทางระหว่างหน้า

## 🔧 การพัฒนาต่อ

### หน้าที่ต้องพัฒนาต่อ (มี placeholder แล้ว):
- [ ] Login & Register forms
- [ ] User Info Entry
- [ ] Shop & Sheet listing
- [ ] Sheet Detail with PDF preview
- [ ] Cart & Payment
- [ ] Seller registration & management
- [ ] Admin dashboard

### Features ที่พร้อมใช้:
- ✅ Database structure
- ✅ API endpoints
- ✅ Authentication system
- ✅ File upload handling
- ✅ Basic routing
- ✅ Responsive layout

## 🎯 Next Steps

1. **Frontend Development**: แทนที่ placeholder pages ด้วยฟอร์มและ components จริง
2. **File Upload**: ทดสอบการอัปโหลดไฟล์ PDF และรูปภาพ
3. **Payment Integration**: เพิ่มระบบการอัปโหลดสลิปและการยืนยัน
4. **PDF Preview**: ใช้ PDF.js สำหรับการแสดงตัวอย่าง PDF
5. **Google OAuth**: ตั้งค่า Google OAuth credentials
6. **Production**: เตรียมระบบสำหรับ deployment

---
📧 Contact: สำหรับข้อสงสัยเพิ่มเติม