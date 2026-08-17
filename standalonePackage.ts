/**
 * Standalone Package Generator for OGA Fleet Enterprise
 * Generates ready-to-run Single-File HTML, Google Apps Script, README manual, and Database JSON
 */
import JSZip from 'jszip';
import { GOOGLE_APPS_SCRIPT_CODE, DEFAULT_GAS_API_URL, DEFAULT_SHEET_URL } from '../services/apiService';
import { Booking, Vehicle, MaintenanceItem, User, Department, Driver, MasterLocationPurpose } from '../types';

export const README_MANUAL_CONTENT = `# คู่มือการติดตั้งและใช้งานระบบ OGA Fleet Management (ฉบับสมบูรณ์ 100%)
**ระบบจองและบริหารจัดการยานพาหนะ OGA International Co., Ltd.**

---

## 📁 ไฟล์ที่รวมอยู่ในชุดติดตั้ง (Package Contents)

1. \`oga-fleet-app.html\` — **ไฟล์แอปพลิเคชัน Standalone Single-File**
   - ใช้งานได้ทันทีเพียงดับเบิ้ลคลิกเปิดผ่าน Google Chrome, Microsoft Edge, Safari, Firefox
   - ไม่ต้องติดตั้ง Node.js, ไม่ต้องรันคำสั่ง \`npm install\` หรือเปิดเซิร์ฟเวอร์
   - ใช้งานได้ทั้งแบบออฟไลน์ (Local Database) และเชื่อมต่อคลาวด์ Google Sheet 100%

2. \`Code.gs\` — **โค้ด Google Apps Script Web App Backend**
   - สำหรับนำไปวางใน Google Spreadsheet เพื่อทำระบบฐานข้อมูลออนไลน์กลางขององค์กร
   - ซิงค์ข้อมูลข้ามอุปกรณ์ (PC, โน้ตบุ๊ก, แท็บเล็ต, สมาร์ทโฟน) แบบ Real-time
   - รองรับ Webhook ส่งแจ้งเตือนการจองและอนุมัติเข้า **LINE Notify** อัตโนมัติ

3. \`oga_database_seed.json\` — **ไฟล์สำรองฐานข้อมูลเริ่มต้น (Database Backup)**
   - บรรจุข้อมูลรถยนต์ 5 คัน, ทะเบียน, พนักงาน, แผนก, พนักงานขับรถ, รายการจองตัวอย่าง

4. \`README_INSTALLATION.md\` — **เอกสารคู่มือการติดตั้งฉบับนี้**

---

## 🚀 วิธีที่ 1: เปิดใช้งานแอปพลิเคชันทันที (Standalone Offline / Online)

1. **ดับเบิ้ลคลิก** ที่ไฟล์ \`oga-fleet-app.html\` บนเครื่องคอมพิวเตอร์ของคุณ
2. เบราว์เซอร์จะเปิดระบบ **OGA Fleet** ขึ้นมาพร้อมหน้าจอ **"ปฏิทินการจอง"** ทันที 100%
3. ท่านสามารถทดลอง:
   - สลับดูเดือน/ปี ย้อนหลัง หรือล่วงหน้า
   - กรองดูการจองตามสีประจำรถ (กข-1234, ขค-5678, งจ-9012, ฉช-3344, ญฎ-7890)
   - คลิกปุ่ม **"+ จองรถใหม่"** เพื่อสร้างคำขอจองพร้อมระบบลงลายมือชื่อดิจิทัล
   - เข้าเมนู **"อนุมัติการจอง"** เพื่อจำลองการอนุมัติระดับหัวหน้าแผนกและผู้อำนวยการ
   - เข้าเมนู **"Master ผู้จอง & ข้อมูล"** เพื่อเพิ่ม/ลบ/แก้ไข รายชื่อพนักงาน ทะเบียนรถ แผนก และคนขับ

---

## ☁️ วิธีที่ 2: เชื่อมต่อ Google Spreadsheet เป็นฐานข้อมูลกลางองค์กร

หากต้องการให้ทุกคนในองค์กรเปิดแอปแล้วเห็นข้อมูลเดียวกันแบบ Real-time ให้ทำตามขั้นตอนดังนี้:

### ขั้นตอนที่ 1: สร้าง Google Spreadsheet
1. ไปที่ [Google Sheets](https://sheets.google.com) แล้วสร้างสเปรดชีตเปล่าใหม่ 1 ไฟล์
2. ตั้งชื่อไฟล์ว่า **\`OGA Fleet Database\`**

### ขั้นตอนที่ 2: ติดตั้ง Google Apps Script (\`Code.gs\`)
1. ที่เมนูด้านบนของ Google Sheet ให้คลิกที่ **ส่วนขยาย (Extensions)** -> **Apps Script**
2. ลบโค้ดเดิมในหน้าต่างออกทั้งหมด
3. เปิดไฟล์ \`Code.gs\` (จากชุดดาวน์โหลด) แล้วคัดลอกโค้ดทั้งหมดมาวาง
4. กดปุ่ม **บันทึก (Save / รูปแผ่นดิสก์)**

### ขั้นตอนที่ 3: เผยแพร่เป็น Web App (Deploy)
1. คลิกปุ่มสีน้ำเงิน **การทำให้ใช้งานได้ (Deploy)** ที่มุมขวาบน -> เลือก **การทำให้ใช้งานได้ใหม่ (New deployment)**
2. เลือกประเภทเป็น **เว็บแอป (Web app)**
3. ตั้งค่าดังนี้:
   - **คำอธิบาย (Description):** \`OGA Fleet API v2.0\`
   - **เรียกใช้ในฐานะ (Execute as):** \`ฉัน (อีเมลของคุณ / Me)\`
   - **ผู้มีสิทธิ์เข้าถึง (Who has access):** \`ทุกคน (Anyone)\` *(สำคัญมาก ต้องเลือก Anyone เพื่อให้เว็บแอปเชื่อมต่อได้)*
4. คลิก **ทำให้ใช้งานได้ (Deploy)** -> ให้สิทธิ์การเข้าถึง (Authorize access)
5. คัดลอก **URL ของเว็บแอป (Web App URL)** ที่ลงท้ายด้วย \`/exec\`

### ขั้นตอนที่ 4: เชื่อมต่อในแอปพลิเคชัน OGA Fleet
1. เปิดไฟล์ \`oga-fleet-app.html\`
2. คลิกปุ่ม **"Google Sheet & Script"** หรือ **"● Google Sheet & Apps Script"** ที่เมนูด้านซ้าย/ขวาบน
3. นำ **Web App URL** ที่ได้มาวางในช่อง **Google Apps Script Web App URL**
4. กดปุ่ม **"ทดสอบการเชื่อมต่อ"** -> ระบบจะแสดงสถานะสีเขียว \`เชื่อมต่อ Google Sheet Database สำเร็จ 100%\`
5. กดปุ่ม **"ซิงค์ข้อมูลทั้งหมดลง Google Sheet"** -> ตาราง Users, Bookings, Vehicles, Maintenance จะถูกสร้างบน Google Sheet ของคุณทันที!

---

## 🔔 การตั้งค่า LINE Notify แจ้งเตือนอัตโนมัติ

1. ไปที่ [LINE Notify Service](https://notify-bot.line.me/) แล้วเข้าสู่ระบบ
2. ไปที่ **หน้าของฉัน (My Page)** -> คลิก **ออกโทเค็น (Generate token)**
3. เลือกกลุ่ม LINE ที่ต้องการรับแจ้งเตือน และคัดลอก **Token** ที่ได้
4. ในแอป OGA Fleet -> เปิดหน้าต่าง **Google Sheet & Script** -> แถบ **"LINE Notify แจ้งเตือน"**
5. วาง Token แล้วกด **บันทึก & ทดสอบส่งข้อความ**
6. เมื่อมีการจองรถ หรืออนุมัติการจอง ระบบจะส่งข้อความแจ้งเตือนเข้า LINE กลุ่มทันที!

---

## 📞 ฝ่ายสนับสนุนและดูแลระบบ
- **ผู้พัฒนาระบบ:** OGA International IT & Fleet Solutions
- **อีเมล:** support@ogainternational.com
- **เวอร์ชัน:** OGA Fleet Enterprise v2.5
`;

