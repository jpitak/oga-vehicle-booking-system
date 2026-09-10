# OGA Fleet v3.1 – เชื่อมต่อ Google Sheet จริง 100%

## URL ของระบบคุณ (ตั้งค่าเริ่มต้นในแอปแล้ว)

- **Google Sheet:** https://docs.google.com/spreadsheets/d/1lVnrFrlhKWyZiUml_5vXSsFpjhGo_A1KOfFP4X92Z9E/edit?usp=sharing
- **Web App:** https://script.google.com/macros/s/AKfycbx2zawd8M3YMO59wBUBPRIUpsF4RsWoZ9qjEUSS3g9gvOkUjylDJIy-Z9Vzu2iqNX8/exec
- **Spreadsheet ID:** `1lVnrFrlhKWyZiUml_5vXSsFpjhGo_A1KOfFP4X92Z9E`

## ถ้า Refresh แล้วขาดการเชื่อมต่อ

1. เปิด `index.html`
2. ไปเมนู **Google Sheet & Script**
3. ตรวจว่า URL ถูกต้อง (ระบบใส่ให้อัตโนมัติ)
4. กด **บันทึกการตั้งค่า**
5. กด **ทดสอบเชื่อมต่อ (Ping)**
6. กด **ดึงข้อมูลทั้งหมด**

ระบบจำ URL ใน `localStorage` — ครั้งถัดไปจะ auto-sync เอง

## อัปเดต Apps Script (แนะนำ)
1. เปิด Sheet → Extensions → Apps Script
2. วางโค้ดใหม่จาก `gas/Code.gs` ทั้งไฟล์
3. Save → Deploy → **Manage deployments** → แก้ไข (pencil) → Version: New version → Deploy
4. ใช้ URL เดิมได้ (ไม่ต้องเปลี่ยน)

## ชีตที่รองรับ (English)

Users, Departments, Drivers, Bookings, Vehicles, MasterItems, Maintenance, SystemLogs

(รองรับชื่อไทยด้วยถ้ามี)

## วันที่

- แสดง/เก็บเป็น **DD/MM/YYYY**
- ช่องเลือกวันที่เป็นปฏิทิน (`<input type="date">`) แล้วแปลงเป็น DD/MM/YYYY อัตโนมัติ
- ไม่ shift timezone

## สีทะเบียนรถ

แต่ละทะเบียนได้สีเฉพาะตัว (hash จากหมายเลขทะเบียน) แสดงในตาราง / การ์ด / ปฏิทิน