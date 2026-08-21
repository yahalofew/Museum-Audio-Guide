# Museum Audio Guide

เว็บแอปพลิเคชันเสียงบรรยายสำหรับพิพิธภัณฑ์ ผู้เข้าชมสามารถเลือกหมายเลขวัตถุจัดแสดงจาก keypad หรือเปิดลิงก์จาก QR code เพื่อเข้าสู่รายการที่ต้องการโดยตรง ส่วนผู้ดูแลระบบสามารถจัดการข้อมูล รูปภาพ และไฟล์เสียงผ่านหน้า Admin

โปรเจกต์ใช้สถาปัตยกรรมเดิมแบบ HTML/CSS/JavaScript, procedural PHP, MySQL/MariaDB และ filesystem media เหมาะสำหรับติดตั้งแบบ same-origin บน XAMPP โดยไม่ต้องมี build step

## Features

### Visitor

- Audio player พร้อม play/pause, previous/next, progress seek และ keyboard controls
- Keypad สำหรับเลือก `music_number` โดยตรง
- QR deep-link ผ่าน `index.html?music_number=...`
- Loading, empty, invalid-data, missing-media และ playback-error states
- Responsive layout สำหรับ desktop และ mobile
- Accessible labels, focus states, touch targets และ reduced-motion support

### Admin

- Session-based login และ logout
- เพิ่ม แก้ไข ลบ และดูรายการเสียงบรรยาย
- เพิ่มผู้ดูแลระบบพร้อม password hashing
- ตรวจหมายเลขเสียงซ้ำทั้ง create/edit
- ตรวจสถานะไฟล์เสียงและรูปภาพที่อ้างอิงจากฐานข้อมูล
- Preview รูปภาพและไฟล์เสียงก่อน upload
- Inline validation, submitting state, double-submit protection และ unsaved-changes warning
- Responsive navigation และ form layout

## QR Deep Link

นำ URL ของรายการไปสร้าง QR code ด้วยเครื่องมือที่ต้องการ เช่น:

```text
http://localhost/Museum-Audio-Guide/index.html?music_number=10
```

เมื่อ `music_number` เป็นจำนวนเต็มบวกและมีรายการอยู่ ระบบจะโหลดรายการนั้นโดยอัตโนมัติโดยไม่บังคับ autoplay หากหมายเลขไม่พบหรือรูปแบบไม่ถูกต้อง ระบบจะแสดงข้อความผิดพลาดและยังเปิดให้ใช้ keypad เลือกรายการใหม่ได้ หน้า Visitor ที่ไม่มี query string ยังคงโหลดรายการแรกตามปกติ

## Technology

- Frontend: HTML5, CSS3, Vanilla JavaScript และ jQuery
- Backend: Native PHP แบบ procedural
- Database: MySQL/MariaDB ผ่าน MySQLi prepared statements
- Media storage: โฟลเดอร์ `images/<music_number>/` และ `music/<music_number>/`
- Runtime: Apache/PHP บน XAMPP

## Architecture

```text
Museum-Audio-Guide/
├── admin/                 # Login, audio CRUD, admin management และ shared UI helpers
├── api/                   # PHP endpoints, auth, validation และ integrity helpers
├── database/migrations/   # Database migrations สำหรับฐานข้อมูลเดิม
├── images/                # รูปภาพ แยกตาม music_number
├── js/                    # Visitor data loading และ audio player
├── music/                 # ไฟล์เสียง แยกตาม music_number
├── index.html             # Visitor Audio Player
├── sound_tour.sql         # Schema และข้อมูลเริ่มต้น
├── server_mysql.example.php
└── style.css
```

Visitor เรียก public read endpoints ภายใต้ `api/` แบบ same-origin ส่วน endpoint ที่เปลี่ยนข้อมูลหรือจัดการผู้ดูแลจะตรวจ PHP session ผ่าน shared auth helper ก่อนทำงาน การเพิ่ม แก้ไข และลบ media ใช้ database transaction ร่วมกับ rollback/cleanup ฝั่ง filesystem เพื่อลดความไม่สอดคล้องระหว่างข้อมูลกับไฟล์

## Data Model

ฐานข้อมูลเริ่มต้นชื่อ `sound_tour` มีตารางหลักสองตาราง:

- `music`: `music_id`, `music_number`, `music_name`, `music_audio`, `music_img`
- `users_admin`: `id`, `username`, `password`

`music_number` มี UNIQUE constraint และเป็นชื่อโฟลเดอร์ของ media แต่ละรายการ รหัสผ่านผู้ดูแลเก็บด้วย `password_hash()` และตรวจด้วย `password_verify()`

