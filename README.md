# Visitor Management System

ระบบควบคุมการเข้า-ออกอาคารสำนักงาน สำหรับอาคารที่มีหลายชั้นและหลายบริษัท พัฒนาเป็น Final Year Project

## Features

### QR Code Access Control
- **ผู้มาติดต่อ** — QR Code แบบ One-time use เข้าได้ครั้งเดียวแล้วหมดอายุทันที
- **พนักงาน** — QR Code แบบมี Time limit ใช้ได้ตามเวลาที่กำหนดและเข้าได้เฉพาะชั้นที่บริษัทอยู่
- **Admin/Staff** — QR Code แบบมี No limit ใช้ได้ตลอดเข้าได้ทุกชั้น
### การจัดการระบบ
- ลงทะเบียนผู้มาติดต่อแบบ walk-in และล่วงหน้า
- กำหนดสิทธิ์เข้าถึงตามชั้นและบริษัทที่ระบุใน QR เท่านั้น
- ออกใบอนุญาตเข้าพื้นที่แบบ QR Code (One-time use)
- จัดการบริษัท แผนก และผู้ติดต่อแยกตามชั้น
- ประวัติการติดต่อและการเข้า-ออกอาคาร
- ระบบ Role-based (Admin / Staff / CompanyAdmin)

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
