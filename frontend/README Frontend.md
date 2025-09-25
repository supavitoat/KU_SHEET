# KU Sheet App - Frontend Documentation

## 📋 Overview
Frontend web application สำหรับแอปพลิเคชัน KU Sheet ที่ให้ผู้ใช้สามารถค้นหา, ซื้อ, และดาวน์โหลดชีทสรุป รวมถึงเข้าร่วมกลุ่มติวและแชทแบบ real-time

## 🏗️ Technology Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Heroicons, Custom components
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## 📁 Project Structure

### 🔧 Configuration Files
```
frontend/
├── package.json          # Dependencies และ scripts
├── vite.config.js        # Vite build configuration
├── tailwind.config.cjs   # Tailwind CSS configuration
├── postcss.config.cjs    # PostCSS configuration
├── components.json       # UI components configuration
├── jsconfig.json         # JavaScript configuration
├── eslint.config.js      # ESLint configuration
├── index.html            # Main HTML file
├── Dockerfile           # Docker configuration
├── .dockerignore        # Files ที่ไม่ต้อง copy เข้า Docker
└── README.md           # เอกสารนี้
```

### 🎨 Assets & Static Files
```
public/
└── vite.svg            # Vite logo

src/assets/
├── 11101976.png        # รูปภาพต่างๆ
├── cart.png           # ไอคอนตะกร้า
├── CloseEye.png       # ไอคอนปิดตา
├── facebook.png       # ไอคอน Facebook
├── heart.png          # ไอคอนหัวใจ
├── homeimg.png        # รูปหน้าหลัก
├── key.png            # ไอคอนกุญแจ
├── logo.png           # โลโก้แอป
├── mail.png           # ไอคอนอีเมล
├── OpenEye.png        # ไอคอนเปิดตา
├── react.svg          # React logo
├── reset.png          # ไอคอนรีเซ็ต
├── Sendmail.png       # ไอคอนส่งอีเมล
└── โลโก้คณะ*.png       # โลโก้คณะต่างๆ
```

**หน้าที่**: เก็บไฟล์รูปภาพ, ไอคอน, และโลโก้ที่ใช้ในแอป

### 🎯 Main Application Files
```
src/
├── main.jsx           # Entry point ของแอป
├── App.jsx            # Main App component
├── App.css            # Global styles
└── index.css          # Tailwind CSS imports
```

**หน้าที่**:
- `main.jsx`: จุดเริ่มต้นของแอป, render App component
- `App.jsx`: Component หลักที่จัดการ routing และ layout
- `App.css`: CSS styles ที่ใช้ทั่วทั้งแอป
- `index.css`: Import Tailwind CSS และ custom styles

### 🧩 Components

#### 🔐 Authentication Components
```
src/components/auth/
└── LoginForm.jsx      # ฟอร์มเข้าสู่ระบบ
```

**หน้าที่**: จัดการ UI สำหรับการเข้าสู่ระบบ

#### 👨‍💼 Admin Components
```
src/components/admin/
└── AdminLayout.jsx    # Layout สำหรับหน้า admin
```

**หน้าที่**: Layout และ navigation สำหรับผู้ดูแลระบบ

#### 💬 Chat Components
```
src/components/chat/
└── GroupChat.jsx      # Component แชทกลุ่ม
```

**หน้าที่**: 
- แสดงข้อความในแชทกลุ่ม
- ส่งข้อความแบบ real-time
- จัดการ Socket.IO connection
- Fallback ไป SSE ถ้า Socket.IO ไม่ทำงาน

#### 🔧 Common Components
```
src/components/common/
├── LoadingSpinner.jsx     # Loading indicator
├── ProductCard.jsx        # การ์ดแสดงชีทสรุป
├── SlipViewModal.jsx      # Modal แสดงสลิปการโอนเงิน
├── Pagination.jsx         # ระบบแบ่งหน้า
├── SearchBar.jsx          # ช่องค้นหา
├── FilterDropdown.jsx     # Dropdown สำหรับกรองข้อมูล
├── ConfirmDialog.jsx      # Dialog ยืนยันการกระทำ
├── ErrorBoundary.jsx      # จัดการ error ที่เกิดขึ้น
└── ProtectedRoute.jsx     # Route ที่ต้อง login
```