หากอัปเกรดฐานข้อมูลเก่าที่ไม่มี UNIQUE constraint ให้ตรวจ duplicate ก่อน แล้วจึงใช้ migration ใน `database/migrations/20260821_add_unique_music_number.sql` ฐานข้อมูลที่ import ใหม่จาก `sound_tour.sql` มี constraint นี้อยู่แล้ว

## Security

- Protected write endpoints ใช้ shared PHP session authentication
- Login regenerate session ID; cookie ใช้ `HttpOnly`, `SameSite=Lax` และ `Secure` เมื่อทำงานผ่าน HTTPS
- Logout ล้าง session data, session cookie และทำลาย session
- SQL ที่รับ input ใช้ prepared statements
- Upload ตรวจ upload error, MIME type, extension, file size และสร้าง filename ที่ปลอดภัย
- Audio รองรับ MP3, WAV, OGG, M4A, AAC และ FLAC ขนาดสูงสุด 30 MB
- Image รองรับ JPG/JPEG, PNG, GIF และ WebP ขนาดสูงสุด 10 MB
- Media path จำกัดให้อยู่ภายใน `images/` และ `music/` พร้อมป้องกัน path traversal และ symbolic-link escape
- API ใช้ same-origin และไม่เปิด wildcard CORS
- API read responses ระบุ missing media เพื่อให้ Visitor/Admin จัดการได้อย่างปลอดภัย

มาตรการเหล่านี้เป็น defense in depth สำหรับแอปพลิเคชันปัจจุบัน การนำขึ้น production ควรใช้ HTTPS, จำกัดสิทธิ์ filesystem, ปิด display errors และไม่เปิด utility สำหรับ bootstrap ผู้ดูแลให้เข้าถึงจากภายนอก

## Setup

### Requirements

- XAMPP ที่มี Apache, PHP 8.0+ และ MySQL/MariaDB
- PHP extensions: MySQLi และ Fileinfo

### Installation

1. Clone repository ลงใต้ XAMPP `htdocs`:

   ```bash
   git clone https://github.com/yahalofew/Museum-Audio-Guide.git
   ```

2. เปิด Apache และ MySQL จาก XAMPP Control Panel

3. Import `sound_tour.sql` ผ่าน phpMyAdmin หรือ MySQL client

4. สร้าง `server_mysql.php` จาก `server_mysql.example.php` และใส่ค่าการเชื่อมต่อของ environment นั้น:

   ```text
   server_mysql.example.php -> server_mysql.php
   ```

   `server_mysql.php` ต้องไม่ถูก commit และไม่ควรใส่ credentials จริงในไฟล์ documentation หรือไฟล์ตัวอย่างที่ track ด้วย Git

5. ตรวจให้ Apache สามารถเขียนโฟลเดอร์ `images/` และ `music/` ได้

6. สร้างหรือเปลี่ยนบัญชีผู้ดูแลเริ่มต้นด้วยรหัสผ่านเฉพาะของ environment โดยเก็บเฉพาะค่าที่สร้างจาก PHP `password_hash()` ห้ามใช้บัญชีตัวอย่างร่วมกันใน production

7. เปิดหน้า Visitor และ Admin:

   ```text
   http://localhost/Museum-Audio-Guide/index.html
   http://localhost/Museum-Audio-Guide/admin/admin.html
   ```

ปรับชื่อ path ใน URL ให้ตรงกับชื่อโฟลเดอร์ที่ clone ไว้ใต้ `htdocs`

## Verification

เมื่อ Apache/MySQL เปิดอยู่ สามารถรัน regression checks สำหรับ Visitor, Admin, Auth, API, media และ QR deep-link ได้ด้วย:

    pwsh -File tests/verify.ps1 -BaseUrl http://localhost/project

ชุดตรวจไม่แก้ข้อมูลในฐานข้อมูลและไม่ต้องติดตั้ง dependency เพิ่ม หากต้องการรวม authenticated login → protected API → logout flow ให้กำหนด MUSEUM_ADMIN_USERNAME และ MUSEUM_ADMIN_PASSWORD ใน environment ก่อนรัน สคริปต์จะไม่พิมพ์ค่าทั้งสองออกมา ใช้ -RequireAuthenticatedAuth เมื่อต้องการให้การไม่มี credentials ทำให้ชุดตรวจล้มเหลว

## Project Status

ระบบหลักพร้อมสำหรับการพัฒนาและทดสอบต่อบน XAMPP: Visitor player, QR deep-link, Admin CRUD, authentication, upload/path validation, media integrity และ responsive UI ถูกเชื่อมเข้ากับ flow ปัจจุบันแล้ว โปรเจกต์ยังคงใช้ native PHP และไม่มี dependency manager; ใช้ tests/verify.ps1 ตรวจ regression ผ่าน localhost ทุกครั้งที่แก้ไข

## License

ดูเงื่อนไขการใช้งานใน [LICENSE](LICENSE)
