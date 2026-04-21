# Museum Audio Guide 🏛️🎧

ระบบเว็บแอปพลิเคชันนำชมพิพิธภัณฑ์ด้วยเสียง (Audio Guide) ผ่านการสแกน QR Code เพื่อเพิ่มประสบการณ์การเรียนรู้ที่ทันสมัยและสะดวกสบายให้กับผู้เข้าชม

> พัฒนาขึ้นเพื่อใช้งานจริง ณ **พิพิธภัณฑสถานธรรมชาติวิทยา 50 พรรษา สยามบรมราชกุมารี** ในช่วงฝึกงาน

---

## 🌟 จุดเด่นของโปรเจกต์

- **Responsive Design** — รองรับการใช้งานบนสมาร์ทโฟนและแท็บเล็ต เหมาะสำหรับผู้เข้าชมที่ใช้มือถือสแกน QR Code
- **Dynamic Content** — ข้อมูลวัตถุจัดแสดงและไฟล์เสียงบรรยายดึงมาจากฐานข้อมูล ไม่ต้อง hard-code
- **Admin Dashboard** — ระบบหลังบ้านสำหรับจัดการ (CRUD) ข้อมูลวัตถุจัดแสดง รูปภาพ และไฟล์เสียง
- **Audio Playlist** — ระบบเล่นเสียงพร้อมฟีเจอร์กดหมายเลขเพื่อข้ามไปยังวัตถุที่ต้องการได้โดยตรง
- **Secure Authentication** — ระบบล็อกอินด้วย session และ password hashing (bcrypt) สำหรับผู้ดูแลระบบ

---

## 🚀 เทคโนโลยีที่ใช้

| ฝั่ง | เทคโนโลยี |
|------|-----------|
| Front-end | HTML5, CSS3, JavaScript (Vanilla JS & jQuery) |
| Back-end | PHP (Native) |
| Database | MySQL / MariaDB |
| Tools | XAMPP, Git |

---

## 📂 โครงสร้างโปรเจกต์

```
Museum-Audio-Guide/
├── admin/              # หน้าจอ Admin Dashboard (Login, CRUD)
├── api/                # PHP Backend — รับ-ส่งข้อมูล (REST-like API)
├── js/                 # JavaScript สำหรับ Audio Player และ UI
├── images/             # รูปภาพวัตถุจัดแสดง (แยกโฟลเดอร์ตามหมายเลข)
├── music/              # ไฟล์เสียงบรรยาย .mp3 (แยกโฟลเดอร์ตามหมายเลข)
├── index.html          # หน้าหลัก Audio Guide สำหรับผู้เข้าชม
├── sound_tour.sql      # Database Schema + ข้อมูลตัวอย่าง
└── server_mysql.php    # Database connection (ไม่อยู่ใน Git)
```

---

## 🗄️ Database Schema

ฐานข้อมูลชื่อ `sound_tour` ประกอบด้วย 2 ตาราง:

**`music`** — เก็บข้อมูลวัตถุจัดแสดงและไฟล์มัลติมีเดีย

| Column | Type | Description |
|--------|------|-------------|
| music_id | INT (PK) | รหัสอัตโนมัติ |
| music_number | INT | หมายเลขวัตถุ (ใช้กดค้นหาบนหน้าจอ) |
| music_name | VARCHAR | ชื่อวัตถุจัดแสดง |
| music_audio | VARCHAR | ชื่อไฟล์เสียง .mp3 |
| music_img | VARCHAR | ชื่อไฟล์รูปภาพ |

**`users_admin`** — เก็บข้อมูลผู้ดูแลระบบ (password เก็บแบบ bcrypt hash)

---

## 🛠️ วิธีติดตั้งและรันโปรเจกต์

**ความต้องการของระบบ:** XAMPP (PHP 8.0+, MariaDB 10.4+)

**1. Clone โปรเจกต์**
```bash
git clone https://github.com/YOUR_USERNAME/Museum-Audio-Guide.git
```

**2. วางโฟลเดอร์ใน htdocs**
```
C:/xampp/htdocs/PROJECT/
```

**3. Import ฐานข้อมูล**
- เปิด phpMyAdmin แล้วสร้างฐานข้อมูลชื่อ `sound_tour`
- Import ไฟล์ `sound_tour.sql`

**4. ตั้งค่าการเชื่อมต่อฐานข้อมูล**
- คัดลอก `server_mysql.example.php` → เปลี่ยนชื่อเป็น `server_mysql.php`
- แก้ไขค่า Host, Username, Password ให้ตรงกับเครื่องของคุณ

**5. เปิดเบราว์เซอร์**
```
http://localhost/PROJECT/index.html
```

---

## 🔑 การเข้าใช้งาน Admin

```
URL: http://localhost/PROJECT/admin/admin.html
```
- Username: `admin`
- Password: `admin123`
  
> ⚠️ Credentials นี้สำหรับ local development เท่านั้น  
> หากนำไปใช้งานจริงให้เปลี่ยน password ทันที

---

## ⚠️ Known Limitations

สิ่งที่รับรู้และจะปรับปรุงหากพัฒนาต่อ:

- **ไม่มี input validation สำหรับ file upload** — ควรตรวจสอบ MIME type และขนาดไฟล์ฝั่ง server
- **ชื่อไฟล์ภาษาไทย** — ไฟล์มัลติมีเดียบางส่วนใช้ภาษาไทยตามข้อกำหนดเดิมขององค์กร เพื่อให้สอดคล้องกับฐานข้อมูลที่มีอยู่

---

## 💡 สิ่งที่จะพัฒนาต่อ

- [ ] รองรับหลายภาษา (ไทย / อังกฤษ)
- [ ] เพิ่มระบบ Zone/Category สำหรับจัดกลุ่มวัตถุจัดแสดง
- [ ] ย้าย API ไปใช้ framework เช่น Laravel หรือ Slim สำหรับ scalability

---

## 📝 หมายเหตุ

- โปรเจกต์ใช้ `.gitignore` เพื่อป้องกันไม่ให้ไฟล์ `server_mysql.php` และ `.env` ที่มีข้อมูลจริงถูก commit ขึ้น repository

## 📸 Screenshots
![หน้าหลัก]
<img width="2551" height="1184" alt="image" src="https://github.com/user-attachments/assets/737eedd7-010d-4317-b714-76b21d01861e" />
![Admin Dashboard]
<img width="2559" height="1184" alt="image" src="https://github.com/user-attachments/assets/47404b52-0846-4a6b-9892-38a9562aba37" />

