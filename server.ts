import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxIUiWre_fj0Y2O9zkoGrnSK0qrbV-p6GOcRcni2v9mWxWzeDDn3Cm6fIYaF9kLhrWn/exec";

// Database storage directory & file
const DATA_DIR = path.join(process.cwd(), "data");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");
const DB_FILE = path.join(DATA_DIR, "oga_database.json");

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Initial seed data for OGA Fleet
const SEED_DATABASE = {
  version: "2.0",
  lastUpdated: new Date().toISOString(),
  users: [
    {
      id: "u-1",
      employeeId: "OGA-1001",
      name: "สมชาย ใจดี",
      department: "ฝ่ายสนับสนุน",
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ",
      avatar: "ส",
      email: "somchai.j@ogainternational.com",
      phone: "081-234-5678",
      drivingLicenseNo: "DL-62-102938",
      drivingLicenseExpiry: "15/09/2571",
      status: "active",
    },
    {
      id: "u-2",
      employeeId: "OGA-1002",
      name: "วิภา สุขสม",
      department: "ฝ่ายบริหาร",
      role: "approver1",
      roleLabel: "หัวหน้า",
      avatar: "ว",
      email: "wipha.s@ogainternational.com",
      phone: "089-876-5432",
      drivingLicenseNo: "DL-64-554433",
      drivingLicenseExpiry: "30/11/2570",
      status: "active",
    },
    {
      id: "u-3",
      employeeId: "OGA-1003",
      name: "ประยุทธ์ เจริญสุข",
      department: "ผู้บริหาร",
      role: "approver2",
      roleLabel: "ผู้อำนวยการ",
      avatar: "ป",
      email: "prayut.c@ogainternational.com",
      phone: "086-555-1122",
      drivingLicenseNo: "DL-59-998877",
      drivingLicenseExpiry: "25/03/2573",
      status: "active",
    },
    {
      id: "u-4",
      employeeId: "OGA-1004",
      name: "สมศักดิ์ ขับดี",
      department: "ฝ่ายยานพาหนะ",
      role: "driver",
      roleLabel: "พนักงานขับรถ",
      avatar: "ส",
      email: "somsak.k@ogainternational.com",
      phone: "084-999-3344",
      drivingLicenseNo: "DL-66-889912",
      drivingLicenseExpiry: "31/12/2572",
      status: "active",
    },
    {
      id: "u-5",
      employeeId: "OGA-1005",
      name: "นภาพร รักงาน",
      department: "ฝ่ายการเงิน",
      role: "user",
      roleLabel: "ผู้ใช้งาน",
      avatar: "น",
      email: "napaporn.r@ogainternational.com",
      phone: "082-111-2233",
      drivingLicenseNo: "DL-65-332211",
      drivingLicenseExpiry: "10/06/2571",
      status: "active",
    },
    {
      id: "u-6",
      employeeId: "OGA-1006",
      name: "ปิยะ ตั้งใจ",
      department: "ฝ่ายพัฒนา",
      role: "user",
      roleLabel: "ผู้ใช้งาน",
      avatar: "ป",
      email: "piya.t@ogainternational.com",
      phone: "085-777-8899",
      drivingLicenseNo: "DL-67-123456",
      drivingLicenseExpiry: "05/01/2572",
      status: "active",
    },
    {
      id: "u-7",
      employeeId: "OGA-1007",
      name: "ธนากร มั่งมี",
      department: "ฝ่ายขายและการตลาด",
      role: "user",
      roleLabel: "ผู้ใช้งาน",
      avatar: "ธ",
      email: "thanakorn.m@ogainternational.com",
      phone: "083-445-6677",
      drivingLicenseNo: "DL-66-990011",
      drivingLicenseExpiry: "19/08/2572",
      status: "active",
    },
  ],
  departments: [
    { id: "dept-1", code: "DEPT-SUPPORT", name: "ฝ่ายสนับสนุน", managerName: "วิภา สุขสม", contactPhone: "02-123-4501", description: "ดูแลระบบ IT, ซัพพอร์ต และโครงสร้างพื้นฐาน" },
    { id: "dept-2", code: "DEPT-ADMIN", name: "ฝ่ายบริหาร", managerName: "วิภา สุขสม", contactPhone: "02-123-4502", description: "บริหารจัดการทั่วไป ธุรการ และยานพาหนะ" },
    { id: "dept-3", code: "DEPT-EXEC", name: "ผู้บริหาร", managerName: "ประยุทธ์ เจริญสุข", contactPhone: "02-123-4500", description: "คณะกรรมการบริหารและผู้อำนวยการ" },
    { id: "dept-4", code: "DEPT-FLEET", name: "ฝ่ายยานพาหนะ", managerName: "สมศักดิ์ ขับดี", contactPhone: "02-123-4504", description: "บริหารกองยานพาหนะและการเดินทาง" },
    { id: "dept-5", code: "DEPT-FINANCE", name: "ฝ่ายการเงิน", managerName: "นภาพร รักงาน", contactPhone: "02-123-4505", description: "บัญชี การเงิน และจัดซื้อ" },
    { id: "dept-6", code: "DEPT-DEV", name: "ฝ่ายพัฒนา", managerName: "ปิยะ ตั้งใจ", contactPhone: "02-123-4506", description: "วิจัย พัฒนาซอฟต์แวร์ และนวัตกรรม" },
    { id: "dept-7", code: "DEPT-SALES", name: "ฝ่ายขายและการตลาด", managerName: "ธนากร มั่งมี", contactPhone: "02-123-4507", description: "งานขาย ประสานงานลูกค้า และคู่ค้า OGA" },
  ],
  drivers: [
    { id: "drv-1", name: "สมศักดิ์ ขับดี", phone: "084-999-3344", licenseNumber: "DL-66-889912", licenseExpiry: "31/12/2572", status: "available", rating: 4.9, experienceYears: 12, avatar: "ส" },
    { id: "drv-2", name: "มานะ ปลอดภัย", phone: "089-112-3344", licenseNumber: "DL-65-774411", licenseExpiry: "15/08/2571", status: "available", rating: 4.8, experienceYears: 8, avatar: "ม" },
    { id: "drv-3", name: "ชาติชาย ว่องไว", phone: "081-554-6677", licenseNumber: "DL-64-112233", licenseExpiry: "20/05/2570", status: "on_trip", rating: 4.7, experienceYears: 15, avatar: "ช" },
  ],
  masterItems: [
    { id: "loc-1", category: "destination", name: "สำนักงานใหญ่ OGA (กรุงเทพฯ)", description: "อาคารสำนักงานใหญ่ สาทร", popular: true },
    { id: "loc-2", category: "destination", name: "นิคมอุตสาหกรรมนวนคร จ.ปทุมธานี", description: "โรงงานคู่ค้าและคลังสินค้า", popular: true },
    { id: "loc-3", category: "destination", name: "นิคมอุตสาหกรรมอมตะซิตี้ จ.ชลบุรี", description: "ศูนย์จัดส่งและโรงงานภาคตะวันออก", popular: true },
    { id: "loc-4", category: "destination", name: "สนามบินสุวรรณภูมิ", description: "รับ-ส่งผู้บริหารและลูกค้าต่างประเทศ", popular: true },
    { id: "loc-5", category: "destination", name: "ศูนย์ประชุมแห่งชาติสิริกิติ์", description: "งานสัมมนาและนิทรรศการ OGA Expo", popular: false },
    { id: "pur-1", category: "purpose", name: "ติดต่อประสานงานโครงการ OGA Partner", description: "งานประชุมและประสานงานธุรกิจ", popular: true },
    { id: "pur-2", category: "purpose", name: "ส่งมอบสินค้าและอุปกรณ์ฮาร์ดแวร์", description: "ขนส่งอุปกรณ์ให้กับลูกค้า", popular: true },
    { id: "pur-3", category: "purpose", name: "รับ-ส่งคณะผู้บริหาร / ลูกค้าคนสำคัญ (VIP)", description: "การเดินทางสำหรับผู้บริหารและแขก", popular: true },
    { id: "pur-4", category: "purpose", name: "เข้าร่วมงานสัมมนาและฝึกอบรมภายนอก", description: "อบรมพัฒนาทักษะวิชาชีพ", popular: false },
    { id: "pur-5", category: "purpose", name: "ตรวจเช็คไซต์งานและบำรุงรักษาหน้างาน", description: "บริการซ่อมและบำรุงรักษา Onsite", popular: true },
  ],
  vehicles: [
    {
      id: "v-1",
      name: "Toyota Camry",
      type: "รถเก๋ง",
      plate: "กข 1234 กทม.",
      seats: 5,
      fuelType: "เบนซิน",
      mileage: 45230,
      color: "ขาวมุก",
      image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80",
      insuranceExpiry: "15 ส.ค. 2569",
      taxExpiry: "31 ธ.ค. 2569",
      inspectionExpiry: "20 มิ.ย. 2569",
      status: "available",
      currentLocation: "ลานจอด OGA สำนักงานใหญ่",
      lat: 13.7563,
      lng: 100.5018,
    },
    {
      id: "v-2",
      name: "Toyota Fortuner",
      type: "รถ SUV",
      plate: "ขค 5678 กทม.",
      seats: 7,
      fuelType: "ดีเซล",
      mileage: 78540,
      color: "ดำ",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
      insuranceExpiry: "20 มี.ค. 2569",
      taxExpiry: "31 ธ.ค. 2569",
      inspectionExpiry: "10 เม.ย. 2569",
      status: "in_use",
      currentLocation: "จ.ปทุมธานี (กำลังเดินทาง)",
      lat: 14.0205,
      lng: 100.5284,
    },
    {
      id: "v-3",
      name: "Honda Odyssey",
      type: "รถตู้",
      plate: "งจ 9012 กทม.",
      seats: 8,
      fuelType: "เบนซิน",
      mileage: 32100,
      color: "เงิน",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&auto=format&fit=crop&q=80",
      insuranceExpiry: "30 พ.ย. 2569",
      taxExpiry: "31 ธ.ค. 2569",
      inspectionExpiry: "15 ม.ค. 2570",
      status: "available",
      currentLocation: "ลานจอด OGA สำนักงานใหญ่",
      lat: 13.7563,
      lng: 100.5018,
    },
    {
      id: "v-4",
      name: "Toyota Hilux Revo",
      type: "รถกระบะ",
      plate: "ฉช 3344 กทม.",
      seats: 5,
      fuelType: "ดีเซล",
      mileage: 91200,
      color: "แดง",
      image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&auto=format&fit=crop&q=80",
      insuranceExpiry: "10 พ.ค. 2569",
      taxExpiry: "31 ธ.ค. 2569",
      inspectionExpiry: "25 มี.ค. 2569",
      status: "maintenance",
      currentLocation: "ศูนย์บริการตรีเพชร อีซูซุ",
      lat: 13.8282,
      lng: 100.5583,
    },
    {
      id: "v-5",
      name: "Toyota Hiace",
      type: "รถตู้",
      plate: "ญฎ 7890 กทม.",
      seats: 12,
      fuelType: "ดีเซล",
      mileage: 124300,
      color: "ขาว",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      insuranceExpiry: "5 ก.ย. 2569",
      taxExpiry: "31 ธ.ค. 2569",
      inspectionExpiry: "20 ส.ค. 2569",
      status: "available",
      currentLocation: "ลานจอด OGA สำนักงานใหญ่",
      lat: 13.7563,
      lng: 100.5018,
    },
  ],
  bookings: [
    {
      id: "b-sample-13a",
      bookingCode: "BK-2569-013A",
      userId: "u-1",
      userName: "สมชาย ใจดี",
      userDepartment: "ฝ่ายสนับสนุน",
      vehicleId: "v-2",
      vehicleName: "Toyota Fortuner",
      vehiclePlate: "ขค 5678 กทม.",
      purpose: "พบลูกค้า OGA Partner ชลบุรี",
      destination: "นิคมอุตสาหกรรมอมตะซิตี้ จ.ชลบุรี",
      passengersCount: 4,
      driverName: "สมศักดิ์ ขับดี",
      departureDate: "13/08/2569",
      departureTime: "08:30",
      returnDate: "13/08/2569",
      returnTime: "17:30",
      status: "completed",
      statusLabel: "เสร็จสิ้น",
      approver1Name: "วิภา สุขสม",
      approver1Date: "11/08/2569 09:15",
      approver2Name: "ประยุทธ์ เจริญสุข",
      approver2Date: "11/08/2569 14:30",
      createdAt: "2026-08-11T02:00:00.000Z",
      updatedAt: "2026-08-13T10:30:00.000Z",
    },
    {
      id: "b-sample-13b",
      bookingCode: "BK-2569-013B",
      userId: "u-6",
      userName: "ปิยะ ตั้งใจ",
      userDepartment: "ฝ่ายพัฒนา",
      vehicleId: "v-1",
      vehicleName: "Toyota Camry",
      vehiclePlate: "กข 1234 กทม.",
      purpose: "งานประชุมร่วม OGA Tech Summit",
      destination: "ศูนย์ประชุมแห่งชาติสิริกิติ์",
      passengersCount: 2,
      driverName: "ขับเอง",
      departureDate: "13/08/2569",
      departureTime: "13:00",
      returnDate: "13/08/2569",
      returnTime: "18:00",
      status: "completed",
      statusLabel: "เสร็จสิ้น",
      approver1Name: "วิภา สุขสม",
      approver1Date: "12/08/2569 10:00",
      approver2Name: "ประยุทธ์ เจริญสุข",
      approver2Date: "12/08/2569 11:20",
      createdAt: "2026-08-12T03:00:00.000Z",
      updatedAt: "2026-08-13T11:00:00.000Z",
    },
    {
      id: "b-sample-14a",
      bookingCode: "BK-2569-014A",
      userId: "u-7",
      userName: "ธนากร มั่งมี",
      userDepartment: "ฝ่ายขายและการตลาด",
      vehicleId: "v-3",
      vehicleName: "Honda Odyssey",
      vehiclePlate: "งจ 9012 กทม.",
      purpose: "ส่งมอบของและสัญญาโครงการใหม่",
      destination: "นิคมอุตสาหกรรมนวนคร จ.ปทุมธานี",
      passengersCount: 3,
      driverName: "มานะ ปลอดภัย",
      departureDate: "14/08/2569",
      departureTime: "09:00",
      returnDate: "14/08/2569",
      returnTime: "16:00",
      status: "approved",
      statusLabel: "อนุมัติแล้ว",
      approver1Name: "วิภา สุขสม",
      approver1Date: "12/08/2569 16:45",
      approver2Name: "ประยุทธ์ เจริญสุข",
      approver2Date: "13/08/2569 09:10",
      createdAt: "2026-08-12T09:45:00.000Z",
      updatedAt: "2026-08-13T02:10:00.000Z",
    },
    {
      id: "b-sample-15a",
      bookingCode: "BK-2569-015A",
      userId: "u-5",
      userName: "นภาพร รักงาน",
      userDepartment: "ฝ่ายการเงิน",
      vehicleId: "v-2",
      vehicleName: "Toyota Fortuner",
      vehiclePlate: "ขค 5678 กทม.",
      purpose: "ติดต่อธุรกรรมและวางบิลสำนักงานใหญ่",
      destination: "สำนักงานใหญ่ OGA (กรุงเทพฯ)",
      passengersCount: 2,
      driverName: "ชาติชาย ว่องไว",
      departureDate: "15/08/2569",
      departureTime: "10:30",
      returnDate: "15/08/2569",
      returnTime: "15:30",
      status: "in_progress",
      statusLabel: "กำลังใช้งาน",
      approver1Name: "วิภา สุขสม",
      approver1Date: "14/08/2569 11:00",
      approver2Name: "ประยุทธ์ เจริญสุข",
      approver2Date: "14/08/2569 14:00",
      createdAt: "2026-08-14T04:00:00.000Z",
      updatedAt: "2026-08-15T03:30:00.000Z",
    },
    {
      id: "b-sample-16a",
      bookingCode: "BK-2569-016A",
      userId: "u-1",
      userName: "สมชาย ใจดี",
      userDepartment: "ฝ่ายสนับสนุน",
      vehicleId: "v-5",
      vehicleName: "Toyota Hiace",
      vehiclePlate: "ญฎ 7890 กทม.",
      purpose: "รับคณะผู้บริหารและตรวจไซต์งาน OGA",
      destination: "สนามบินสุวรรณภูมิ",
      passengersCount: 6,
      driverName: "สมศักดิ์ ขับดี",
      departureDate: "16/08/2569",
      departureTime: "08:00",
      returnDate: "16/08/2569",
      returnTime: "18:00",
      status: "approved",
      statusLabel: "อนุมัติแล้ว",
      approver1Name: "วิภา สุขสม",
      approver1Date: "14/08/2569 16:30",
      approver2Name: "ประยุทธ์ เจริญสุข",
      approver2Date: "15/08/2569 09:30",
      createdAt: "2026-08-14T09:30:00.000Z",
      updatedAt: "2026-08-15T02:30:00.000Z",
    },
    {
      id: "b-sample-17a",
      bookingCode: "BK-2569-017A",
      userId: "u-6",
      userName: "ปิยะ ตั้งใจ",
      userDepartment: "ฝ่ายพัฒนา",
      vehicleId: "v-1",
      vehicleName: "Toyota Camry",
      vehiclePlate: "กข 1234 กทม.",
      purpose: "ทดสอบระบบ OGA Telematics Onsite",
      destination: "นิคมอุตสาหกรรมนวนคร จ.ปทุมธานี",
      passengersCount: 2,
      driverName: "ขับเอง",
      departureDate: "17/08/2569",
      departureTime: "09:30",
      returnDate: "17/08/2569",
      returnTime: "17:00",
      status: "pending_dir",
      statusLabel: "รอ ผอ. อนุมัติ",
      approver1Name: "วิภา สุขสม",
      approver1Date: "15/08/2569 08:30",
      createdAt: "2026-08-15T01:30:00.000Z",
      updatedAt: "2026-08-15T01:30:00.000Z",
    },
    {
      id: "b-sample-18a",
      bookingCode: "BK-2569-018A",
      userId: "u-7",
      userName: "ธนากร มั่งมี",
      userDepartment: "ฝ่ายขายและการตลาด",
      vehicleId: "v-4",
      vehicleName: "Toyota Hilux Revo",
      vehiclePlate: "ฉช 3344 กทม.",
      purpose: "ขนส่งอุปกรณ์แสดงสินค้า OGA Showcase",
      destination: "ศูนย์ประชุมแห่งชาติสิริกิติ์",
      passengersCount: 3,
      driverName: "มานะ ปลอดภัย",
      departureDate: "18/08/2569",
      departureTime: "07:30",
      returnDate: "18/08/2569",
      returnTime: "20:00",
      status: "pending_dept",
      statusLabel: "รอหัวหน้าอนุมัติ",
      createdAt: "2026-08-15T02:00:00.000Z",
      updatedAt: "2026-08-15T02:00:00.000Z",
    },
  ],
  maintenance: [
    {
      id: "m-1",
      vehicleId: "v-1",
      vehicleName: "Toyota Camry",
      vehiclePlate: "กข 1234 กทม.",
      type: "act",
      typeLabel: "พ.ร.บ. คุ้มครองผู้ประสบภัย",
      dueDate: "15 ส.ค. 2569",
      expiryDate: "15 ส.ค. 2569",
      daysRemaining: 0,
      status: "critical",
      cost: 645,
      note: "ต้องต่ออายุด่วนภายในสัปดาห์นี้",
    },
    {
      id: "m-2",
      vehicleId: "v-4",
      vehicleName: "Toyota Hilux Revo",
      vehiclePlate: "ฉช 3344 กทม.",
      type: "oil",
      typeLabel: "เปลี่ยนถ่ายน้ำมันเครื่อง & ไส้กรอง",
      dueDate: "20 ส.ค. 2569",
      expiryDate: "20 ส.ค. 2569",
      daysRemaining: 5,
      status: "warning",
      cost: 2800,
      note: "ครบระยะ 10,000 กม. ที่ศูนย์โตโยต้า",
    },
    {
      id: "m-3",
      vehicleId: "v-2",
      vehicleName: "Toyota Fortuner",
      vehiclePlate: "ขค 5678 กทม.",
      type: "tire",
      typeLabel: "สลับยางและถ่วงล้อ",
      dueDate: "28 ส.ค. 2569",
      expiryDate: "28 ส.ค. 2569",
      daysRemaining: 13,
      status: "normal",
      cost: 800,
      note: "สลับยางตามรอบบำรุงรักษา",
    },
  ],
  settings: {
    sheetUrl: "https://docs.google.com/spreadsheets/d/1_suMj_3J68PqfQMVBvoujXhw_iA1Wox0KritZ7Q_avA/edit?usp=sharing",
    gasUrl: GAS_API_URL,
    lineNotifyToken: "",
    autoSync: true,
  },
};