**หน้าที่**: Components ที่ใช้ร่วมกันทั่วทั้งแอป

#### 🎨 Magic UI Components
```
src/components/magicui/
├── Button.jsx         # Custom button component
├── Input.jsx          # Custom input component
├── Modal.jsx          # Custom modal component
└── Toast.jsx          # Custom toast notification
```

**หน้าที่**: Custom UI components ที่ออกแบบพิเศษ

#### 🗺️ Map Components
```
src/components/maps/
├── MapDisplay.jsx     # แสดงแผนที่
├── LocationPicker.jsx # เลือกตำแหน่ง
└── MapMarker.jsx      # Marker บนแผนที่
```

**หน้าที่**: จัดการการแสดงแผนที่สำหรับกลุ่มติว

#### ⚡ Optimized Components
```
src/components/optimized/
└── LazyImage.jsx      # รูปภาพแบบ lazy loading
```

**หน้าที่**: Components ที่ปรับปรุงประสิทธิภาพ

#### 💳 Payment Components
```
src/components/
└── PromptPayPayment.jsx # ระบบชำระเงิน PromptPay
```

**หน้าที่**: จัดการ UI สำหรับการชำระเงิน

### 📄 Pages

#### 🏠 Main Pages
```
src/pages/
├── HomePage.jsx           # หน้าหลัก
├── ShopPage.jsx           # หน้าช้อปชีท
├── LoginPage.jsx          # หน้าเข้าสู่ระบบ
├── RegisterPage.jsx       # หน้าสมัครสมาชิก
├── ProfilePage.jsx        # หน้าโปรไฟล์
└── NotFoundPage.jsx       # หน้า 404
```

#### 📚 Sheet Management Pages
```
src/pages/sheets/
├── SheetDetailPage.jsx    # รายละเอียดชีท
├── SheetListPage.jsx      # รายการชีท
└── SheetSearchPage.jsx    # ค้นหาชีท
```

#### 👨‍💼 Seller Pages
```
src/pages/seller/
├── SellerDashboard.jsx    # Dashboard ผู้ขาย
├── CreateSheetPage.jsx    # สร้างชีทใหม่
├── EditSheetPage.jsx      # แก้ไขชีท
├── SellerSheetsPage.jsx   # รายการชีทของผู้ขาย
├── RevenueHistoryPage.jsx # ประวัติรายได้
├── SellerProfilePage.jsx  # โปรไฟล์ผู้ขาย
└── BankInfoPage.jsx       # ข้อมูลธนาคาร
```

#### 👑 Admin Pages
```
src/pages/admin/
├── AdminDashboard.jsx     # Dashboard admin
├── AdminUsersPage.jsx     # จัดการผู้ใช้
├── AdminSheetsPage.jsx    # จัดการชีท
├── AdminOrdersPage.jsx    # จัดการคำสั่งซื้อ
├── AdminGroupsPage.jsx    # จัดการกลุ่มติว
├── AdminFinancePage.jsx   # จัดการการเงิน
├── AdminReportsPage.jsx   # รายงาน
└── AdminSettingsPage.jsx  # ตั้งค่า
```

#### 👥 Group Pages
```
src/pages/groups/
├── GroupListPage.jsx      # รายการกลุ่มติว
├── GroupDetailPage.jsx    # รายละเอียดกลุ่ม
├── CreateGroupPage.jsx    # สร้างกลุ่มใหม่
├── EditGroupPage.jsx      # แก้ไขกลุ่ม
├── MyGroupsPage.jsx       # กลุ่มของฉัน
└── GroupChatPage.jsx      # หน้าแชทกลุ่ม
```

#### 🛒 Shopping Pages
```
src/pages/orders/
├── CartPage.jsx           # ตะกร้าสินค้า
├── CheckoutPage.jsx       # ชำระเงิน
├── OrderHistoryPage.jsx   # ประวัติคำสั่งซื้อ
└── OrderDetailPage.jsx    # รายละเอียดคำสั่งซื้อ
```

