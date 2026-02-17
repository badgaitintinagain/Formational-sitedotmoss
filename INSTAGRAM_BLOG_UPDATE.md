# 🎉 Instagram-Style Blog Modal - อัพเดตสำเร็จ!

## ✨ ฟีเจอร์ใหม่ที่เพิ่มเข้ามา

### 1. 📸 Blog Modal แบบ Instagram
- **คลิกที่รูปในหน้า Blog** จะเปิด Modal แบบ IG สวยงาม
- แสดงรูปด้านซ้าย, เนื้อหาและคอมเมนท์ด้านขวา
- รองรับ Markdown เต็มรูปแบบ
- ปิด Modal ด้วยปุ่ม X หรือคลิกนอก Modal

### 2. ❤️ ระบบ Like โพสต์
- **กดไลค์ได้ทันที** โดยไม่ต้องล็อกอิน
- แสดงจำนวนไลค์แบบ Real-time
- หัวใจจะเปลี่ยนสีแดงเมื่อไลค์แล้ว
- แต่ละคนไลค์ได้แค่ครั้งเดียวต่อโพสต์
- จำนวนไลค์แสดงที่ Grid view (hover เพื่อดู)

### 3. 💬 ระบบคอมเมนท์ปรับปรุงใหม่
- **Auto-Approve** - คอมเมนท์แสดงทันทีไม่ต้องรออนุมัติ
- **ตอบกลับคอมเมนท์ได้** - มีปุ่ม Reply ให้คลิก
- **Admin ลบคอมเมนท์ได้** - มีปุ่ม 🗑️ สำหรับ Admin
- แสดงโครงสร้างแบบ Nested (คอมเมนท์หลัก + ตอบกลับ)
- แสดงจำนวนคอมเมนท์ที่ Grid view (hover เพื่อดู)

### 4. 🎨 UI/UX แบบ Instagram
- Grid view แบบ 3 คอลัมน์สี่เหลี่ยมจัตุรัส
- Hover แสดงจำนวน likes และ comments
- Modal เต็มจอ responsive ทั้ง mobile และ desktop
- Animation และ transition ลื่นไหล

---

## 🗄️ อัพเดตฐานข้อมูล

### ขั้นตอนที่ 1: เพิ่มตาราง `post_likes`