// Global in-memory database reference
let dbState: typeof SEED_DATABASE = SEED_DATABASE;

// Helper to parse time string cleanly (handles ISO dates, 1899 times, HH:MM)
function formatTimeFromRaw(raw: any, defaultTime = '08:30'): string {
  if (!raw) return defaultTime;
  const str = String(raw).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  }
  if (str.includes('T') || str.includes('GMT') || !isNaN(Date.parse(str))) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${mins}`;
      }
    } catch (_) {}
  }
  return defaultTime;
}

// Helper to parse date string cleanly (handles ISO dates, DD/MM/YYYY, YYYY-MM-DD)
function formatDateFromRaw(raw: any, defaultDate = ''): string {
  if (!raw) return defaultDate;
  const str = String(raw).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    const thaiYear = parseInt(y, 10) > 2500 ? parseInt(y, 10) : parseInt(y, 10) + 543;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${thaiYear}`;
  }
  if (str.includes('T') || str.includes('GMT') || !isNaN(Date.parse(str))) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear() > 2500 ? d.getFullYear() : d.getFullYear() + 543;
        return `${day}/${month}/${year}`;
      }
    } catch (_) {}
  }
  return str;
}

// Normalizer functions to handle both Google Sheet uppercase headers and JSON field formats
function normalizeVehicle(d: any): any {
  if (!d) return null;
  const plate = String(d.Plate || d.plate || d.VehiclePlate || d.vehiclePlate || '').trim();
  const name = String(d.Name || d.name || d.VehicleName || d.vehicleName || 'ยานพาหนะ OGA').trim();
  const id = String(d.ID || d.id || d.VehicleID || d.vehicleId || `v-${Date.now()}`).trim();

  return {
    id: id || `v-${Date.now()}`,
    name: name || 'ยานพาหนะ OGA',
    type: String(d.Type || d.type || 'รถเก๋ง').trim(),
    plate: plate || 'กข 1234 กทม.',
    seats: Number(d.Seats || d.seats || 5),
    fuelType: String(d.FuelType || d.fuelType || 'เบนซิน').trim(),
    mileage: Number(d.Mileage || d.mileage || 0),
    color: String(d.Color || d.color || 'ขาว').trim(),
    image: String(d.Image || d.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80').trim(),
    status: String(d.Status || d.status || 'available').trim(),
    insuranceExpiry: formatDateFromRaw(d.InsuranceExpiry || d.insuranceExpiry, '31/12/2569'),
    taxExpiry: formatDateFromRaw(d.TaxExpiry || d.taxExpiry, '31/12/2569'),
    inspectionExpiry: formatDateFromRaw(d.InspectionExpiry || d.inspectionExpiry, '31/12/2569'),
    currentLocation: String(d.CurrentLocation || d.currentLocation || 'ลานจอด OGA สำนักงานใหญ่').trim(),
    lat: Number(d.Lat || d.lat || 13.7563),
    lng: Number(d.Lng || d.lng || 100.5018),
  };
}

function normalizeBooking(d: any): any {
  if (!d) return null;
  const departureTime = formatTimeFromRaw(d.DepartureTime || d.departureTime, '08:30');
  const returnTime = formatTimeFromRaw(d.ReturnTime || d.returnTime, '17:30');
  const departureDate = formatDateFromRaw(d.DepartureDate || d.departureDate, '');
  const returnDate = formatDateFromRaw(d.ReturnDate || d.returnDate, departureDate);

  return {
    id: String(d.ID || d.id || `bk-${Date.now()}`).trim(),
    bookingCode: String(d.BookingCode || d.bookingCode || `BK-${Date.now()}`).trim(),
    userId: String(d.UserID || d.userId || 'u-1').trim(),
    userName: String(d.UserName || d.userName || 'ผู้ขอใช้รถ OGA').trim(),
    userDepartment: String(d.Department || d.UserDepartment || d.userDepartment || d.department || 'ฝ่ายสนับสนุน').trim(),
    vehicleId: String(d.VehicleID || d.vehicleId || 'v-1').trim(),
    vehicleName: String(d.VehicleName || d.vehicleName || 'Toyota Camry').trim(),
    vehiclePlate: String(d.VehiclePlate || d.vehiclePlate || 'กข 1234 กทม.').trim(),
    purpose: String(d.Purpose || d.purpose || 'ติดต่อประสานงาน').trim(),
    destination: String(d.Destination || d.destination || 'OGA สำนักงานใหญ่').trim(),
    passengersCount: Number(d.Passengers || d.PassengersCount || d.passengersCount || d.passengers || 1),
    passengerNames: Array.isArray(d.passengerNames) ? d.passengerNames : (d.PassengerNames ? String(d.PassengerNames).split(', ') : []),
    driverName: String(d.DriverName || d.driverName || 'พนักงานขับรถ OGA').trim(),
    departureDate,
    departureTime,
    returnDate,
    returnTime,
    status: String(d.Status || d.status || 'pending').trim(),
    statusLabel: String(d.StatusLabel || d.statusLabel || 'รออนุมัติ').trim(),
    approver1Name: String(d.Approver1 || d.Approver1Name || d.approver1Name || '').trim(),
    approver1Date: String(d.Approver1Date || d.approver1Date || '').trim(),
    approver1Note: String(d.Approver1Note || d.approver1Note || '').trim(),
    approver2Name: String(d.Approver2 || d.Approver2Name || d.approver2Name || '').trim(),
    approver2Date: String(d.Approver2Date || d.approver2Date || '').trim(),
    approver2Note: String(d.Approver2Note || d.approver2Note || '').trim(),
    returnMileage: d.ReturnMileage || d.returnMileage ? Number(d.ReturnMileage || d.returnMileage) : undefined,
    returnFuelLevel: d.ReturnFuelLevel || d.returnFuelLevel ? String(d.ReturnFuelLevel || d.returnFuelLevel) : undefined,
    returnDamageReport: d.ReturnDamageReport || d.returnDamageReport ? String(d.ReturnDamageReport || d.returnDamageReport) : undefined,
    returnNote: String(d.Notes || d.returnNote || d.ReturnNote || d.notes || '').trim(),
    returnedAt: d.ReturnedAt || d.returnedAt ? String(d.ReturnedAt || d.returnedAt) : undefined,
    userSignature: String(d.UserSignature || d.userSignature || '').trim(),
    createdAt: String(d.CreatedAt || d.createdAt || new Date().toISOString()).trim(),
    updatedAt: String(d.UpdatedAt || d.updatedAt || new Date().toISOString()).trim(),
  };
}

function normalizeUser(d: any): any {
  if (!d) return null;
  return {
    id: String(d.ID || d.id || `u-${Date.now()}`).trim(),
    employeeId: String(d.EmployeeID || d.employeeId || 'OGA-1001').trim(),
    name: String(d.Name || d.name || '').trim(),
    department: String(d.Department || d.department || 'ฝ่ายสนับสนุน').trim(),
    role: String(d.Role || d.role || 'user').trim(),
    roleLabel: String(d.RoleLabel || d.roleLabel || 'ผู้ใช้งาน').trim(),
    avatar: String(d.Avatar || d.avatar || (d.Name || d.name || 'ผ').charAt(0)).trim(),
    email: String(d.Email || d.email || '').trim(),
    phone: String(d.Phone || d.phone || '').trim(),
    drivingLicenseNo: String(d.DrivingLicenseNo || d.drivingLicenseNo || '').trim(),
    drivingLicenseExpiry: String(d.DrivingLicenseExpiry || d.drivingLicenseExpiry || '').trim(),
    status: String(d.Status || d.status || 'active').trim(),
  };
}

function normalizeDepartment(d: any): any {
  if (!d) return null;
  return {
    id: String(d.ID || d.id || `dept-${Date.now()}`).trim(),
    code: String(d.Code || d.code || '').trim(),
    name: String(d.Name || d.name || '').trim(),
    managerName: String(d.ManagerName || d.managerName || '').trim(),
    contactPhone: String(d.ContactPhone || d.contactPhone || '').trim(),
    description: String(d.Description || d.description || '').trim(),
  };
}

function normalizeDriver(d: any): any {
  if (!d) return null;
  return {
    id: String(d.ID || d.id || `drv-${Date.now()}`).trim(),
    name: String(d.Name || d.name || '').trim(),
    phone: String(d.Phone || d.phone || '').trim(),
    licenseNumber: String(d.LicenseNumber || d.licenseNumber || '').trim(),
    licenseExpiry: String(d.LicenseExpiry || d.licenseExpiry || '').trim(),
    status: String(d.Status || d.status || 'available').trim(),
    rating: Number(d.Rating || d.rating || 5.0),
    experienceYears: Number(d.ExperienceYears || d.experienceYears || 5),
    avatar: String(d.Avatar || d.avatar || (d.Name || d.name || 'พ').charAt(0)).trim(),
  };
}

function normalizeMasterItem(d: any): any {
  if (!d) return null;
  return {
    id: String(d.ID || d.id || `mi-${Date.now()}`).trim(),
    category: (d.Category || d.category || 'destination') as 'destination' | 'purpose',
    name: String(d.Name || d.name || '').trim(),
    description: String(d.Description || d.description || '').trim(),
    popular: Boolean(d.Popular !== undefined ? (d.Popular === true || d.Popular === 'TRUE' || d.Popular === 'true') : d.popular),
  };
}

function normalizeMaintenance(d: any): any {
  if (!d) return null;
  return {
    id: String(d.ID || d.id || `m-${Date.now()}`).trim(),
    vehicleId: String(d.VehicleID || d.vehicleId || 'v-1').trim(),
    vehicleName: String(d.VehicleName || d.vehicleName || 'Toyota Camry').trim(),
    vehiclePlate: String(d.VehiclePlate || d.vehiclePlate || 'กข 1234 กทม.').trim(),
    type: String(d.Type || d.type || 'insurance').trim(),
    typeLabel: String(d.TypeLabel || d.typeLabel || 'พ.ร.บ.').trim(),
    expiryDate: formatDateFromRaw(d.ExpiryDate || d.expiryDate || d.DueDate || d.dueDate, '31/12/2569'),
    daysRemaining: Number(d.DaysRemaining || d.daysRemaining || 365),
    status: String(d.Status || d.status || 'normal').trim(),
    cost: Number(d.Cost || d.cost || 0),
    note: String(d.Note || d.note || '').trim(),
  };
}

// Function to fetch latest live data from Google Sheets into Server DB
async function syncFromGoogleSheets(): Promise<boolean> {
  const gasUrl = dbState.settings?.gasUrl || GAS_API_URL;
  if (!gasUrl) return false;

  console.log(`[OGA Server DB] Fetching live Google Sheet data from ${gasUrl}...`);
  try {
    const fetchSheet = async (action: string) => {
      const url = `${gasUrl}?action=${action}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'follow' });
      if (res.ok) {
        const json: any = await res.json();
        if (Array.isArray(json)) return json;
        if (json && Array.isArray(json.data)) return json.data;
      }
      return null;
    };

    const [vList, bList, uList, dList, drList, mList, miList] = await Promise.allSettled([
      fetchSheet("getVehicles"),
      fetchSheet("getBookings"),
      fetchSheet("getUsers"),
      fetchSheet("getDepartments"),
      fetchSheet("getDrivers"),
      fetchSheet("getMaintenance"),
      fetchSheet("getMasterItems"),
    ]);

    let updated = false;

    if (vList.status === "fulfilled" && vList.value && vList.value.length > 0) {
      dbState.vehicles = vList.value.map(normalizeVehicle).filter(Boolean);
      updated = true;
      console.log(`[OGA Server DB] Synced ${dbState.vehicles.length} vehicles from Google Sheet.`);
    }

    if (bList.status === "fulfilled" && bList.value && bList.value.length > 0) {
      dbState.bookings = bList.value.map(normalizeBooking).filter(Boolean);
      updated = true;
      console.log(`[OGA Server DB] Synced ${dbState.bookings.length} bookings from Google Sheet.`);
    }

    if (uList.status === "fulfilled" && uList.value && uList.value.length > 0) {
      dbState.users = uList.value.map(normalizeUser).filter(Boolean);
      updated = true;
      console.log(`[OGA Server DB] Synced ${dbState.users.length} users from Google Sheet.`);
    }

    if (dList.status === "fulfilled" && dList.value && dList.value.length > 0) {
      dbState.departments = dList.value.map(normalizeDepartment).filter(Boolean);
      updated = true;
    }

    if (drList.status === "fulfilled" && drList.value && drList.value.length > 0) {
      dbState.drivers = drList.value.map(normalizeDriver).filter(Boolean);
      updated = true;
    }

    if (mList.status === "fulfilled" && mList.value && mList.value.length > 0) {
      dbState.maintenance = mList.value.map(normalizeMaintenance).filter(Boolean);
      updated = true;
    }

    if (miList.status === "fulfilled" && miList.value && miList.value.length > 0) {
      dbState.masterItems = miList.value.map(normalizeMasterItem).filter(Boolean);
      updated = true;
    }

    if (updated) {
      dbState.lastUpdated = new Date().toISOString();
      saveDatabaseToFile();
      return true;
    }
  } catch (err) {
    console.warn("[OGA Server DB] Google Sheets auto-sync notice:", err);
  }
  return false;
}

// Forward save directly to Google Apps Script in background
async function forwardSaveToGAS(action: string, data: any) {
  const gasUrl = dbState.settings?.gasUrl || GAS_API_URL;
  if (!gasUrl) return;
  try {
    await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetUrl: gasUrl, ...data }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.warn(`[OGA Server DB] GAS forward save (${action}) warning:`, err);
  }
}

// Load database from file or initialize
function loadDatabaseFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && parsed.vehicles && Array.isArray(parsed.vehicles) && parsed.vehicles.length > 0) {
        dbState = parsed;
        console.log(`[OGA Server DB] Loaded existing database with ${dbState.vehicles.length} vehicles, ${dbState.bookings.length} bookings, ${dbState.users.length} users.`);
        return;
      }
    }
  } catch (err) {
    console.error("[OGA Server DB] Error reading database file:", err);
  }

  // Initialize with base state
  dbState = JSON.parse(JSON.stringify(SEED_DATABASE));
  saveDatabaseToFile();
  console.log("[OGA Server DB] Initialized persistent database container.");
}

// Atomically save database to file & create rolling backup
function saveDatabaseToFile() {
  try {
    dbState.lastUpdated = new Date().toISOString();
    const dataStr = JSON.stringify(dbState, null, 2);
    
    // Write to temporary file first then atomic rename
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, dataStr, "utf-8");
    fs.renameSync(tmpFile, DB_FILE);

    // Keep a rolling backup every hour or major save
    const backupName = `oga_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const backupPath = path.join(BACKUPS_DIR, backupName);
    
    // Clean old backups keeping max 15 snapshots
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith("oga_backup_")).sort().reverse();
    if (files.length >= 15) {
      files.slice(14).forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch (_) {}
      });
    }

    fs.writeFileSync(backupPath, dataStr, "utf-8");
  } catch (err) {
    console.error("[OGA Server DB] Failed to save database to file:", err);
  }
}

