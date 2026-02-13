# Blog System Setup Guide

## 🎉 ระบบที่เพิ่มเข้ามา

1. **BlogTile Component** - ไทล์แสดงบล็อกล่าสุดใน dashboard
2. **Turso Database** - SQLite database บน edge
3. **Drizzle ORM** - Type-safe database queries
4. **✨ Authentication System** - ระบบ login สำหรับ admin พร้อม Profile Button
5. **Comments System** - Schema พร้อมสำหรับระบบคอมเมนท์

## 🔐 Authentication Features

### Profile Button
- แสดงข้างๆ header "site(.)moss" 
- คลิกเพื่อ login/logout
- แสดงข้อมูล user เมื่อ login แล้ว
- มี badge "Admin" สำหรับ admin users
- Auto-check session เมื่อโหลดหน้า

### API Routes
- `/api/auth/login` - Login endpoint
- `/api/auth/logout` - Logout endpoint  
- `/api/auth/me` - Get current user session
- Protected routes ด้วย `withAuth` middleware

## 📝 Setup Instructions

### 1. ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env.local` ที่สร้างให้แล้ว:

```bash
# Turso Database
TURSO_DATABASE_URL=libsql://sitedotmoss-badgaitintinagain.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=<your-auth-token-from-turso>

# Admin Authentication
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
```

### 2. รับ Turso Auth Token

```bash
# Install Turso CLI (ถ้ายังไม่มี)
npm install -g @turso/cli

# Login
turso auth login

# Get database token
turso db tokens create sitedotmoss-badgaitintinagain
```

คัดลอก token ที่ได้ใส่ใน `.env.local`

### 3. สร้าง Database Schema และ Admin User

```bash
npm run db:setup
```

คำสั่งนี้จะ:
- สร้างตาราง users, posts, comments, reactions
- สร้าง admin user ตาม ADMIN_EMAIL และ ADMIN_PASSWORD
- สร้างบล็อกโพสต์ตัวอย่าง

### 4. ทดสอบระบบ

```bash
npm run dev
```

เปิด http://localhost:3000:
1. **คลิกที่ Profile Button** ข้างๆ "site(.)moss" 
2. เลือก **"Admin Login"**
3. Login ด้วย:
   - Email: `admin@sitedotmoss.com`
   - Password: `changeme123`
4. คลิก **Blog Tile** ใน "Work & Focus" section

เมื่อ login สำเร็จ Profile Button จะแสดง:
- รูปโปรไฟล์/ไอคอน user
- ชื่อ admin
- Badge "Admin"
- เมนู dropdown พร้อม Admin Panel และ Logout

## 🗂️ Database Schema

### Posts Table
```sql
- id: TEXT (primary key)
- title: TEXT
- slug: TEXT (unique)
- excerpt: TEXT
- content: TEXT (markdown)
- cover_image: TEXT (URL)
- author_id: TEXT
- author_name: TEXT
- tags: TEXT (JSON array)
- published: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Comments Table
```sql
- id: TEXT (primary key)
- post_slug: TEXT
- author_name: TEXT
- author_email: TEXT
- author_avatar: TEXT
- content: TEXT
- parent_id: TEXT (for nested comments)
- status: TEXT (pending/approved/spam)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🚀 Next Steps

### 1. สร้างหน้า Blog แบบเต็ม
```bash
# สร้างไฟล์ app/blog/page.tsx
# สร้างไฟล์ app/blog/[slug]/page.tsx สำหรับแต่ละโพสต์
```

### 2. เพิ่มระบบ Admin Panel
```bash
# สร้างไฟล์ app/admin/page.tsx
# สร้าง API routes สำหรับ CRUD posts
```

### 3. เพิ่มระบบ Comments
```bash
# สร้าง CommentSection component
# สร้าง API routes สำหรับ comments
```

### 4. เพิ่ม Authentication (Production)
แนะนำให้ใช้:
- **Clerk** - https://clerk.com (ง่ายที่สุด)
- **NextAuth.js** - https://next-auth.js.org (ฟรี, flexible)
- **Supabase Auth** - https://supabase.com/auth

## 📚 API Routes ที่มีแล้ว

### Authentication

#### POST `/api/auth/login`
Login สำหรับ admin

Request body:
```json
{
  "email": "admin@sitedotmoss.com",
  "password": "changeme123"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "admin-xxx",
    "email": "admin@sitedotmoss.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

#### POST `/api/auth/logout`
Logout และ clear session

#### GET `/api/auth/me`
ดึงข้อมูล user ที่ login อยู่

### Blog Posts

#### GET `/api/blog/posts`
ดึงบล็อกโพสต์ที่เผยแพร่แล้ว

Query params:
- `limit` - จำนวนโพสต์ (default: 10)

Response:
```json
{
  "posts": [...],
  "total": 10
}
```

#### POST `/api/blog/create` 🔒 Admin only
สร้างบล็อกโพสต์ใหม่ (ต้อง login เป็น admin)

Request body:
```json
{
  "title": "Post Title",
  "content": "Post content in markdown",
  "excerpt": "Short description",
  "coverImage": "https://...",
  "tags": ["tag1", "tag2"],
  "published": true
}
```

## 🔒 Protected Routes

ใช้ `withAuth` middleware เพื่อป้องกัน routes:

```typescript
import { withAuth } from '@/lib/middleware/auth';

async function handler(request: NextRequest, user: any) {
  // user object มีข้อมูล authenticated user
  console.log(user.id, user.email, user.role);
  // ... your logic
}

// Require any authenticated user
export const POST = withAuth(handler);

// Require admin role
export const POST = withAuth(handler, true);
```

## ️ Drizzle Studio

ดู/แก้ไขข้อมูลในฐานข้อมูล:

```bash
npm run db:studio
```

เปิด browser ไปที่ URL ที่แสดง (โดยปกติ https://local.drizzle.studio)

## ⚠️ Security Notes

**สำคัญมาก!**

1. ⚠️ ระบบ authentication ตอนนี้เป็นแค่ demo - ใช้ base64 hash
   - Production ต้องเปลี่ยนเป็น **bcrypt** หรือ **argon2**
   - หรือใช้ authentication service เช่น Clerk

2. 🔒 ตั้งค่า CORS และ rate limiting สำหรับ API routes

3. 🔐 เพิ่ม CAPTCHA สำหรับ comment form

4. 📝 Sanitize HTML content ใน comments

## 💡 Tips

- ใช้ Markdown editor เช่น **react-markdown** หรือ **MDXEditor**
- เพิ่ม image upload กับ **Cloudinary** หรือ **Vercel Blob**
- ใช้ **React Hook Form** + **Zod** สำหรับ validation
- เพิ่ม SEO metadata ด้วย `generateMetadata()` ใน layout/page

---

สร้างโดย GitHub Copilot 🤖
