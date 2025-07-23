# KU SHEET (StudyHub)

A complete full-stack web application for university students to share and access study materials. Built with Node.js, Express.js, MySQL, React.js, and Tailwind CSS.

## 🌟 Features

### Core Functionality
- **Note Exchange System**: Students can upload and share study sheets (free or paid)
- **Admin Review**: All sheets are reviewed and approved before publication
- **Payment System**: Manual bank transfer with slip verification
- **User Management**: JWT-based authentication with Google OAuth support
- **Seller System**: Revenue tracking and seller profile management
- **Search & Filter**: Advanced filtering by faculty, term, year, subject, and keywords

### User Roles
- **Students**: Browse, purchase, and download study materials
- **Sellers**: Upload sheets, manage content, track revenue
- **Admins**: Review sheets, verify payments, manage platform

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT + Google OAuth 2.0
- **File Upload**: Multer with local storage
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Logging**: Winston + Morgan

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Context + useReducer
- **HTTP Client**: Axios with interceptors
- **Forms**: React Hook Form with validation
- **UI Components**: Headless UI + Heroicons
- **Notifications**: React Hot Toast
- **Data Fetching**: TanStack React Query

## 📁 Project Structure

```
ku-sheet-app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── sheetController.js
│   │   ├── sellerController.js
│   │   ├── orderController.js
│   │   ├── adminController.js
│   │   └── metadataController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Seller.js
│   │   ├── Faculty.js
│   │   ├── Subject.js
│   │   ├── Sheet.js
│   │   ├── Order.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── sheetRoutes.js
│   │   ├── sellerRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── adminRoutes.js
│   │   └── metadataRoutes.js
│   ├── seeds/
│   │   └── seed.js
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   ├── auth/
    │   │   ├── sheets/
    │   │   ├── seller/
    │   │   └── admin/
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   ├── pages/
    │   │   ├── auth/
    │   │   ├── sheets/
    │   │   ├── orders/
    │   │   ├── seller/
    │   │   └── admin/
    │   ├── services/
    │   │   └── api.js
    │   ├── utils/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL (v8.0+)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd ku-sheet-app/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configurations:
   ```env
   PORT=5000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=ku_sheet_db
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d
   
   ADMIN_EMAIL=admin@kusheet.com
   ADMIN_PASSWORD=admin123
   
   FRONTEND_URL=http://localhost:5173
   ```

4. **Create MySQL database**
   ```sql
   CREATE DATABASE ku_sheet_db;
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The backend will be available at http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ku-sheet-app/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Setup environment variables**
   ```bash
   # Create .env file
   echo "VITE_API_URL=http://localhost:5000/api" > .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout

### Sheets
- `GET /api/sheets` - Get all approved sheets
- `GET /api/sheets/:id` - Get sheet by ID
- `GET /api/sheets/featured` - Get featured sheets
- `GET /api/sheets/search` - Search sheets
- `GET /api/sheets/:id/download` - Download sheet (authenticated)

### Seller
- `POST /api/seller/register` - Register as seller
- `GET /api/seller/profile` - Get seller profile
- `PUT /api/seller/profile` - Update seller profile
- `POST /api/seller/sheets` - Create new sheet
- `GET /api/seller/sheets` - Get seller's sheets
- `PUT /api/seller/sheets/:id` - Update sheet
- `DELETE /api/seller/sheets/:id` - Delete sheet
- `GET /api/seller/revenue` - Get revenue history

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders/:id/payment-slip` - Upload payment slip
- `DELETE /api/orders/:id` - Cancel order

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/sheets/pending` - Pending sheets
- `PUT /api/admin/sheets/:id/approve` - Approve sheet
- `PUT /api/admin/sheets/:id/reject` - Reject sheet
- `GET /api/admin/orders/pending` - Pending orders
- `PUT /api/admin/orders/:id/verify` - Verify payment
- `PUT /api/admin/orders/:id/reject` - Reject payment

### Metadata
- `GET /api/metadata/faculties` - Get all faculties
- `GET /api/metadata/subjects` - Get subjects
- `GET /api/metadata/sheet-types` - Get sheet types
- `GET /api/metadata/terms` - Get terms
- `GET /api/metadata/years` - Get years

## 🔒 Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ku_sheet_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# File Upload Configuration
MAX_FILE_SIZE=157286400
UPLOAD_PATH=./uploads

# Admin Configuration
ADMIN_EMAIL=admin@kusheet.com
ADMIN_PASSWORD=admin123

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME="KU SHEET"
VITE_APP_VERSION="1.0.0"
```

## 🔧 Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

**Frontend:**
```bash
cd frontend
npm run dev  # Uses Vite dev server
```

### Database Management

**Seed database:**
```bash
cd backend
npm run seed
```

**Reset database:**
```bash
# Drop and recreate database, then seed
mysql -u root -p -e "DROP DATABASE IF EXISTS ku_sheet_db; CREATE DATABASE ku_sheet_db;"
npm run seed
```

### File Uploads

Files are stored locally in the `backend/uploads/` directory:
- `covers/` - Sheet cover images
- `previews/` - Sheet preview images
- `sheets/` - PDF files
- `slips/` - Payment slip images

## 🏗️ Database Schema

### Users Table
- Basic user information
- Authentication data
- Profile completion status
- Role management (user/admin)

### Sellers Table
- Seller-specific information
- Bank details for payments
- Revenue tracking
- Unique seller ID

### Faculties Table
- University faculties
- Faculty codes and names

### Subjects Table
- Course subjects
- Linked to faculties
- Subject codes and credits

### Sheets Table
- Study material metadata
- File paths and pricing
- Admin approval status
- Download statistics

### Orders Table
- Purchase transactions
- Payment verification status
- Order tracking numbers

## 🔐 Authentication & Authorization

### JWT Authentication
- Stateless authentication using JWT tokens
- Token expires in 7 days (configurable)
- Automatic token refresh on API calls

### Authorization Levels
1. **Public**: Homepage, sheet browsing, sheet details
2. **Authenticated**: Downloads, purchases, profile management
3. **Seller**: Sheet uploads, seller dashboard, revenue tracking
4. **Admin**: Platform management, approvals, user management

### Google OAuth Integration
- Optional Google login/registration
- Secure OAuth 2.0 flow
- Automatic account linking

## 📱 Features by Page

### Home Page (/)
- Hero section with search
- Featured sheets carousel
- Faculty selector
- Feature highlights

### Shop Page (/shop)
- Advanced filtering sidebar
- Grid/list view toggle
- Pagination
- Search functionality

### Sheet Detail (/infoSheet/:id)
- Complete sheet information
- Preview images
- Purchase/download options
- Seller information

### Seller Dashboard (/seller/mysheet)
- Sheet management
- Revenue overview
- Performance analytics
- Quick actions

### Admin Dashboard (/admin/dashboard)
- Platform statistics
- Pending approvals
- User management
- Revenue overview

## 🚀 Deployment

### Production Environment Variables

Update your `.env` files for production:

**Backend:**
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production database
- Set production `FRONTEND_URL`

**Frontend:**
- Update `VITE_API_URL` to production API URL

### Build Commands

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team**: KU SHEET Team
- **Contact**: support@kusheet.com

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **CORS Errors**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check API URL in frontend `.env`

3. **File Upload Issues**
   - Check `uploads/` directory permissions
   - Verify `MAX_FILE_SIZE` setting
   - Ensure disk space available

4. **Authentication Issues**
   - Verify `JWT_SECRET` is set
   - Check token expiration
   - Clear browser storage

### Support

For technical support or questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Happy Studying! 📚✨**