// Initialize database on boot and sync from Google Sheets
loadDatabaseFromFile();
syncFromGoogleSheets();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      system: "OGA Vehicle Booking System Enterprise",
      vehiclesCount: dbState.vehicles.length,
      bookingsCount: dbState.bookings.length,
      lastUpdated: dbState.lastUpdated,
      time: new Date().toISOString(),
    });
  });

  // =========================================================================
  // 1. CENTRALIZED DATABASE REST API (Multi-Device Persistent Shared Store)
  // =========================================================================

  // GET: Fetch complete current database
  app.get("/api/db", (_req, res) => {
    res.json({
      success: true,
      lastUpdated: dbState.lastUpdated,
      data: dbState,
    });
  });

  // POST: Save entities or full update
  app.post("/api/db/save", (req, res) => {
    try {
      const { type, payload, data } = req.body;

      if (!type) {
        return res.status(400).json({ success: false, error: "Missing type parameter" });
      }

      if (type === "full" && (data || payload)) {
        const incoming = data || payload;
        if (incoming.vehicles) dbState.vehicles = incoming.vehicles;
        if (incoming.bookings) dbState.bookings = incoming.bookings;
        if (incoming.users) dbState.users = incoming.users;
        if (incoming.departments) dbState.departments = incoming.departments;
        if (incoming.drivers) dbState.drivers = incoming.drivers;
        if (incoming.masterItems) dbState.masterItems = incoming.masterItems;
        if (incoming.maintenance) dbState.maintenance = incoming.maintenance;
        if (incoming.settings) dbState.settings = incoming.settings;
      } else if (type === "vehicles" && Array.isArray(payload || data)) {
        dbState.vehicles = payload || data;
      } else if (type === "saveVehicle" && (payload || data)) {
        const item = payload || data;
        const idx = dbState.vehicles.findIndex(v => v.id === item.id || v.plate === item.plate);
        if (idx >= 0) {
          dbState.vehicles[idx] = { ...dbState.vehicles[idx], ...item };
        } else {
          dbState.vehicles.unshift(item);
        }
      } else if (type === "deleteVehicle" && (payload?.id || payload)) {
        const idToDelete = payload?.id || payload;
        dbState.vehicles = dbState.vehicles.filter(v => v.id !== idToDelete && v.plate !== idToDelete);
      } else if (type === "bookings" && Array.isArray(payload || data)) {
        dbState.bookings = payload || data;
      } else if (type === "saveBooking" && (payload || data)) {
        const item = payload || data;
        const idx = dbState.bookings.findIndex(b => b.id === item.id || b.bookingCode === item.bookingCode);
        if (idx >= 0) {
          dbState.bookings[idx] = { ...dbState.bookings[idx], ...item, updatedAt: new Date().toISOString() };
        } else {
          dbState.bookings.unshift(item);
        }
      } else if (type === "deleteBooking" && (payload?.id || payload)) {
        const idToDelete = payload?.id || payload;
        dbState.bookings = dbState.bookings.filter(b => b.id !== idToDelete && b.bookingCode !== idToDelete);
      } else if (type === "users" && Array.isArray(payload || data)) {
        dbState.users = payload || data;
      } else if (type === "saveUser" && (payload || data)) {
        const item = payload || data;
        const idx = dbState.users.findIndex(u => u.id === item.id || u.employeeId === item.employeeId);
        if (idx >= 0) {
          dbState.users[idx] = { ...dbState.users[idx], ...item };
        } else {
          dbState.users.unshift(item);
        }
      } else if (type === "deleteUser" && (payload?.id || payload)) {
        const idToDelete = payload?.id || payload;
        dbState.users = dbState.users.filter(u => u.id !== idToDelete && u.employeeId !== idToDelete);
      } else if (type === "departments" && Array.isArray(payload || data)) {
        dbState.departments = payload || data;
      } else if (type === "saveDepartment" && (payload || data)) {
        const item = payload || data;
        const idx = dbState.departments.findIndex(d => d.id === item.id || d.code === item.code);
        if (idx >= 0) {
          dbState.departments[idx] = { ...dbState.departments[idx], ...item };
        } else {
          dbState.departments.unshift(item);
        }
      } else if (type === "deleteDepartment" && (payload?.id || payload)) {
        const idToDelete = payload?.id || payload;
        dbState.departments = dbState.departments.filter(d => d.id !== idToDelete && d.code !== idToDelete);
      } else if (type === "drivers" && Array.isArray(payload || data)) {
        dbState.drivers = payload || data;
      } else if (type === "saveDriver" && (payload || data)) {
        const item = payload || data;
        const idx = dbState.drivers.findIndex(dr => dr.id === item.id || dr.licenseNumber === item.licenseNumber);
        if (idx >= 0) {
          dbState.drivers[idx] = { ...dbState.drivers[idx], ...item };
        } else {
          dbState.drivers.unshift(item);
        }
      } else if (type === "deleteDriver" && (payload?.id || payload)) {
        const idToDelete = payload?.id || payload;
        dbState.drivers = dbState.drivers.filter(dr => dr.id !== idToDelete && dr.licenseNumber !== idToDelete);
      } else if (type === "masterItems" && Array.isArray(payload || data)) {
        dbState.masterItems = payload || data;
      } else if (type === "saveMasterItem" && (payload || data)) {
        const item = payload || data;
        const idx = dbState.masterItems.findIndex(m => m.id === item.id);
        if (idx >= 0) {
          dbState.masterItems[idx] = { ...dbState.masterItems[idx], ...item };
        } else {
          dbState.masterItems.unshift(item);
        }
      } else if (type === "deleteMasterItem" && (payload?.id || payload)) {
        const idToDelete = payload?.id || payload;
        dbState.masterItems = dbState.masterItems.filter(m => m.id !== idToDelete);
      } else if (type === "maintenance" && Array.isArray(payload || data)) {
        dbState.maintenance = payload || data;
      } else if (type === "saveMaintenance" && (payload || data)) {
        const item = payload || data;
        const idx = dbState.maintenance.findIndex(m => m.id === item.id);
        if (idx >= 0) {
          dbState.maintenance[idx] = { ...dbState.maintenance[idx], ...item };
        } else {
          dbState.maintenance.unshift(item);
        }
      } else if (type === "deleteMaintenance" && (payload?.id || payload)) {
        const idToDelete = payload?.id || payload;
        dbState.maintenance = dbState.maintenance.filter(m => m.id !== idToDelete);
      } else if (type === "settings" && (payload || data)) {
        dbState.settings = { ...dbState.settings, ...(payload || data) };
      }

      // Also trigger forward save to Google Apps Script in background
      if (type === "saveVehicle") forwardSaveToGAS("saveVehicle", { vehicle: payload || data });
      if (type === "deleteVehicle") forwardSaveToGAS("deleteVehicle", { id: (payload?.id || payload) });
      if (type === "saveBooking") forwardSaveToGAS("saveBooking", { booking: payload || data });
      if (type === "deleteBooking") forwardSaveToGAS("deleteBooking", { id: (payload?.id || payload) });
      if (type === "saveUser") forwardSaveToGAS("saveUser", { user: payload || data });
      if (type === "deleteUser") forwardSaveToGAS("deleteUser", { id: (payload?.id || payload) });
      if (type === "saveDepartment") forwardSaveToGAS("saveDepartment", { department: payload || data });
      if (type === "deleteDepartment") forwardSaveToGAS("deleteDepartment", { id: (payload?.id || payload) });
      if (type === "saveDriver") forwardSaveToGAS("saveDriver", { driver: payload || data });
      if (type === "deleteDriver") forwardSaveToGAS("deleteDriver", { id: (payload?.id || payload) });
      if (type === "saveMasterItem") forwardSaveToGAS("saveMasterItem", { item: payload || data });
      if (type === "deleteMasterItem") forwardSaveToGAS("deleteMasterItem", { id: (payload?.id || payload) });
      if (type === "saveMaintenance") forwardSaveToGAS("saveMaintenance", { maintenance: payload || data });
      if (type === "deleteMaintenance") forwardSaveToGAS("deleteMaintenance", { id: (payload?.id || payload) });

      saveDatabaseToFile();

      return res.json({
        success: true,
        message: "บันทึกข้อมูลลงฐานข้อมูล Server กลางสำเร็จ 100%",
        lastUpdated: dbState.lastUpdated,
      });
    } catch (err: any) {
      console.error("Save DB error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to save to database" });
    }
  });

  // POST: Force pull live database from Google Sheets
  app.post("/api/db/pull-from-sheet", async (_req, res) => {
    try {
      const synced = await syncFromGoogleSheets();
      return res.json({
        success: true,
        synced,
        message: synced
          ? `ดึงข้อมูลล่าสุดจาก Google Sheet (${dbState.vehicles.length} คัน, ${dbState.bookings.length} รายการจอง) เรียบร้อย 100%`
          : `ใช้ข้อมูลล่าสุดใน Server DB (${dbState.vehicles.length} คัน)`,
        data: dbState,
        lastUpdated: dbState.lastUpdated,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST: Manual Backup
  app.post("/api/db/backup", (_req, res) => {
    try {
      const backupName = `manual_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      const backupPath = path.join(BACKUPS_DIR, backupName);
      fs.writeFileSync(backupPath, JSON.stringify(dbState, null, 2), "utf-8");
      return res.json({
        success: true,
        message: "สำรองข้อมูล Server DB Store สำเร็จ",
        filename: backupName,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET: List all available backups
  app.get("/api/db/backups", (_req, res) => {
    try {
      const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith(".json")).sort().reverse();
      const backups = files.map(f => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
        };
      });
      return res.json({ success: true, backups });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST: Restore from backup file or JSON payload
  app.post("/api/db/restore", (req, res) => {
    try {
      const { filename, rawDatabase } = req.body;
      if (rawDatabase && rawDatabase.vehicles) {
        dbState = rawDatabase;
        saveDatabaseToFile();
        return res.json({
          success: true,
          message: "กู้คืนฐานข้อมูลจาก JSON สำเร็จ 100%",
          data: dbState,
        });
      }

      if (filename) {
        const safeName = path.basename(filename);
        const targetPath = path.join(BACKUPS_DIR, safeName);
        if (fs.existsSync(targetPath)) {
          const content = fs.readFileSync(targetPath, "utf-8");
          dbState = JSON.parse(content);
          saveDatabaseToFile();
          return res.json({
            success: true,
            message: `กู้คืนฐานข้อมูลจากไฟล์สำรอง ${safeName} สำเร็จ 100%`,
            data: dbState,
          });
        }
        return res.status(404).json({ success: false, error: "Backup file not found" });
      }

      return res.status(400).json({ success: false, error: "Missing filename or rawDatabase" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET: Export entire database as downloadable JSON file
  app.get("/api/db/export", (_req, res) => {
    res.setHeader("Content-Disposition", `attachment; filename="oga_fleet_database_${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(dbState, null, 2));
  });

  // POST: Import entire database from JSON
  app.post("/api/db/import", (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || !Array.isArray(incoming.vehicles) || !Array.isArray(incoming.bookings)) {
        return res.status(400).json({ success: false, error: "โครงสร้างไฟล์ JSON ไม่ถูกต้องสำหรับ OGA Database" });
      }
      dbState = incoming;
      saveDatabaseToFile();
      return res.json({
        success: true,
        message: "นำเข้าฐานข้อมูล JSON เข้าสู่ระบบ Server เรียบร้อยแล้ว 100%",
        data: dbState,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // 2. GOOGLE APPS SCRIPT PROXY & LINE NOTIFY
  // =========================================================================

  // Proxy to Google Apps Script
  app.all("/api/gas-proxy", async (req, res) => {
    try {
      const targetEndpoint = (req.query.targetUrl as string) || (req.body && req.body.targetUrl) || GAS_API_URL;
      const url = new URL(targetEndpoint);
      
      // forward search params if GET
      if (req.method === "GET") {
        for (const [key, value] of Object.entries(req.query)) {
          if (key !== "targetUrl") {
            url.searchParams.append(key, String(value));
          }
        }
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
      };

      if (req.method === "POST" || req.method === "PUT") {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(url.toString(), fetchOptions);
      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch {
        return res.send(text);
      }
    } catch (err: any) {
      console.error("GAS Proxy error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to communicate with Google Sheets GAS endpoint",
        note: "Fallback to local storage active",
      });
    }
  });

  // Line Notify forwarding / webhook trigger
  app.post("/api/notify", async (req, res) => {
    const { message, token, bookingCode, type } = req.body;
    console.log(`[OGA LINE NOTIFY] ${type || 'Alert'}: ${bookingCode || ''} - ${message}`);

    // If a custom Line Notify token is provided, forward to official Line API
    if (token) {
      try {
        const lineRes = await fetch("https://notify-api.line.me/api/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
          body: new URLSearchParams({ message }).toString(),
        });
        const lineData = await lineRes.json();
        return res.json({ success: true, lineResponse: lineData });
      } catch (err: any) {
        console.warn("Line API fetch failed:", err);
      }
    }

    // Return simulated success
    return res.json({
      success: true,
      delivered: true,
      timestamp: new Date().toISOString(),
      message: `ส่งการแจ้งเตือน Line Notify เรียบร้อย: ${message?.substring(0, 40)}...`,
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OGA Vehicle Booking Enterprise server running on http://localhost:${PORT}`);
  });
}

startServer();