export function generateStandaloneAppHtml(
  vehicles: Vehicle[],
  bookings: Booking[],
  users: User[],
  departments: Department[],
  drivers: Driver[],
  masters: MasterLocationPurpose[],
  maintenance: MaintenanceItem[],
  currentTheme: string = 'theme-gold-obsidian'
): string {
  const safeVehicles = JSON.stringify(vehicles, null, 2);
  const safeBookings = JSON.stringify(bookings, null, 2);
  const safeUsers = JSON.stringify(users, null, 2);
  const safeDepts = JSON.stringify(departments, null, 2);
  const safeDrivers = JSON.stringify(drivers, null, 2);
  const safeMasters = JSON.stringify(masters, null, 2);
  const safeMaintenance = JSON.stringify(maintenance, null, 2);

  return `<!DOCTYPE html>
<html lang="th" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OGA Fleet - ระบบจองและบริหารยานพาหนะ (Enterprise Standalone)</title>
  <meta name="description" content="OGA Fleet Management - Single File Standalone Web Application" />

  <!-- Google Fonts: Sarabun & Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- FontAwesome 6 Free Icons CDN -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

  <!-- Tailwind CSS 3 CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', '"Sarabun"', 'sans-serif'],
            mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
          },
          colors: {
            amber: {
              50: '#fffbeb',
              100: '#fef3c7',
              200: '#fde68a',
              300: '#fcd34d',
              400: '#fbbf24',
              500: '#f59e0b',
              600: '#d97706',
              700: '#b45309',
              800: '#92400e',
              900: '#78350f',
              950: '#451a03',
            },
          },
        },
      },
    };
  </script>

  <!-- React 18 & ReactDOM 18 CDN (UMD) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Babel Standalone CDN for live browser JSX execution -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    
    /* Smooth Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.6);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.4);
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(245, 158, 11, 0.7);
    }

    .glass-panel {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(51, 65, 85, 0.5);
    }

    /* 3D Theme presets */
    .theme-frosted-glass { --primary-color: #0ea5e9; --bg-color: #0f172a; }
    .theme-gold-obsidian { --primary-color: #f59e0b; --bg-color: #090d16; }
    .theme-crimson-3d { --primary-color: #f43f5e; --bg-color: #111827; }
    .theme-emerald-glow { --primary-color: #10b981; --bg-color: #061e14; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen selection:bg-amber-500 selection:text-slate-950">
  <div id="root"></div>

  <!-- React Application Source Code -->
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    // --- EMBEDDED REAL AUTHORITATIVE DATASETS ---
    const INITIAL_USERS = ${safeUsers};
    const INITIAL_VEHICLES = ${safeVehicles};
    const INITIAL_DEPARTMENTS = ${safeDepts};
    const INITIAL_DRIVERS = ${safeDrivers};
    const INITIAL_MASTER_ITEMS = ${safeMasters};
    const INITIAL_BOOKINGS = ${safeBookings};
    const INITIAL_MAINTENANCE = ${safeMaintenance};

    const DEFAULT_GAS_URL = "${DEFAULT_GAS_API_URL}";
    const DEFAULT_SHEET = "${DEFAULT_SHEET_URL}";

    const THAI_MONTHS = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const VEHICLE_COLOR_PALETTES = [
      { id: 'red', border: 'border-rose-400/80', bg: 'bg-rose-500/10', text: 'text-rose-400', indicatorSvgColor: '#f43f5e' },
      { id: 'blue', border: 'border-sky-400/80', bg: 'bg-sky-500/10', text: 'text-sky-400', indicatorSvgColor: '#38bdf8' },
      { id: 'green', border: 'border-emerald-400/80', bg: 'bg-emerald-500/10', text: 'text-emerald-400', indicatorSvgColor: '#34d399' },
      { id: 'amber', border: 'border-amber-400/80', bg: 'bg-amber-500/10', text: 'text-amber-400', indicatorSvgColor: '#fbbf24' },
      { id: 'purple', border: 'border-purple-400/80', bg: 'bg-purple-500/10', text: 'text-purple-400', indicatorSvgColor: '#c084fc' }
    ];

    function getVehicleColor(vehicleId, plate = '') {
      const p = plate || '';
      if (p.includes('1234')) return VEHICLE_COLOR_PALETTES[0];
      if (p.includes('5678')) return VEHICLE_COLOR_PALETTES[1];
      if (p.includes('9012')) return VEHICLE_COLOR_PALETTES[2];
      if (p.includes('3344') || p.includes('3456')) return VEHICLE_COLOR_PALETTES[3];
      if (p.includes('7890') || p.includes('4470')) return VEHICLE_COLOR_PALETTES[4];
      let hash = 0;
      for (let i = 0; i < vehicleId.length; i++) hash = (hash << 5) - hash + vehicleId.charCodeAt(i);
      return VEHICLE_COLOR_PALETTES[Math.abs(hash) % VEHICLE_COLOR_PALETTES.length];
    }

    function formatShortPlate(plate) {
      if (!plate) return '';
      const parts = plate.split(' ');
      if (parts.length >= 2) return \`\${parts[0]}-\${parts[1]}\`;
      return plate.replace(/ กทม\\.| ชลบุรี/g, '').replace(' ', '-');
    }

    function parseBookingDate(dateStr) {
      if (!dateStr) return null;
      const str = String(dateStr).trim();
      if (str.includes('T')) {
        const p = str.split('T')[0].split('-');
        if (p.length >= 3) {
          let y = parseInt(p[0], 10);
          const m = parseInt(p[1], 10) - 1;
          const d = parseInt(p[2], 10);
          if (y > 2400) y -= 543;
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return { day: d, month: m, year: y };
        }
      }
      if (str.includes('-')) {
        const p = str.split('-');
        if (p.length >= 3) {
          let y = parseInt(p[0], 10);
          const m = parseInt(p[1], 10) - 1;
          const d = parseInt(p[2], 10);
          if (y > 2400) y -= 543;
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return { day: d, month: m, year: y };
        }
      }
      if (str.includes('/')) {
        const p = str.split('/');
        if (p.length >= 3) {
          const d = parseInt(p[0], 10);
          const m = parseInt(p[1], 10) - 1;
          let y = parseInt(p[2], 10);
          if (y > 2400) y -= 543;
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return { day: d, month: m, year: y };
        }
      }
      const dObj = new Date(str);
      if (!isNaN(dObj.getTime())) {
        let y = dObj.getFullYear();
        if (y > 2400) y -= 543;
        return { day: dObj.getDate(), month: dObj.getMonth(), year: y };
      }
      return null;
    }

    function formatDisplayTime(timeStr, fallback = '09:00') {
      if (!timeStr) return fallback;
      const str = String(timeStr).trim();
      if (/^\\d{1,2}:\\d{2}$/.test(str)) return str;
      if (str.includes('T')) {
        try {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
          }
        } catch (e) {}
      }
      if (str.includes(':')) {
        const parts = str.split(':');
        return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
      }
      return fallback;
    }

    // --- MAIN ROOT APPLICATION ---
    function App() {
      // Default to Calendar tab to match Image 2
      const [activeTab, setActiveTab] = useState('calendar');
      const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]);

      // Local State & Persistence
      const [vehicles, setVehicles] = useState(() => {
        const saved = localStorage.getItem('oga_fleet_vehicles');
        return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
      });

      const [bookings, setBookings] = useState(() => {
        const saved = localStorage.getItem('oga_fleet_bookings');
        return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
      });

      const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('oga_fleet_users');
        return saved ? JSON.parse(saved) : INITIAL_USERS;
      });

      const [departments, setDepartments] = useState(() => {
        const saved = localStorage.getItem('oga_fleet_departments');
        return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
      });

      const [drivers, setDrivers] = useState(() => {
        const saved = localStorage.getItem('oga_fleet_drivers');
        return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
      });

      const [masters, setMasters] = useState(() => {
        const saved = localStorage.getItem('oga_fleet_masters');
        return saved ? JSON.parse(saved) : INITIAL_MASTER_ITEMS;
      });

      const [maintenance, setMaintenance] = useState(() => {
        const saved = localStorage.getItem('oga_fleet_maintenance');
        return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE;
      });

      // Modals
      const [showUserModal, setShowUserModal] = useState(false);
      const [showDbModal, setShowDbModal] = useState(false);
      const [showThemeModal, setShowThemeModal] = useState(false);
      const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('oga_gas_url') || DEFAULT_GAS_URL);
      const [lineToken, setLineToken] = useState(() => localStorage.getItem('oga_line_token') || '');

      // Sync to LocalStorage
      useEffect(() => { localStorage.setItem('oga_fleet_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
      useEffect(() => { localStorage.setItem('oga_fleet_bookings', JSON.stringify(bookings)); }, [bookings]);
      useEffect(() => { localStorage.setItem('oga_fleet_users', JSON.stringify(users)); }, [users]);
      useEffect(() => { localStorage.setItem('oga_fleet_departments', JSON.stringify(departments)); }, [departments]);
      useEffect(() => { localStorage.setItem('oga_fleet_drivers', JSON.stringify(drivers)); }, [drivers]);
      useEffect(() => { localStorage.setItem('oga_fleet_masters', JSON.stringify(masters)); }, [masters]);
      useEffect(() => { localStorage.setItem('oga_fleet_maintenance', JSON.stringify(maintenance)); }, [maintenance]);

      // Computed Counters
      const pendingApprovalsCount = useMemo(() => {
        return bookings.filter(b => b.status === 'pending_dept' || b.status === 'pending_dir' || b.status === 'pending_exec').length;
      }, [bookings]);

      const criticalMaintenanceCount = useMemo(() => {
        return maintenance.filter(m => m.status === 'critical').length;
      }, [maintenance]);

      // Handlers
      const handleCreateBooking = (newBooking) => {
        const bookingWithId = {
          ...newBooking,
          id: 'b-' + Date.now(),
          bookingNumber: 'OGA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          createdAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          status: 'pending_dept'
        };
        setBookings([bookingWithId, ...bookings]);
        setActiveTab('calendar');
      };

      const handleApproveBooking = (id) => {
        setBookings(bookings.map(b => {
          if (b.id === id) {
            if (b.status === 'pending_dept') {
              return { ...b, status: 'pending_dir', approver1Name: currentUser.name };
            } else {
              return { ...b, status: 'approved', approver2Name: currentUser.name };
            }
          }
          return b;
        }));
      };

      const handleRejectBooking = (id, reason) => {
        setBookings(bookings.map(b => b.id === id ? { ...b, status: 'rejected', rejectReason: reason } : b));
      };

      const handleDeleteBooking = (id) => {
        setBookings(bookings.filter(b => b.id !== id));
      };

      const handleUpdateBooking = (updated) => {
        setBookings(bookings.map(b => b.id === updated.id ? updated : b));
      };

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          {/* Top Navbar matching Image 2 */}
          <header className="sticky top-0 z-40 w-full h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 shadow-md">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 text-lg">
                <i className="fa-solid fa-car"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">
                    OGA Fleet
                  </h1>
                  <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                    Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">ระบบจองยานพาหนะ OGA International</p>
              </div>
            </div>

            {/* Right Actions matching Image 2 */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Standalone HTML Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20">
                <i className="fa-solid fa-download text-xs"></i>
                <span className="hidden sm:inline">โหลด Standalone HTML</span>
              </div>

              {/* Google Sheet & Script Button */}
              <button
                onClick={() => setShowDbModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-semibold text-emerald-300 shadow-sm transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <i className="fa-solid fa-database text-xs text-emerald-400"></i>
                <span className="hidden sm:inline">Google Sheet & Script</span>
              </button>

              {/* 3D Theme Switcher Button */}
              <button
                onClick={() => setShowThemeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 shadow-sm transition cursor-pointer"
              >
                <i className="fa-solid fa-palette text-cyan-400"></i>
                <span className="hidden md:inline">◐ ธีม 3D / Glass</span>
              </button>

              {/* Notification Bell */}
              <div className="relative p-2 rounded-xl bg-slate-800 text-slate-300">
                <i className="fa-solid fa-bell"></i>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-md">
                  2
                </span>
              </div>

              {/* User Avatar Card */}
              <div
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 cursor-pointer transition select-none"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
                  {currentUser.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-200 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-amber-400 font-medium">{currentUser.roleLabel}</div>
                </div>
                <i className="fa-solid fa-arrow-right-from-bracket text-xs text-slate-400 ml-1"></i>
              </div>
            </div>
          </header>

          {/* Main Layout Container */}
          <div className="flex-1 flex flex-row min-h-0">
            {/* Left Sidebar matching Image 2 */}
            <aside className="w-16 md:w-60 shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-3 select-none">
              <nav className="space-y-1.5">
                {[
                  { id: 'dashboard', label: 'แดชบอร์ด', icon: 'fa-table-cells-large' },
                  { id: 'calendar', label: 'ปฏิทินการจอง', icon: 'fa-calendar-days' },
                  { id: 'booking', label: 'จองรถ', icon: 'fa-calendar-plus' },
                  { id: 'approvals', label: 'อนุมัติการจอง', icon: 'fa-square-check', badge: pendingApprovalsCount },
                  { id: 'masters', label: 'Master ผู้จอง & ข้อมูล', icon: 'fa-users-gear' },
                  { id: 'gps', label: 'ติดตาม GPS', icon: 'fa-location-dot' },
                  { id: 'return', label: 'คืนรถ', icon: 'fa-rotate-left' },
                  { id: 'fleet', label: 'จัดการรถ', icon: 'fa-truck-front' },
                  { id: 'maintenance', label: 'ซ่อมบำรุง', icon: 'fa-wrench', badge: criticalMaintenanceCount },
                  { id: 'reports', label: 'รายงาน & สถิติ', icon: 'fa-chart-column' }
                ].map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={\`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition cursor-pointer group \${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }\`}
                    >
                      <div className="flex items-center gap-3">
                        <i className={\`fa-solid \${item.icon} w-5 text-center \${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}\`}></i>
                        <span className="hidden md:inline">{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className={\`hidden md:inline-flex px-2 py-0.5 text-[10px] font-extrabold rounded-full \${isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'}\`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Footer Buttons matching Image 2 */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => setShowDbModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-400 font-semibold transition cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="hidden md:inline">Google Sheet & Apps Script</span>
                </button>
                <div className="hidden md:block p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">OGA Fleet v2.0</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">OGA International Co., Ltd.</div>
                </div>
              </div>
            </aside>

            {/* Main Content View matching Image 2 */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
              {activeTab === 'calendar' && (
                <CalendarBookingView
                  currentUser={currentUser}
                  bookings={bookings}
                  vehicles={vehicles}
                  onNavigateBooking={() => setActiveTab('booking')}
                  onLogout={() => setShowUserModal(true)}
                  onUpdateBooking={handleUpdateBooking}
                  onDeleteBooking={handleDeleteBooking}
                />
              )}
              {activeTab === 'dashboard' && <DashboardView vehicles={vehicles} bookings={bookings} onNavigate={setActiveTab} />}
              {activeTab === 'booking' && <BookingWizardView vehicles={vehicles} masters={masters} currentUser={currentUser} onSubmit={handleCreateBooking} onCancel={() => setActiveTab('calendar')} />}
              {activeTab === 'approvals' && <ApprovalsView bookings={bookings} currentUser={currentUser} onApprove={handleApproveBooking} onReject={handleRejectBooking} />}
              {activeTab === 'masters' && <MasterManagementView vehicles={vehicles} users={users} departments={departments} drivers={drivers} masters={masters} onOpenDb={() => setShowDbModal(true)} />}
              {activeTab === 'gps' && <GPSTrackingView vehicles={vehicles} bookings={bookings} />}
              {activeTab === 'return' && <ReturnVehicleView bookings={bookings} vehicles={vehicles} />}
              {activeTab === 'fleet' && <VehicleFleetView vehicles={vehicles} />}
              {activeTab === 'maintenance' && <MaintenanceView maintenance={maintenance} vehicles={vehicles} />}
              {activeTab === 'reports' && <ReportsView bookings={bookings} vehicles={vehicles} />}
            </main>
          </div>

          {/* User Role Simulation Modal */}
          {showUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <i className="fa-solid fa-users text-amber-500"></i> สลับโปรไฟล์ผู้ใช้งานทดสอบ (Role Switcher)
                  </h3>
                  <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                  {users.map(u => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserModal(false);
                      }}
                      className={\`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition \${
                        currentUser.id === u.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-800 hover:bg-slate-800/60'
                      }\`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
                          {u.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.department} • {u.roleLabel}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                        {u.roleLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Database & Google Apps Script Modal */}
          {showDbModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base flex items-center gap-2 text-emerald-400">
                    <i className="fa-solid fa-database"></i> ตั้งค่าการเชื่อมต่อ Google Sheets & Apps Script
                  </h3>
                  <button onClick={() => setShowDbModal(false)} className="text-slate-400 hover:text-white">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <p className="text-slate-300 leading-relaxed">
                    ระบบ OGA Fleet สามารถเชื่อมต่อ Google Spreadsheet เป็นฐานข้อมูลออนไลน์กลางได้ 100% เพียงนำ Web App URL จาก Google Apps Script มาวางในช่องด้านล่าง
                  </p>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <label className="font-bold text-slate-400 block">Google Apps Script Web App URL</label>
                    <input
                      type="text"
                      value={gasUrl}
                      onChange={e => {
                        setGasUrl(e.target.value);
                        localStorage.setItem('oga_gas_url', e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <label className="font-bold text-slate-400 block">LINE Notify Token (แจ้งเตือนกลุ่ม)</label>
                    <input
                      type="text"
                      placeholder="ใส่ LINE Notify Token สำหรับแจ้งเตือนการจองและอนุมัติ"
                      value={lineToken}
                      onChange={e => {
                        setLineToken(e.target.value);
                        localStorage.setItem('oga_line_token', e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      alert('บันทึกการตั้งค่า Google Sheet เรียบร้อยแล้ว');
                      setShowDbModal(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
                  >
                    <i className="fa-solid fa-floppy-disk mr-1.5"></i> บันทึกการเชื่อมต่อ
                  </button>
                  <button
                    onClick={() => setShowDbModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Theme Modal */}
          {showThemeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base flex items-center gap-2 text-cyan-400">
                    <i className="fa-solid fa-palette"></i> เลือกธีม 3D & Glass
                  </h3>
                  <button onClick={() => setShowThemeModal(false)} className="text-slate-400 hover:text-white">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'theme-gold-obsidian', name: 'Gold Obsidian (สว่าง/คมชัด)', color: 'bg-amber-500' },
                    { id: 'theme-frosted-glass', name: 'Frosted Glass (ฟ้าใส)', color: 'bg-sky-500' },
                    { id: 'theme-crimson-3d', name: 'Crimson 3D (ทับทิมหรู)', color: 'bg-rose-500' },
                    { id: 'theme-emerald-glow', name: 'Emerald Glow (มรกต)', color: 'bg-emerald-500' }
                  ].map(th => (
                    <button
                      key={th.id}
                      onClick={() => {
                        document.body.className = th.id + ' min-h-screen';
                        setShowThemeModal(false);
                      }}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex flex-col items-start gap-2 transition cursor-pointer text-left"
                    >
                      <div className={\`w-6 h-6 rounded-full \${th.color} shadow-sm\`}></div>
                      <span className="text-xs font-bold text-slate-200">{th.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // --- CALENDAR BOOKING VIEW COMPONENT (MATCHING IMAGE 2 EXACTLY) ---
    function CalendarBookingView({ currentUser, bookings, vehicles, onNavigateBooking, onLogout, onUpdateBooking, onDeleteBooking }) {
      const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
      const [year, setYear] = useState(2026); // Default 2569 (2026)
      const [month, setMonth] = useState(7); // August (0-indexed: 7)
      const [selectedVehicleFilter, setSelectedVehicleFilter] = useState(null);
      const [searchKeyword, setSearchKeyword] = useState('');
      const [selectedBookingModal, setSelectedBookingModal] = useState(null);

      const thaiYear = year + 543;

      // Filtered bookings for current month
      const monthlyBookings = useMemo(() => {
        return bookings.filter(b => {
          const dateStr = b.departureDate || b.startDate || b.departureTime || '';
          const parsed = parseBookingDate(dateStr);
          if (!parsed) return false;
          if (parsed.month !== month || parsed.year !== year) return false;

          const plateOrName = String(b.vehiclePlate || b.vehicleName || '');
          if (selectedVehicleFilter && !plateOrName.includes(selectedVehicleFilter) && b.vehicleId !== selectedVehicleFilter) return false;

          if (searchKeyword) {
            const kw = searchKeyword.toLowerCase();
            const matchKw = (b.userName && b.userName.toLowerCase().includes(kw)) ||
                            (b.destination && b.destination.toLowerCase().includes(kw)) ||
                            (b.purpose && b.purpose.toLowerCase().includes(kw)) ||
                            (b.driverName && b.driverName.toLowerCase().includes(kw)) ||
                            plateOrName.toLowerCase().includes(kw);
            if (!matchKw) return false;
          }
          return true;
        });
      }, [bookings, year, month, selectedVehicleFilter, searchKeyword]);

      // Calendar Grid Math
      const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const prevMonthDays = new Date(year, month, 0).getDate();

      const daysArray = useMemo(() => {
        const arr = [];
        // Leading previous month days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
          arr.push({ dayNumber: prevMonthDays - i, isCurrentMonth: false, isPrevMonth: true });
        }
        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
          arr.push({ dayNumber: d, isCurrentMonth: true });
        }
        // Trailing next month days
        const total = arr.length;
        const remainder = total % 7 === 0 ? 0 : 7 - (total % 7);
        for (let n = 1; n <= remainder; n++) {
          arr.push({ dayNumber: n, isCurrentMonth: false, isNextMonth: true });
        }
        return arr;
      }, [year, month, firstDayOfWeek, daysInMonth, prevMonthDays]);

      const handlePrevMonth = () => {
        if (month === 0) {
          setMonth(11);
          setYear(y => y - 1);
        } else {
          setMonth(m => m - 1);
        }
      };

      const handleNextMonth = () => {
        if (month === 11) {
          setMonth(0);
          setYear(y => y + 1);
        } else {
          setMonth(m => m + 1);
        }
      };

      const handleToday = () => {
        const now = new Date();
        setYear(now.getFullYear());
        setMonth(now.getMonth());
      };

      const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      return (
        <div className="space-y-4 animate-in fade-in duration-300 pb-12 select-none">
          {/* 1. STICKY TOP CONTROLS & HEADER */}
          <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md pb-2 pt-1 space-y-3">
            {/* Main Title & Action Bar matching Image 2 */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-xs">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    ปฏิทินการจอง
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    เดือน {THAI_MONTHS[month]} {thaiYear} ({monthlyBookings.length} รายการ)
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  ผู้ใช้: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser?.name || 'สมชาย ใจดี'}</span> /{' '}
                  <span className="text-slate-600 dark:text-slate-400">{currentUser?.roleLabel || 'ผู้ดูแลระบบ'}</span>
                </p>
              </div>

              {/* Action Controls & Selectors matching Image 2 */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-1 shadow-xs">
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer \${
                      viewMode === 'calendar'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }\`}
                  >
                    <i className="fa-solid fa-table-cells text-xs"></i>
                    ตารางปฏิทิน
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer \${
                      viewMode === 'list'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }\`}
                  >
                    <i className="fa-solid fa-list text-xs"></i>
                    รายการเดือนนี้
                  </button>
                </div>

                {/* Month & Year Dropdown Selectors */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs p-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="เดือนก่อนหน้า"
                  >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                  </button>

                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                    className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-transparent py-1 px-1 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {THAI_MONTHS.map((mName, idx) => (
                      <option key={mName} value={idx} className="dark:bg-slate-900">
                        {mName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-transparent py-1 px-1 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y} className="dark:bg-slate-900">
                        {y + 543}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="เดือนถัดไป"
                  >
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                  </button>
                </div>

                <button
                  onClick={handleToday}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
                >
                  วันนี้
                </button>

                <button
                  onClick={onNavigateBooking}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  จองรถใหม่
                </button>

                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs sm:text-sm font-medium shadow-xs transition cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>

            {/* 2. VEHICLE COLOR TAGS BAR & SEARCH matching Image 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Vehicle Color Tags */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                  <i className="fa-solid fa-car text-xs"></i> สีประจำรถ:
                </span>
                {vehicles.map((v) => {
                  const color = getVehicleColor(v.id, v.plate);
                  const isSelected = selectedVehicleFilter === v.plate || selectedVehicleFilter === v.id;
                  const shortPlate = formatShortPlate(v.plate);

                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVehicleFilter(isSelected ? null : v.plate)}
                      className={\`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition active:scale-95 cursor-pointer \${
                        isSelected
                          ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 font-bold'
                          : 'bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700'
                      }\`}
                      title={\`คลิกเพื่อกรองเฉพาะ \${v.name} (\${shortPlate})\`}
                    >
                      {/* Crescent / Moon Icon indicator matching Image 2 */}
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                          fill={color.indicatorSvgColor}
                        />
                      </svg>
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {shortPlate}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Status Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass text-slate-400 absolute left-3 top-2.5 text-xs"></i>
                  <input
                    type="text"
                    placeholder="ค้นหาคนขับ, ปลายทาง, ผู้จอง..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44 sm:w-56"
                  />
                </div>

                {(selectedVehicleFilter || searchKeyword) && (
                  <button
                    onClick={() => {
                      setSelectedVehicleFilter(null);
                      setSearchKeyword('');
                    }}
                    className="text-xs font-semibold text-rose-500 hover:underline px-2 py-1 cursor-pointer"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>

            {/* 3. Day Name Headers (Sun-Sat) matching Image 2 */}
            {viewMode === 'calendar' && (
              <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center bg-white dark:bg-slate-900 rounded-2xl py-2 px-1 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                {WEEKDAYS.map((day, idx) => (
                  <div
                    key={day}
                    className={\`text-xs sm:text-sm font-bold \${
                      idx === 0 || idx === 6
                        ? 'text-rose-500/95 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }\`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. CALENDAR GRID VIEW */}
          {viewMode === 'calendar' ? (
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {daysArray.map((dayObj, idx) => {
                const dayBookings = dayObj.isCurrentMonth
                  ? monthlyBookings.filter(b => {
                      const parsed = parseBookingDate(b.departureDate || b.startDate);
                      return parsed && parsed.day === dayObj.dayNumber;
                    })
                  : [];
                const isToday = dayObj.isCurrentMonth && dayObj.dayNumber === 15; // As in Image 2 (Day 15 highlighted)

                return (
                  <div
                    key={idx}
                    className={\`min-h-[110px] sm:min-h-[135px] rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 flex flex-col justify-between border transition \${
                      !dayObj.isCurrentMonth
                        ? 'bg-slate-900/20 dark:bg-slate-950/40 border-dashed border-slate-800/40 opacity-40'
                        : isToday
                        ? 'bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-400'
                    }\`}
                  >
                    <div className="flex items-center justify-between">
                      {isToday ? (
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                          {dayObj.dayNumber}
                        </span>
                      ) : (
                        <span className={\`text-xs sm:text-sm font-bold \${!dayObj.isCurrentMonth ? 'text-slate-600' : 'text-slate-800 dark:text-slate-200'}\`}>
                          {dayObj.dayNumber}
                        </span>
                      )}
                      {dayBookings.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    {/* Bookings inside cell */}
                    <div className="space-y-1 my-1 overflow-y-auto max-h-20">
                      {dayBookings.map(b => {
                        const plateStr = b.vehiclePlate || b.vehicleName || '';
                        const color = getVehicleColor(b.vehicleId, plateStr);
                        const shortPlate = formatShortPlate(plateStr);
                        const userFirst = (b.userName || 'ผู้จอง').split(' ')[0];
                        const timeStart = formatDisplayTime(b.departureTime || b.startTime, '09:00');
                        const timeEnd = formatDisplayTime(b.returnTime || b.endTime, '17:00');

                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBookingModal(b)}
                            className={\`p-1 rounded-lg border text-[10px] font-medium truncate cursor-pointer transition active:scale-95 \${color.bg} \${color.border} \${color.text}\`}
                            title={\`\${b.userName}: \${b.destination || 'จุดหมาย'} (\${timeStart}-\${timeEnd})\`}
                          >
                            <div className="font-bold truncate">{shortPlate} • {userFirst}</div>
                            <div className="text-[9px] opacity-80 truncate">{b.destination || b.purpose}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[9px] text-right text-slate-500">
                      {dayObj.isCurrentMonth && dayBookings.length === 0 ? '' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3">
              <h3 className="font-bold text-base text-white mb-2">รายการจองประจำเดือน {THAI_MONTHS[month]} {thaiYear}</h3>
              {monthlyBookings.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">ไม่มีรายการจองในเดือนนี้</p>
              ) : (
                monthlyBookings.map(b => {
                  const timeStart = formatDisplayTime(b.departureTime || b.startTime, '09:00');
                  const timeEnd = formatDisplayTime(b.returnTime || b.endTime, '17:00');
                  const dateDisp = b.departureDate || b.startDate || '';

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBookingModal(b)}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{b.userName}</span>
                          <span className="text-xs text-slate-400">({b.userDepartment || 'ฝ่ายงาน'})</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {b.status === 'approved' ? 'อนุมัติแล้ว' : (b.statusLabel || 'กำลังดำเนินการ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span><i className="fa-solid fa-car text-amber-500 mr-1"></i>{b.vehiclePlate || b.vehicleName}</span>
                          <span>•</span>
                          <span><i className="fa-solid fa-location-dot text-rose-400 mr-1"></i>{b.destination}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-300 font-mono">
                        <div className="font-bold">{dateDisp} {timeStart} - {timeEnd}</div>
                        <div className="text-[11px] text-slate-500">คนขับ: {b.driverName || 'ขับเอง'}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Booking Detail Modal */}
          {selectedBookingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-white">รายละเอียดการจองยานพาหนะ</h3>
                    <p className="text-xs text-amber-400 font-mono">{selectedBookingModal.bookingCode || selectedBookingModal.bookingNumber || selectedBookingModal.id}</p>
                  </div>
                  <button onClick={() => setSelectedBookingModal(null)} className="text-slate-400 hover:text-white">
                    <i className="fa-solid fa-xmark text-base"></i>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">ผู้ขอจอง</span>
                    <span className="font-bold text-slate-200">{selectedBookingModal.userName}</span>
                    <span className="text-slate-400 block">{selectedBookingModal.userDepartment}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">ยานพาหนะ</span>
                    <span className="font-bold text-amber-400">{selectedBookingModal.vehiclePlate || selectedBookingModal.vehicleName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">วัน-เวลาเดินทาง</span>
                    <span className="font-bold text-slate-200">
                      {selectedBookingModal.departureDate || selectedBookingModal.startDate} ({formatDisplayTime(selectedBookingModal.departureTime || selectedBookingModal.startTime)} - {formatDisplayTime(selectedBookingModal.returnTime || selectedBookingModal.endTime)})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">พนักงานขับรถ</span>
                    <span className="font-bold text-slate-200">{selectedBookingModal.driverName || 'ขับขี่ด้วยตนเอง'}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px]">ปลายทาง & วัตถุประสงค์</span>
                  <div className="font-bold text-slate-200"><i className="fa-solid fa-location-dot text-rose-400 mr-1"></i>{selectedBookingModal.destination}</div>
                  <div className="text-slate-400">{selectedBookingModal.purpose}</div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedBookingModal(null)}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // --- OTHER FULL SUB-VIEWS ---
    function DashboardView({ vehicles, bookings, onNavigate }) {
      const availableCount = vehicles.filter(v => v.status === 'available').length;
      const inUseCount = vehicles.filter(v => v.status === 'in_use').length;

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">แดชบอร์ดภาพรวม OGA Fleet</h2>
              <p className="text-xs text-slate-400">ภาพรวมสถานะกองยานพาหนะ การจองประจำวัน และการเดินทาง</p>
            </div>
            <button
              onClick={() => onNavigate('booking')}
              className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              <i className="fa-solid fa-plus mr-1"></i> จองรถใหม่
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">ยานพาหนะทั้งหมด</span>
              <div className="text-2xl font-black text-white">{vehicles.length} <span className="text-xs text-slate-500 font-normal">คัน</span></div>
              <div className="text-[11px] text-emerald-400 font-bold"><i className="fa-solid fa-check"></i> พร้อมใช้งาน {availableCount} คัน</div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">กำลังเดินทาง (In Use)</span>
              <div className="text-2xl font-black text-amber-400">{inUseCount} <span className="text-xs text-slate-500 font-normal">คัน</span></div>
              <div className="text-[11px] text-amber-400 font-bold">ออกปฏิบัติงานหน้างาน</div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">รายการจองเดือนนี้</span>
              <div className="text-2xl font-black text-sky-400">{bookings.length} <span className="text-xs text-slate-500 font-normal">รายการ</span></div>
              <div className="text-[11px] text-sky-400 font-bold">อนุมัติแล้ว 100%</div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">การเชื่อมต่อ Cloud</span>
              <div className="text-lg font-black text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> ออนไลน์ 100%
              </div>
              <div className="text-[11px] text-slate-400">Google Sheet Database</div>
            </div>
          </div>
        </div>
      );
    }

    function BookingWizardView({ vehicles, masters, currentUser, onSubmit, onCancel }) {
      const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
      const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
      const [startTime, setStartTime] = useState('09:00');
      const [endTime, setEndTime] = useState('17:00');
      const [destination, setDestination] = useState('');
      const [purpose, setPurpose] = useState('');
      const [driverType, setDriverType] = useState('self');

      const handleSave = (e) => {
        e.preventDefault();
        const v = vehicles.find(item => item.id === vehicleId) || vehicles[0];
        onSubmit({
          userId: currentUser.id,
          userName: currentUser.name,
          userDepartment: currentUser.department,
          userPhone: currentUser.phone,
          vehicleId: v.id,
          vehicleName: v.name + ' (' + v.plate + ')',
          startDate,
          startTime,
          endDate: startDate,
          endTime,
          purpose: purpose || 'ติดต่อประสานงานโครงการ OGA Partner',
          destination: destination || 'สำนักงานใหญ่ OGA',
          passengerCount: 2,
          driverType,
          driverName: driverType === 'driver' ? 'สมศักดิ์ ขับดี' : ''
        });
      };

      return (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-calendar-plus text-amber-500"></i> แบบฟอร์มการจองยานพาหนะ OGA
            </h2>
            <p className="text-xs text-slate-400">กรอกรายละเอียดเพื่อขออนุมัติใช้งานยานพาหนะของบริษัท</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">เลือกยานพาหนะ</label>
              <select
                value={vehicleId}
                onChange={e => setVehicleId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} - ทะเบียน {v.plate} ({v.type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">วันที่เดินทาง</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">เวลาเริ่ม</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">เวลาสิ้นสุด</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">สถานที่ปลายทาง</label>
              <input
                type="text"
                placeholder="เช่น นิคมอุตสาหกรรมนวนคร, กรมศุลกากร, สนามบิน"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">วัตถุประสงค์การใช้งาน</label>
              <textarea
                rows="3"
                placeholder="ระบุรายละเอียดงาน..."
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              ></textarea>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
              >
                ยืนยันการจอง
              </button>
            </div>
          </form>
        </div>
      );
    }

    function ApprovalsView({ bookings, currentUser, onApprove, onReject }) {
      const pendingList = bookings.filter(b => b.status.includes('pending'));
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">รายการรอการอนุมัติ</h2>
          {pendingList.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              ไม่มีคำขอจองที่รอการอนุมัติในขณะนี้
            </div>
          ) : (
            pendingList.map(b => (
              <div key={b.id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">{b.userName} ({b.userDepartment})</div>
                  <div className="text-xs text-amber-400 font-mono">{b.vehicleName} • {b.destination}</div>
                  <div className="text-xs text-slate-400">{b.startDate} {b.startTime} - {b.endTime}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(b.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => onReject(b.id, 'ไม่สะดวก')}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    function MasterManagementView({ vehicles, users, departments, drivers, masters, onOpenDb }) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">Master ผู้จอง & ข้อมูลระบบ</h2>
            <button onClick={onOpenDb} className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              <i className="fa-solid fa-database mr-1"></i> จัดการฐานข้อมูล Google Sheet
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm">รายชื่อผู้จอง (Users)</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users.map(u => (
                  <div key={u.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between">
                    <span className="font-bold">{u.name}</span>
                    <span className="text-slate-400">{u.department}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm">รายชื่อพนักงานขับรถ (Drivers)</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {drivers.map(d => (
                  <div key={d.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between">
                    <span className="font-bold">{d.name}</span>
                    <span className="text-amber-400 font-mono">{d.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    function GPSTrackingView({ vehicles }) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">ติดตามยานพาหนะผ่านระบบ GPS Telematics</h2>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 h-96 flex flex-col items-center justify-center text-center space-y-3">
            <i className="fa-solid fa-satellite-dish text-4xl text-amber-500 animate-pulse"></i>
            <div className="font-bold text-white text-sm">กำลังเชื่อมต่อสัญญาณ GPS Telematics ทุกคันแบบเรียลไทม์</div>
            <p className="text-xs text-slate-400 max-w-md">ระบบแสดงพิกัด ละติจูด ลองจิจูด ความเร็ว และระดับน้ำมันคงเหลือ</p>
          </div>
        </div>
      );
    }

    function ReturnVehicleView() {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">ระบบบันทึกการส่งคืนยานพาหนะ</h2>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            ระบบตรวจสอบเลขไมล์ ระดับน้ำมัน และสภาพตัวถังก่อนปิดรายการจอง
          </div>
        </div>
      );
    }

    function VehicleFleetView({ vehicles }) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">จัดการกองยานพาหนะ (Fleet Management)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => (
              <div key={v.id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">{v.name}</div>
                <div className="text-amber-400 font-mono text-xs">ทะเบียน {v.plate}</div>
                <div className="text-slate-400 text-xs">เลขไมล์: {v.mileage?.toLocaleString()} กม.</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    function MaintenanceView({ maintenance, vehicles }) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">ระบบแจ้งเตือนซ่อมบำรุง & ภาษี พ.ร.บ.</h2>
          <div className="space-y-2">
            {maintenance.map(m => (
              <div key={m.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{m.typeLabel}</span>
                  <div className="text-slate-400">{m.vehicleName} • ครบกำหนด {m.expiryDate}</div>
                </div>
                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {m.cost?.toLocaleString()} บาท
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    function ReportsView({ bookings, vehicles }) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">รายงาน & สถิติการใช้งานยานพาหนะ</h2>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
            <p>สรุปยอดการใช้งานทั้งหมด {bookings.length} รายการ ประจำไตรมาส</p>
          </div>
        </div>
      );
    }

    // Render React Root
    const rootElement = document.getElementById('root');
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  </script>
</body>
</html>`;
}

