# 📸 คู่มือการอัพโหลดและใช้รูปภาพในบล็อก

## 🎯 สิ่งที่ได้อัพเดต

### 1. ระบบอัพโหลดรูปภาพ
- เชื่อมต่อกับ **Cloudinary** สำหรับเก็บรูปภาพ
- อัพโหลดได้ทั้ง Cover Image และรูปในเนื้อหา
- รูปจะถูกปรับขนาดและเพิ่มประสิทธิภาพอัตโนมัติ

### 2. รองรับ Markdown
- แสดงเนื้อหาแบบ Markdown เต็มรูปแบบ
- รองรับรูปภาพ, ลิงก์, หัวข้อ, ตัวหนา/เอียง
- แสดงโค้ดและตารางได้

---

## 🚀 วิธีใช้งาน

### ขั้นตอนที่ 1: ตั้งค่า API Secret
1. เปิดไฟล์ `.env.local`
2. แก้ไขบรรทัด:
   ```
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```
3. ไปที่ [Cloudinary Dashboard](https://console.cloudinary.com/)
4. คลิก "View API Keys"
5. คัดลอก "API Secret" มาใส่แทน `your_api_secret_here`

### ขั้นตอนที่ 2: ติดตั้ง Dependencies
รันคำสั่ง (ถ้ายังไม่ได้ติดตั้ง):
```bash
npm install cloudinary react-markdown remark-gfm rehype-raw
```

### ขั้นตอนที่ 3: เริ่มใช้งาน
รันเซิร์ฟเวอร์:
```bash
npm run dev
```

---

## 📝 วิธีสร้างโพสต์พร้อมรูปภาพ

### 1. อัพโหลด Cover Image (รูปปก)
1. ไปที่หน้า New Post หรือ Edit Post
2. ในช่อง "Cover Image URL" คลิกปุ่ม **"Upload Cover Image"**
3. เลือกไฟล์รูปจากคอมพิวเตอร์
4. รอสักครู่ รูปจะอัพโหลดและลิงก์จะปรากฏอัตโนมัติ

### 2. แทรกรูปในเนื้อหา
**วิธีที่ 1: อัพโหลดผ่านปุ่ม**
1. ในช่อง "Content" คลิกปุ่ม **"Insert Image to Content"**
2. เลือกไฟล์รูป
3. โค้ด Markdown จะถูกเพิ่มเข้าไปอัตโนมัติ: `![Image](url)`

**วิธีที่ 2: พิมพ์ Markdown เอง**
```markdown
![คำอธิบายรูป](https://your-image-url.com/image.jpg)
```

---

## 🎨 ตัวอย่าง Markdown ที่รองรับ

### หัวข้อ
```markdown
# หัวข้อใหญ่
## หัวข้อรอง
### หัวข้อย่อย
```

### ข้อความ
```markdown
**ตัวหนา**
*ตัวเอียง*
~~ขีดฆ่า~~
`โค้ดตัวเดียว`
```

### รูปภาพ
```markdown
![ชื่อรูป](https://example.com/image.jpg)
```

### ลิงก์
```markdown
[ข้อความลิงก์](https://example.com)
```

### รายการ
```markdown
- รายการที่ 1
- รายการที่ 2
  - รายการย่อย

1. รายการแบบตัวเลข
2. รายการที่ 2
```

### โค้ดบล็อก
\`\`\`javascript
function hello() {
  console.log("Hello World!");
}
\`\`\`

### อ้างอิง
```markdown
> ข้อความที่ต้องการอ้างอิง
```

---

## ⚠️ ข้อควรระวัง

1. **ลิงก์จาก Google Images ใช้ไม่ได้**
   - Google บล็อกการแสดงรูปในเว็บอื่น
   - ให้ใช้ปุ่มอัพโหลดแทนครับ

2. **ขนาดไฟล์**
   - แนะนำไม่เกิน 5 MB ต่อรูป
   - ระบบจะปรับขนาดอัตโนมัติเป็น 1200x1200 px

3. **ไฟล์ที่รองรับ**
   - JPG, PNG, GIF, WebP
   - SVG (บางกรณี)

---

## 🔧 API Endpoints ที่ถูกสร้าง

### POST `/api/blog/upload-image`
อัพโหลดรูปภาพไป Cloudinary

**Request:**
```javascript
const formData = new FormData();
formData.append('file', fileObject);

fetch('/api/blog/upload-image', {
  method: 'POST',
  body: formData
})
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "blog-posts/xxx",
  "width": 1200,
  "height": 800
}
```

---

## 📂 ไฟล์ที่ถูกสร้าง/แก้ไข

### ไฟล์ใหม่
- `lib/cloudinary.ts` - Cloudinary configuration
- `app/api/blog/upload-image/route.ts` - API สำหรับอัพโหลด
- `IMAGE_UPLOAD_GUIDE.md` - คู่มือนี้

### ไฟล์ที่แก้ไข
- `app/admin/new/page.tsx` - เพิ่มปุ่มอัพโหลด
- `app/admin/edit/[id]/page.tsx` - เพิ่มปุ่มอัพโหลด
- `app/blog/[slug]/page.tsx` - รองรับ Markdown
- `.env.local` - เพิ่ม Cloudinary config

---

## 🎉 ตัวอย่างการใช้งาน

```markdown
# My Amazing Post

นี่คือเนื้อหาของโพสต์

![Beautiful Scene](uploaded-url)

เนื้อหาต่อไปนี้จะเป็นการอธิบายรูปภาพข้างบน

## หัวข้อย่อย

- รายการที่ 1
- รายการที่ 2

**ข้อความสำคัญ** และ *ข้อความเสริม*

[ดูเพิ่มเติม](https://example.com)
```

---

## 🆘 แก้ปัญหา

**Q: รูปไม่แสดง**
- ตรวจสอบว่าตั้งค่า `CLOUDINARY_API_SECRET` ใน `.env.local` แล้ว
- ลองรีสตาร์ทเซิร์ฟเวอร์ (`npm run dev`)

**Q: อัพโหลดช้า**
- ขนาดไฟล์ใหญ่เกินไป ลองลดขนาดก่อนอัพโหลด
- เช็คการเชื่อมต่ออินเทอร์เน็ต

**Q: Markdown ไม่แสดงถูกต้อง**
- ตรวจสอบว่าติดตั้ง `react-markdown` เรียบร้อยแล้ว
- ตรวจสอบรูปแบบ Markdown syntax

---

🎊 เรียบร้อย! ตอนนี้คุณสามารถสร้างบล็อกโพสต์พร้อมรูปภาพสวยงามได้แล้ว