#### ⭐ Review & Wishlist Pages
```
src/pages/reviews/
├── ReviewPage.jsx         # หน้าเขียนรีวิว
└── ReviewListPage.jsx     # รายการรีวิว

src/pages/wishlist/
└── WishlistPage.jsx       # รายการโปรด
```

#### 🔔 Notification Pages
```
src/pages/notifications/
└── NotificationPage.jsx   # การแจ้งเตือน
```

### 🎯 Context (State Management)
```
src/contexts/
├── AuthContext.jsx        # จัดการสถานะการเข้าสู่ระบบ
├── CartContext.jsx        # จัดการตะกร้าสินค้า
├── NotificationsContext.jsx # จัดการการแจ้งเตือน
└── ThemeContext.jsx       # จัดการธีม (ยังไม่ได้ใช้)
```

**หน้าที่**:
- `AuthContext.jsx`: เก็บข้อมูลผู้ใช้, token, และฟังก์ชัน login/logout
- `CartContext.jsx`: จัดการสินค้าในตะกร้า, เพิ่ม/ลบสินค้า
- `NotificationsContext.jsx`: จัดการการแจ้งเตือน real-time

### 🎣 Custom Hooks
```
src/hooks/
├── useAuth.js            # Hook สำหรับ authentication
├── useCart.js            # Hook สำหรับตะกร้าสินค้า
└── useSocket.js          # Hook สำหรับ Socket.IO
```

**หน้าที่**: Custom hooks ที่ใช้ซ้ำได้สำหรับ logic ที่ซับซ้อน

### 🌐 API Services
```
src/services/
└── api.js                # API client configuration
```

**หน้าที่**:
- ตั้งค่า Axios instance
- จัดการ authentication headers
- Error handling
- API endpoints definitions

### 🛠️ Utilities
```
src/utils/
├── format.js             # ฟังก์ชันจัดรูปแบบข้อมูล
├── facultyColors.js      # สีประจำคณะ
├── validation.js         # ฟังก์ชัน validation
├── constants.js          # ค่าคงที่
├── helpers.js            # ฟังก์ชันช่วยเหลือ
└── storage.js            # จัดการ localStorage
```

**หน้าที่**: ฟังก์ชันช่วยเหลือที่ใช้ร่วมกัน

### 📚 Constants
```
src/constants/
└── academics.js          # ข้อมูลคณะและวิชา
```

**หน้าที่**: เก็บข้อมูลคงที่เช่น รายชื่อคณะ, วิชา

### 🔌 Libraries
```
src/lib/
├── socket.js             # Socket.IO client setup
├── auth.js               # Authentication helpers
├── utils.js              # Utility functions
└── api.js                # API helpers
```

**หน้าที่**:
- `socket.js`: จัดการการเชื่อมต่อ Socket.IO
- `auth.js`: ฟังก์ชันช่วยเหลือสำหรับ authentication
- `utils.js`: ฟังก์ชันทั่วไป
- `api.js`: ฟังก์ชันช่วยเหลือสำหรับ API calls

## 🎨 UI/UX Features

### 🎨 Design System
- **Color Scheme**: Blue gradient theme
- **Typography**: Modern, readable fonts
- **Icons**: Heroicons library
- **Responsive**: Mobile-first design
- **Animations**: Smooth transitions และ hover effects

### 📱 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface
- Optimized for various screen sizes

### 🎭 Component Patterns
- **Card-based Layout**: ใช้การ์ดสำหรับแสดงข้อมูล
- **Modal System**: สำหรับ popup และ forms
- **Loading States**: Loading spinners และ skeletons
- **Error Handling**: Error boundaries และ fallback UI

## 🔄 State Management

### Context API Usage
```javascript
// Authentication Context
const { user, isAuthenticated, login, logout } = useAuth();

// Cart Context
const { items, addToCart, removeFromCart, clearCart } = useCart();

// Notifications Context
const { notifications, markAsRead } = useNotifications();
```