เข้าไปที่ [Turso Dashboard](https://turso.tech) แล้วรันคำสั่ง SQL ต่อไปนี้:

```sql
-- สร้างตาราง post_likes
CREATE TABLE IF NOT EXISTS post_likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id, post_id);
```

### ขั้นตอนที่ 2: อัพเดตตาราง `comments`

```sql
-- อัพเดต default status เป็น 'approved'
-- (สำหรับคอมเมนท์ใหม่จะ auto-approve)
-- คอมเมนท์เก่าที่ pending อยู่ให้รันคำสั่งนี้:

UPDATE comments SET status = 'approved' WHERE status = 'pending';
```

### ขั้นตอนที่ 3 (Optional): ตรวจสอบข้อมูล

```sql
-- ดูตาราง post_likes
SELECT * FROM post_likes LIMIT 10;

-- ดูสถานะคอมเมนท์ทั้งหมด
SELECT status, COUNT(*) as count FROM comments GROUP BY status;
```

---

## 📂 ไฟล์ที่ถูกสร้าง/แก้ไข

### ไฟล์ใหม่
- `components/BlogModal.tsx` - Modal component แบบ Instagram
- `app/api/blog/posts/[id]/like/route.ts` - API สำหรับไลค์/unlikeโพสต์

### ไฟล์ที่แก้ไข
- `lib/db/schema.ts` - เพิ่ม postLikes table และ export types
- `lib/db/schema.sql` - เพิ่ม SQL schema สำหรับ post_likes
- `app/api/blog/posts/route.ts` - เพิ่ม likes และ comments count
- `app/api/blog/comments/route.ts` - เปลี่ยนเป็น auto-approve และรองรับ parentId
- `app/blog/page.tsx` - ใช้ Modal แทนการ navigate, แสดง likes/comments count
- `components/index.ts` - export BlogModal

---

## 🎮 วิธีใช้งาน

### สำหรับผู้เข้าชม (Visitors)

1. **เปิดหน้า Blog** - ไปที่ `/blog`
2. **คลิกที่รูปโพสต์** - Modal จะเปิดขึ้นมา
3. **อ่านเนื้อหา** - Scroll ดูเนื้อหาและคอมเมนท์
4. **กดไลค์** - คลิกที่หัวใจ ❤️
5. **คอมเมนท์** - กรอกชื่อ, อีเมล, และความคิดเห็น
6. **ตอบกลับคอมเมนท์** - คลิกปุ่ม "Reply" ใต้คอมเมนท์
7. **ปิด Modal** - คลิกปุ่ม X หรือคลิกนอก Modal

### สำหรับ Admin

1. **ล็อกอินเข้าระบบ** - ไปที่ `/api/auth/login`
2. **เปิดโพสต์** - เข้าไปดูโพสต์ใดก็ได้
3. **ลบคอมเมนท์** - คลิกไอคอน 🗑️ (Trash) ข้างคอมเมนท์
4. **ยืนยันการลบ** - กด OK ในกล่องยืนยัน

---

## 🔧 Technical Details

### API Endpoints

#### POST/DELETE `/api/blog/posts/[id]/like`
ไลค์หรือ unlike โพสต์

**Request Body:**
```json
{
  "userId": "uuid-string"
}
```

**Response:**
```json
{
  "success": true,
  "likesCount": 5,
  "isLiked": true
}
```

#### GET `/api/blog/posts/[id]/like?userId=xxx`
ดูสถานะการไลค์และจำนวน

**Response:**
```json
{
  "likesCount": 5,
  "isLiked": true
}
```

### User ID Management

ระบบจะสร้าง `userId` แบบ UUID และเก็บไว้ใน `localStorage` เพื่อ:
- จำกัดให้แต่ละคนไลค์ได้ครั้งเดียว
- ติดตามว่าใครไลค์โพสต์ไหนบ้าง

```javascript
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem('userId', userId);
}
```

### Comment Structure

คอมเมนท์มี 2 ระดับ:
- **Top-level comments**: `parentId` เป็น `null`
- **Nested replies**: `parentId` ชี้ไปที่คอมเมนท์หลัก

```typescript
interface Comment {
  id: string;
  authorName: string;
  content: string;
  parentId: string | null; // null = top-level, มีค่า = reply
  status: 'approved';
  createdAt: Date;
}
```

---

## 🎨 Styling & Design

### Color Palette (ตาม theme)
- **Primary Accent**: `accent-primary` - สำหรับปุ่มและ highlights
- **Foreground**: `foreground` - ข้อความหลัก
- **Background**: `background` - พื้นหลัง
- **Borders**: `foreground/10` - เส้นขอบบางๆ

### Responsive Breakpoints
- **Mobile**: < 768px - Stack รูปและเนื้อหาแนวตั้ง
- **Desktop**: ≥ 768px - แบ่งครึ่งหน้าจอ (รูป 3/5, เนื้อหา 2/5)

### Animations
- Modal fade in/out: `0.2s ease-in-out`
- Like button: `fill` animation
- Hover overlay: `0.2s transition-all`

---

## ⚠️ หมายเหตุสำคัญ

### 1. ต้องอัพเดตฐานข้อมูลก่อนใช้งาน
หากไม่สร้างตาราง `post_likes` จะเกิด error เมื่อพยายามไลค์โพสต์

### 2. Rate Limiting
คอมเมนท์ยังมี rate limit 3 ครั้งต่อนาที ต่อ IP

### 3. Admin Authentication
ต้องล็อกอินด้วย role `admin` ถึงจะเห็นปุ่มลบคอมเมนท์

### 4. Browser Storage
ระบบใช้ `localStorage` เก็บ `userId` - จะหายถ้าล้าง browser data

---

## 🐛 แก้ปัญหา

**Q: Modal ไม่เปิด**
- ตรวจสอบว่า import BlogModal ถูกต้อง
- เช็ค console log มี error หรือไม่

**Q: ไลค์ไม่ขึ้น**
- อัพเดตฐานข้อมูล `post_likes` table แล้วหรือยัง
- ตรวจสอบ localStorage มี userId หรือไม่

**Q: คอมเมนท์ไม่แสดง**
- ตรวจสอบใน database ว่า `status = 'approved'`
- รัน SQL: `UPDATE comments SET status = 'approved'`

**Q: Admin ลบคอมเมนท์ไม่ได้**
- ตรวจสอบว่าล็อกอินด้วย account ที่มี `role = 'admin'`
- เช็คว่า API `/api/auth/me` return ข้อมูล user ถูกต้อง

---

## 🚀 Next Steps (Optional)

### เพิ่มฟีเจอร์เพิ่มเติม:
1. **Share โพสต์** - ปุ่ม share ผ่าน social media
2. **Save/Bookmark** - เก็บโพสต์ไว้อ่านทีหลัง
3. **View Count** - นับจำนวนการดูโพสต์
4. **Like Animation** - animation หัวใจเด้งเมื่อกดไลค์
5. **Emoji Reactions** - รองรับหลาย reactions (❤️ 🔥 👏)
6. **Load More Comments** - pagination สำหรับคอมเมนท์เยอะๆ
7. **Edit Comment** - แก้ไขคอมเมนท์ของตัวเอง
8. **Report Comment** - รายงานคอมเมนท์ไม่เหมาะสม

---

🎊 **เรียบร้อย! ตอนนี้บล็อกของคุณมี UI/UX แบบ Instagram พร้อมระบบ social features ครบครันแล้ว**