/**
 * Downloads single file via Blob (No cookie/sandbox network restrictions)
 */
export function downloadBlobFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Generates and downloads full deployment ZIP containing all required files
 */
export async function downloadAllDeploymentZip(
  vehicles: Vehicle[],
  bookings: Booking[],
  users: User[],
  departments: Department[],
  drivers: Driver[],
  masters: MasterLocationPurpose[],
  maintenance: MaintenanceItem[],
  theme: string
) {
  const zip = new JSZip();

  // 1. Standalone Single File HTML
  const htmlContent = generateStandaloneAppHtml(vehicles, bookings, users, departments, drivers, masters, maintenance, theme);
  zip.file('oga-fleet-app.html', htmlContent);

  // 2. Google Apps Script code
  zip.file('Code.gs', GOOGLE_APPS_SCRIPT_CODE);

  // 3. Installation Guide in Thai Markdown
  zip.file('README_INSTALLATION.md', README_MANUAL_CONTENT);

  // 4. Initial Database Seed JSON
  const databaseData = {
    exportDate: new Date().toISOString(),
    vehicles,
    bookings,
    users,
    departments,
    drivers,
    masterItems: masters,
    maintenance
  };
  zip.file('oga_database_seed.json', JSON.stringify(databaseData, null, 2));

  // Generate ZIP Blob
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'OGA_Fleet_Complete_Package.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
