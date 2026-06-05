# Visitor Management System

ระบบจัดการผู้เยี่ยมชมสำนักงาน พัฒนาเป็น Final Year Project

## Features
- ลงทะเบียนผู้เยี่ยมชมแบบ walk-in และล่วงหน้า
- ระบบ QR Code สำหรับควบคุมการเข้า-ออกพื้นที่
- จัดการบริษัท แผนก และผู้ติดต่อ
- ประวัติการเข้า-ออก
- ระบบ Role-based (Admin / Staff /CompanyAdmin)

## Tech Stack
**Frontend:** React, CSS
**Backend:** Node.js, Express.js
**Database:** Firebase Realtime Database
**Auth:** Firebase Authentication
**Hardware:** Arduino (QR Code Scanner)

## Getting Started

### Backend
```bash
cd server-Visitor-management
npm install
npm start
```

### Frontend
```bash
cd client-Visitor-management
npm install
npm start
```

## Architecture
Frontend (React) → Backend (Express API) → Firebase Database → Arduino Controller