### Local State Management
- React useState สำหรับ component state
- React useEffect สำหรับ side effects
- Custom hooks สำหรับ reusable logic

## 🌐 API Integration

### API Client Setup
```javascript
// Base configuration
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Endpoints Usage
```javascript
// Authentication
const { data } = await authAPI.login({ email, password });

// Sheets
const { data } = await sheetsAPI.getSheets({ page: 1, limit: 10 });

// Groups
const { data } = await groupsAPI.create({ title, description });

// Chat
const { data } = await chatAPI.sendMessage(groupId, { content });
```

## 🔌 Real-time Features

### Socket.IO Integration
```javascript
// Connect to socket
const socket = getSocket();

// Join group chat
socket.emit('chat:join', { groupId });

// Send message
socket.emit('chat:send', { groupId, content });

// Listen for messages
socket.on('chat:message', (message) => {
  setMessages(prev => [...prev, message]);
});
```

### Server-Sent Events (SSE) Fallback
```javascript
// Fallback when Socket.IO fails
const eventSource = new EventSource(`/api/groups/${groupId}/chat/stream`);
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  setMessages(prev => [...prev, message]);
};
```

## 🛡️ Security Features

### Authentication
- JWT token storage ใน localStorage
- Automatic token refresh
- Protected routes
- Role-based access control

### Input Validation
- Client-side validation
- Sanitization ของ user input
- File upload validation
- XSS protection

### CORS Configuration
- Configured CORS origins
- Credentials support
- Secure headers

## 📱 User Experience

### Navigation
- React Router v6
- Protected routes
- Breadcrumb navigation
- Back button functionality

### Loading States
- Skeleton loaders
- Loading spinners
- Progressive loading
- Error states

### Notifications
- Toast notifications
- Real-time updates
- Unread count indicators
- Notification history

## 🚀 Performance Optimizations

### Code Splitting
- Lazy loading ของ pages
- Dynamic imports
- Bundle optimization

### Image Optimization
- Lazy loading images
- WebP format support
- Responsive images
- Image compression

### Caching
- API response caching
- Local storage caching
- Service worker (future)

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm หรือ yarn
- Modern web browser

### Environment Variables
```env
# API Configuration
VITE_API_URL=http://localhost:5001/api

# Development
VITE_NODE_ENV=development
```

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Setup
```bash
# Build and start
docker compose up -d --build frontend

# View logs
docker compose logs -f frontend
```

## 🧪 Testing

### Manual Testing
- Cross-browser testing
- Mobile responsiveness
- Real-time features
- Payment flow testing

### Development Tools
- React Developer Tools
- Redux DevTools (if using)
- Network tab debugging
- Console logging

## 📊 Build & Deployment

### Build Process
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

### Build Output
```
dist/
├── index.html          # Main HTML file
├── assets/
│   ├── index-[hash].js # Main JavaScript bundle
│   ├── index-[hash].css # Main CSS bundle
│   └── [hash].png      # Optimized images
└── vite.svg           # Static assets
```

### Deployment
- Static file hosting
- CDN integration
- Environment configuration
- SSL certificate

## 🔧 Development Tips

### Code Organization
- Component-based architecture
- Separation of concerns
- Reusable components
- Custom hooks

### Styling Guidelines
- Tailwind CSS classes
- Component-specific styles
- Responsive design
- Dark mode support (future)

### State Management
- Context API for global state
- Local state for component state
- Custom hooks for logic
- Error boundaries

### Performance
- Lazy loading
- Memoization
- Bundle optimization
- Image optimization

## 🐛 Debugging

### Common Issues
- CORS errors
- Authentication issues
- Socket connection problems
- Build errors

### Debug Tools
- Browser DevTools
- React DevTools
- Network tab
- Console logging

### Error Handling
- Error boundaries
- Try-catch blocks
- Fallback UI
- User-friendly error messages

## 📝 Notes

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features
- WebSocket support
- Local storage support

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### Future Enhancements
- Progressive Web App (PWA)
- Offline support
- Push notifications
- Advanced animations
- Dark mode
- Internationalization (i18n)
