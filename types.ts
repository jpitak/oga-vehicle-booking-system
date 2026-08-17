export type UserRole = 'admin' | 'approver1' | 'approver2' | 'driver' | 'user';

export interface User {
  id: string;
  employeeId?: string;
  name: string;
  department: string;
  role: UserRole;
  roleLabel: string;
  avatar: string;
  email: string;
  phone: string;
  drivingLicenseNo?: string;
  drivingLicenseExpiry?: string;
  status?: 'active' | 'inactive';
}

export interface Department {
  id: string;
  code: string;
  name: string;
  managerName?: string;
  contactPhone?: string;
  description?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'available' | 'on_trip' | 'off_duty';
  rating?: number;
  experienceYears?: number;
  avatar?: string;
}

export interface MasterLocationPurpose {
  id: string;
  category: 'destination' | 'purpose';
  name: string;
  description?: string;
  popular?: boolean;
}

export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'reserved';

export interface Vehicle {
  id: string;
  name: string;
  type: string; // รถเก๋ง, รถ SUV, รถตู้, รถกระบะ
  plate: string;
  seats: number;
  fuelType: string; // เบนซิน + แก๊ส LPG (2 เชื้อเพลิง), ดีเซล, เบนซิน, ฯลฯ
  mileage: number;
  color: string;
  image: string;
  insuranceExpiry: string;
  taxExpiry: string;
  inspectionExpiry: string;
  gasCertExpiry?: string;
  gasTankExpiry?: string;
  status: VehicleStatus;
  currentLocation?: string;
  lat?: number;
  lng?: number;
}

export type BookingStatus =
  | 'pending_dept'   // รออนุมัติหัวหน้า
  | 'pending_dir'    // รออนุมัติ ผอ.
  | 'approved'       // อนุมัติแล้ว
  | 'in_progress'    // กำลังเดินทาง
  | 'returned'       // คืนรถแล้ว
  | 'rejected';      // ปฏิเสธ

export interface Booking {
  id: string;
  bookingCode: string;
  userId: string;
  userName: string;
  userDepartment: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  vehicleImage?: string;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  destination: string;
  purpose: string;
  passengersCount: number;
  driverName: string;
  userSignature?: string;
  status: BookingStatus;
  statusLabel: string;
  
  // Approver 1 (หัวหน้างาน / ฝ่าย)
  approver1Name?: string;
  approver1Date?: string;
  approver1Note?: string;
  approver1Signature?: string;
  
  // Approver 2 (ผู้อำนวยการ / ผู้บริหาร)
  approver2Name?: string;
  approver2Date?: string;
  approver2Note?: string;
  approver2Signature?: string;
  
  // Rejection
  rejectionReason?: string;
  rejectedBy?: string;

  // Return Details
  startMileage?: number;
  returnMileage?: number;
  fuelCost?: number;
  gasCost?: number;
  returnCondition?: string;
  returnNote?: string;
  returnSignature?: string;
  returnDateActual?: string;

  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  type: string; // 'gas_cert' | 'gas_filter' | 'gas_tank' | 'gas_regulator' | 'tax' | 'act' | 'insurance' | 'oil_change' | 'brakes' | 'general' | 'custom' | etc.
  typeLabel: string;
  category?: 'gas_system' | 'documents' | 'fluids_engine' | 'brakes_tires_suspension' | 'ac_electric' | 'general';
  categoryLabel?: string;
  serviceDate?: string; // วันที่ส่งซ่อม/ตรวจเช็ค
  expiryDate: string; // วันหมดอายุ / กำหนดตรวจรอบถัดไป
  daysRemaining: number;
  status: 'critical' | 'warning' | 'normal';
  mileageRecord?: number; // เลขไมล์ที่เข้าซ่อม (กม.)
  nextMileage?: number; // เลขไมล์กำหนดครั้งถัดไป (กม.)
  serviceCenter?: string; // ศูนย์บริการ / อู่ซ่อม
  invoiceNo?: string; // เลขที่ใบเสร็จ / ใบแจ้งหนี้
  cost?: number; // ค่าใช้จ่าย (บาท)
  note?: string; // รายละเอียดงานซ่อม / หมายเหตุ
  actionStatus?: 'pending' | 'in_progress' | 'completed'; // สถานะงาน
  performedBy?: string; // ผู้บันทึก / ช่างผู้ตรวจ
  receiptUrl?: string; // รูปถ่ายใบเสร็จ / รูปงานซ่อม
  gasCertNo?: string; // เลขที่ใบรับรองวิศวกรแก๊ส
  createdAt?: string;
  updatedAt?: string;
}

export type RepairOrderStatus = 'pending' | 'in_progress' | 'completed' | 'returned';

export type RepairCategory =
  | 'general'           // ซ่อมทั่วไป
  | 'periodic_service'  // เช็คระยะ / เปลี่ยนถ่ายของเหลว
  | 'gas_system'        // ระบบแก๊ส LPG / NGV
  | 'engine_trans'      // เครื่องยนต์ & เกียร์
  | 'brake_suspension'  // เบรก / ช่วงล่าง / ยาง
  | 'ac_electrical'     // ระบบแอร์ & ไฟฟ้า
  | 'body_paint';       // ตัวถัง / สี / เคลมประกัน

export interface RepairOrder {
  id: string;
  orderCode: string; // เช่น "WO-2569-001"
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  vehicleMileage: number;
  repairCategory: RepairCategory;
  repairCategoryLabel: string;
  
  // รายละเอียดที่แจ้งส่งซ่อม / อาการเสีย
  issueDescription: string;
  
  // รายละเอียดที่แก้ไข / รายละเอียดในการซ่อม / รายการอะไหล่ที่เปลี่ยน
  repairDetails: string;
  partsReplaced?: string;
  
  // กำหนดวันเริ่ม - กำหนดวันคืนเมื่อซ่อมเสร็จ
  startDate: string;        // ว/ด/ป เวลาเริ่มส่งซ่อม
  estimatedReturnDate: string; // ว/ด/ป เวลานัดรับรถคืนเมื่อซ่อมเสร็จ
  actualReturnDate?: string;   // วันที่รับรถคืนจริง
  
  // ศูนย์บริการ / อู่ซ่อม
  garageName: string;       // ศูนย์บริการ / อู่ซ่อม
  garageContact?: string;   // เบอร์โทรศัพท์ / ผู้ติดต่ออู่
  technicianName?: string;  // ช่างผู้ดูแล / ผู้ตรวจรับ
  
  // เอกสารและค่าใช้จ่าย
  invoiceNo?: string;
  cost: number;
  paymentStatus?: 'pending' | 'paid' | 'company_billing';
  
  // ผู้ส่งซ่อม / ผู้บันทึก
  requesterName: string;
  requesterDepartment?: string;
  
  // สถานะงานซ่อม
  status: RepairOrderStatus; // 'pending' (รอส่งซ่อม), 'in_progress' (กำลังซ่อม), 'completed' (ซ่อมเสร็จ), 'returned' (รับรถคืนแล้ว)
  
  note?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeOption {
  id: string;
  name: string;
  desc: string;
  colors: [string, string, string];
  isDark?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'approval' | 'return' | 'maintenance' | 'gps';
  timestamp: string;
  read: boolean;
  bookingCode?: string;
}

export interface GPSTrackingInfo {
  vehicleId: string;
  vehicleName: string;
  plate: string;
  driver: string;
  destination: string;
  origin: string;
  currentAddress: string;
  speed: number;
  progress: number;
  updateTime: string;
  isLive: boolean;
  coordinates: { lat: number; lng: number };
  path: { lat: number; lng: number }[];
}
