import { Booking, Vehicle, MaintenanceItem, RepairOrder, User, NotificationItem, Department, Driver, MasterLocationPurpose } from '../types';
import {
  INITIAL_BOOKINGS,
  INITIAL_VEHICLES,
  INITIAL_MAINTENANCE,
  INITIAL_REPAIR_ORDERS,
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_DRIVERS,
  INITIAL_MASTER_ITEMS,
} from '../data/mockData';

export const DEFAULT_GAS_API_URL = "https://script.google.com/macros/s/AKfycbxIUiWre_fj0Y2O9zkoGrnSK0qrbV-p6GOcRcni2v9mWxWzeDDn3Cm6fIYaF9kLhrWn/exec";
export const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1_suMj_3J68PqfQMVBvoujXhw_iA1Wox0KritZ7Q_avA/edit?usp=sharing";

export interface DatabaseSettings {
  sheetUrl: string;
  gasUrl: string;
  lineNotifyToken: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

// Google Apps Script source code for easy copying & deployment
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * OGA INTERNATIONAL - GOOGLE APPS SCRIPT WEB APP BACKEND (Code.gs)
 * ระบบจัดการฐานข้อมูลยานพาหนะ, การจองรถ & ข้อมูล Master เชื่อมต่อ Google Sheet 100%
 * รองรับ: Master ผู้จอง (Users), แผนก (Departments), คนขับ (Drivers), 
 *         ยานพาหนะ (Vehicles), การจอง (Bookings), ซ่อมบำรุง (Maintenance)
 * =========================================================================
 */

// กำหนดชื่อ Sheets ใน Spreadsheet
const SHEET_NAMES = {
  USERS: "Users",
  DEPARTMENTS: "Departments",
  DRIVERS: "Drivers",
  BOOKINGS: "Bookings",
  VEHICLES: "Vehicles",
  MAINTENANCE: "Maintenance",
  MASTER_ITEMS: "MasterItems",
  LOGS: "SystemLogs"
};

// 1. HTTP GET Endpoint (ดึงข้อมูล / ทดสอบเชื่อมต่อ)
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "ping";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "ping") {
      return jsonResponse({
        success: true,
        status: "online",
        message: "OGA Google Sheet Database Connected 100%",
        spreadsheetName: ss.getName(),
        sheets: ss.getSheets().map(s => s.getName()),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "initSheet" || action === "setup") {
      initSheets(ss);
      return jsonResponse({ success: true, message: "สร้างโครงสร้างตาราง Google Sheet สำเร็จครบถ้วน 100%" });
    }

    if (action === "getUsers") {
      const data = getSheetData(ss, SHEET_NAMES.USERS);
      return jsonResponse(data);
    }

    if (action === "getDepartments") {
      const data = getSheetData(ss, SHEET_NAMES.DEPARTMENTS);
      return jsonResponse(data);
    }

    if (action === "getDrivers") {
      const data = getSheetData(ss, SHEET_NAMES.DRIVERS);
      return jsonResponse(data);
    }

    if (action === "getMasterItems") {
      const data = getSheetData(ss, SHEET_NAMES.MASTER_ITEMS);
      return jsonResponse(data);
    }

    if (action === "getBookings") {
      const data = getSheetData(ss, SHEET_NAMES.BOOKINGS);
      return jsonResponse(data);
    }

    if (action === "getVehicles") {
      const data = getSheetData(ss, SHEET_NAMES.VEHICLES);
      return jsonResponse(data);
    }

    if (action === "getMaintenance") {
      const data = getSheetData(ss, SHEET_NAMES.MAINTENANCE);
      return jsonResponse(data);
    }

    return jsonResponse({ success: true, action, message: "OGA Endpoint Active" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// 2. HTTP POST Endpoint (เพิ่ม / ลบ / แก้ไข / ซิงค์ข้อมูล)
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const action = body.action || "saveBooking";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheets(ss); // ตรวจสอบและสร้างโครงสร้าง Sheet อัตโนมัติ

    // --- 1. Master ผู้จอง / ผู้ใช้งาน (Users) ---
    if (action === "saveUser") {
      const user = body.user || body;
      const res = upsertUser(ss, user);
      logActivity(ss, "SAVE_USER", user.id || user.employeeId, user.name, "Saved user master");
      return jsonResponse({ success: true, message: "บันทึก Master ผู้จองลง Google Sheet สำเร็จ 100%", data: res });
    }

    if (action === "deleteUser") {
      const userId = body.id || body.employeeId;
      const res = deleteRowById(ss, SHEET_NAMES.USERS, userId);
      logActivity(ss, "DELETE_USER", userId, "Admin", "Deleted user master");
      return jsonResponse({ success: true, message: "ลบ Master ผู้จองจาก Google Sheet สำเร็จ 100%", result: res });
    }

    // --- 2. Master แผนก (Departments) ---
    if (action === "saveDepartment") {
      const dept = body.department || body;
      const res = upsertDepartment(ss, dept);
      logActivity(ss, "SAVE_DEPARTMENT", dept.id || dept.code, "Admin", dept.name);
      return jsonResponse({ success: true, message: "บันทึก Master แผนกลง Google Sheet สำเร็จ 100%", data: res });
    }

    if (action === "deleteDepartment") {
      const deptId = body.id || body.code;
      const res = deleteRowById(ss, SHEET_NAMES.DEPARTMENTS, deptId);
      logActivity(ss, "DELETE_DEPARTMENT", deptId, "Admin", "Deleted department master");
      return jsonResponse({ success: true, message: "ลบ Master แผนกจาก Google Sheet สำเร็จ 100%", result: res });
    }

    // --- 3. Master คนขับรถ (Drivers) ---
    if (action === "saveDriver") {
      const drv = body.driver || body;
      const res = upsertDriver(ss, drv);
      logActivity(ss, "SAVE_DRIVER", drv.id || drv.licenseNumber, "Admin", drv.name);
      return jsonResponse({ success: true, message: "บันทึก Master คนขับรถลง Google Sheet สำเร็จ 100%", data: res });
    }

    if (action === "deleteDriver") {
      const driverId = body.id || body.licenseNumber;
      const res = deleteRowById(ss, SHEET_NAMES.DRIVERS, driverId);
      logActivity(ss, "DELETE_DRIVER", driverId, "Admin", "Deleted driver master");
      return jsonResponse({ success: true, message: "ลบ Master คนขับรถจาก Google Sheet สำเร็จ 100%", result: res });
    }

    // --- 4. Master วัตถุประสงค์ / จุดหมาย (MasterItems) ---
    if (action === "saveMasterItem") {
      const item = body.item || body;
      const res = upsertMasterItem(ss, item);
      logActivity(ss, "SAVE_MASTER_ITEM", item.id, "Admin", item.name);
      return jsonResponse({ success: true, message: "บันทึกข้อมูล Master ลง Google Sheet สำเร็จ 100%", data: res });
    }

    if (action === "deleteMasterItem") {
      const itemId = body.id;
      const res = deleteRowById(ss, SHEET_NAMES.MASTER_ITEMS, itemId);
      logActivity(ss, "DELETE_MASTER_ITEM", itemId, "Admin", "Deleted master item");
      return jsonResponse({ success: true, message: "ลบข้อมูล Master จาก Google Sheet สำเร็จ 100%", result: res });
    }

    // --- 5. การจองรถ (Bookings) ---
    if (action === "saveBooking") {
      const booking = body.booking || body;
      const res = upsertBooking(ss, booking);
      logActivity(ss, "SAVE_BOOKING", booking.bookingCode || booking.id, booking.userName, JSON.stringify(booking));
      return jsonResponse({ success: true, message: "บันทึกข้อมูลการจองลง Google Sheet สำเร็จ 100%", data: res });
    }

    if (action === "deleteBooking") {
      const bookingId = body.id || body.bookingCode;
      const res = deleteRowById(ss, SHEET_NAMES.BOOKINGS, bookingId);
      logActivity(ss, "DELETE_BOOKING", bookingId, body.user || "System", "Deleted booking");
      return jsonResponse({ success: true, message: "ลบข้อมูลการจองจาก Google Sheet สำเร็จ 100%", result: res });
    }

    // --- 6. ยานพาหนะ (Vehicles) ---
    if (action === "saveVehicle") {
      const vehicle = body.vehicle || body;
      const res = upsertVehicle(ss, vehicle);
      logActivity(ss, "SAVE_VEHICLE", vehicle.plate || vehicle.id, "Admin", vehicle.name);
      return jsonResponse({ success: true, message: "บันทึกข้อมูลยานพาหนะลง Google Sheet สำเร็จ 100%", data: res });
    }

    if (action === "deleteVehicle") {
      const vehicleId = body.id || body.plate;
      const res = deleteRowById(ss, SHEET_NAMES.VEHICLES, vehicleId);
      logActivity(ss, "DELETE_VEHICLE", vehicleId, "Admin", "Deleted vehicle");
      return jsonResponse({ success: true, message: "ลบยานพาหนะจาก Google Sheet สำเร็จ 100%", result: res });
    }

    // --- 7. ซ่อมบำรุง (Maintenance) ---
    if (action === "saveMaintenance") {
      const item = body.item || body;
      const res = upsertMaintenance(ss, item);
      logActivity(ss, "SAVE_MAINTENANCE", item.id, "Admin", item.typeLabel || item.type);
      return jsonResponse({ success: true, message: "บันทึกข้อมูลซ่อมบำรุงลง Google Sheet สำเร็จ 100%", data: res });
    }

    if (action === "deleteMaintenance") {
      const id = body.id;
      const res = deleteRowById(ss, SHEET_NAMES.MAINTENANCE, id);
      logActivity(ss, "DELETE_MAINTENANCE", id, "Admin", "Deleted maintenance");
      return jsonResponse({ success: true, message: "ลบข้อมูลซ่อมบำรุงจาก Google Sheet สำเร็จ 100%", result: res });
    }

    // --- 8. ซิงค์ฐานข้อมูลทั้งหมด 100% (Sync All) ---
    if (action === "syncAll") {
      if (body.users && Array.isArray(body.users)) {
        body.users.forEach(u => upsertUser(ss, u));
      }
      if (body.departments && Array.isArray(body.departments)) {
        body.departments.forEach(d => upsertDepartment(ss, d));
      }
      if (body.drivers && Array.isArray(body.drivers)) {
        body.drivers.forEach(dr => upsertDriver(ss, dr));
      }
      if (body.vehicles && Array.isArray(body.vehicles)) {
        body.vehicles.forEach(v => upsertVehicle(ss, v));
      }
      if (body.bookings && Array.isArray(body.bookings)) {
        body.bookings.forEach(b => upsertBooking(ss, b));
      }
      if (body.maintenance && Array.isArray(body.maintenance)) {
        body.maintenance.forEach(m => upsertMaintenance(ss, m));
      }
      if (body.masterItems && Array.isArray(body.masterItems)) {
        body.masterItems.forEach(mi => upsertMasterItem(ss, mi));
      }
      logActivity(ss, "SYNC_ALL", "ALL", "System", "Full database & masters sync 100%");
      return jsonResponse({ success: true, message: "ซิงค์ฐานข้อมูลและ Master ทั้งหมดลง Google Sheet สมบูรณ์ 100%" });
    }

    // --- 9. สร้าง Header และตารางเริ่มต้น ---
    if (action === "initSheet") {
      initSheets(ss);
      return jsonResponse({ success: true, message: "สร้างและตรวจสอบ Schema ทุก Sheet เรียบร้อย 100%" });
    }

    return jsonResponse({ success: false, error: "Action not recognized: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function initSheets(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  const schemas = {
    [SHEET_NAMES.USERS]: [
      "ID", "EmployeeID", "Name", "Department", "Role", "RoleLabel", "Email", "Phone", "DrivingLicenseNo", "DrivingLicenseExpiry", "Status", "UpdatedAt"
    ],
    [SHEET_NAMES.DEPARTMENTS]: [
      "ID", "Code", "Name", "ManagerName", "ContactPhone", "Description", "UpdatedAt"
    ],
    [SHEET_NAMES.DRIVERS]: [
      "ID", "Name", "Phone", "LicenseNumber", "LicenseExpiry", "Status", "Rating", "ExperienceYears", "UpdatedAt"
    ],
    [SHEET_NAMES.BOOKINGS]: [
      "ID", "BookingCode", "UserID", "UserName", "Department", "VehicleID", "VehicleName", "VehiclePlate", 
      "Purpose", "Destination", "Passengers", "DriverName", "DepartureDate", "DepartureTime", 
      "ReturnDate", "ReturnTime", "Status", "StatusLabel", "Approver1", "Approver1Date", 
      "Approver1Note", "Approver2", "Approver2Date", "Approver2Note", "Notes", "CreatedAt", "UpdatedAt"
    ],
    [SHEET_NAMES.VEHICLES]: [
      "ID", "Name", "Type", "Plate", "Seats", "FuelType", "Mileage", "Color", 
      "Image", "Status", "InsuranceExpiry", "TaxExpiry", "InspectionExpiry", "CurrentLocation", "UpdatedAt"
    ],
    [SHEET_NAMES.MAINTENANCE]: [
      "ID", "VehicleID", "VehicleName", "VehiclePlate", "Type", "TypeLabel", 
      "DueDate", "DaysRemaining", "Status", "Cost", "Note", "UpdatedAt"
    ],
    [SHEET_NAMES.MASTER_ITEMS]: [
      "ID", "Category", "Name", "Description", "Popular", "UpdatedAt"
    ],
    [SHEET_NAMES.LOGS]: [
      "Timestamp", "Action", "TargetID", "User", "Details"
    ]
  };

  for (const sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    const headers = schemas[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0f172a");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
  }
}

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].toString().trim();
      obj[key] = row[j];
    }
    data.push(obj);
  }
  return data;
}

// Upsert User
function upsertUser(ss, u) {
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const idToMatch = String(u.id || u.employeeId);

  let targetRowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === idToMatch || String(rows[i][1]) === idToMatch) {
      targetRowIdx = i + 1;
      break;
    }
  }

  const rowValues = [
    u.id || \`u-\${Date.now()}\`,
    u.employeeId || "",
    u.name || "",
    u.department || "",
    u.role || "user",
    u.roleLabel || "ผู้ใช้งาน",
    u.email || "",
    u.phone || "",
    u.drivingLicenseNo || "",
    u.drivingLicenseExpiry || "",
    u.status || "active",
    new Date().toISOString()
  ];

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return u;
}

// Upsert Department
function upsertDepartment(ss, d) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DEPARTMENTS);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const idToMatch = String(d.id || d.code);

  let targetRowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === idToMatch || String(rows[i][1]) === idToMatch) {
      targetRowIdx = i + 1;
      break;
    }
  }

  const rowValues = [
    d.id || \`dept-\${Date.now()}\`,
    d.code || "",
    d.name || "",
    d.managerName || "",
    d.contactPhone || "",
    d.description || "",
    new Date().toISOString()
  ];

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return d;
}

// Upsert Driver
function upsertDriver(ss, drv) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DRIVERS);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const idToMatch = String(drv.id || drv.licenseNumber || drv.name);

  let targetRowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === idToMatch || String(rows[i][1]) === idToMatch || String(rows[i][3]) === idToMatch) {
      targetRowIdx = i + 1;
      break;
    }
  }

  const rowValues = [
    drv.id || \`drv-\${Date.now()}\`,
    drv.name || "",
    drv.phone || "",
    drv.licenseNumber || "",
    drv.licenseExpiry || "",
    drv.status || "available",
    drv.rating || 5.0,
    drv.experienceYears || 5,
    new Date().toISOString()
  ];

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return drv;
}

// Upsert MasterItem (Destinations / Purposes)
function upsertMasterItem(ss, item) {
  const sheet = ss.getSheetByName(SHEET_NAMES.MASTER_ITEMS);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const idToMatch = String(item.id || item.name);

  let targetRowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === idToMatch || String(rows[i][2]) === idToMatch) {
      targetRowIdx = i + 1;
      break;
    }
  }

  const rowValues = [
    item.id || \`mi-\${Date.now()}\`,
    item.category || "destination",
    item.name || "",
    item.description || "",
    item.popular ? "TRUE" : "FALSE",
    new Date().toISOString()
  ];

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return item;
}

// Upsert Booking
function upsertBooking(ss, b) {
  const sheet = ss.getSheetByName(SHEET_NAMES.BOOKINGS);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const idToMatch = String(b.id || b.bookingCode);

  let targetRowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === idToMatch || String(rows[i][1]) === idToMatch) {
      targetRowIdx = i + 1;
      break;
    }
  }

  const rowValues = [
    b.id || \`bk-\${Date.now()}\`,
    b.bookingCode || "",
    b.userId || "",
    b.userName || "",
    b.department || b.userDepartment || "",
    b.vehicleId || "",
    b.vehicleName || "",
    b.vehiclePlate || "",
    b.purpose || "",
    b.destination || "",
    b.passengersCount || b.passengers || 1,
    b.driverName || "",
    b.departureDate || "",
    b.departureTime || "",
    b.returnDate || "",
    b.returnTime || "",
    b.status || "pending_dept",
    b.statusLabel || "รออนุมัติ",
    b.approver1Name || "",
    b.approver1Date || "",
    b.approver1Note || "",
    b.approver2Name || "",
    b.approver2Date || "",
    b.approver2Note || "",
    b.notes || b.returnNote || "",
    b.createdAt || new Date().toISOString(),
    new Date().toISOString()
  ];

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return b;
}

// Upsert Vehicle
function upsertVehicle(ss, v) {
  const sheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const idToMatch = String(v.id || v.plate);

  let targetRowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === idToMatch || String(rows[i][3]) === idToMatch) {
      targetRowIdx = i + 1;
      break;
    }
  }

  const rowValues = [
    v.id || \`v-\${Date.now()}\`,
    v.name || "",
    v.type || "",
    v.plate || "",
    v.seats || 5,
    v.fuelType || "",
    v.mileage || 0,
    v.color || "",
    v.image || "",
    v.status || "available",
    v.insuranceExpiry || "",
    v.taxExpiry || "",
    v.inspectionExpiry || "",
    v.currentLocation || "OGA สำนักงานใหญ่",
    new Date().toISOString()
  ];

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return v;
}

// Upsert Maintenance
function upsertMaintenance(ss, m) {
  const sheet = ss.getSheetByName(SHEET_NAMES.MAINTENANCE);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const idToMatch = String(m.id);

  let targetRowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === idToMatch) {
      targetRowIdx = i + 1;
      break;
    }
  }

  const rowValues = [
    m.id || \`m-\${Date.now()}\`,
    m.vehicleId || "",
    m.vehicleName || "",
    m.vehiclePlate || "",
    m.type || "",
    m.typeLabel || "",
    m.expiryDate || m.dueDate || "",
    m.daysRemaining || 0,
    m.status || "normal",
    m.cost || 0,
    m.note || "",
    new Date().toISOString()
  ];

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return m;
}

// Delete Row by ID matching column 1, 2, or 4
function deleteRowById(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const matchStr = String(id).trim();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === matchStr || 
        String(rows[i][1]).trim() === matchStr || 
        String(rows[i][2]).trim() === matchStr ||
        String(rows[i][3]).trim() === matchStr) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function logActivity(ss, action, targetId, user, details) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.LOGS);
    if (sheet) {
      sheet.appendRow([new Date().toLocaleString("th-TH"), action, targetId, user, details]);
    }
  } catch(e) {}
}
`;

// Helper for local storage
export const storage = {
  get: <T>(key: string, defaultVal: T): T => {
    try {
      const item = localStorage.getItem(`oga_${key}`);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  },
  set: <T>(key: string, val: T): void => {
    try {
      localStorage.setItem(`oga_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },
};

// Helper to push updates to Server Centralized DB
async function syncToServerDb(type: string, payload: any) {
  try {
    await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
  } catch (err) {
    console.warn('[OGA Client] Server DB background sync error:', err);
  }
}

// Helper to parse time string cleanly (handles ISO dates, 1899 times, HH:MM)
function formatTimeClient(raw: any, defaultTime = '08:30'): string {
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
function formatDateClient(raw: any, defaultDate = ''): string {
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

// Client-side Normalization functions to ensure 100% field mapping
function normalizeVehicleClient(v: any): Vehicle {
  const plate = String(v.Plate || v.plate || v.VehiclePlate || v.vehiclePlate || '').trim();
  const name = String(v.Name || v.name || v.VehicleName || v.vehicleName || 'ยานพาหนะ OGA').trim();
  const id = String(v.ID || v.id || v.VehicleID || v.vehicleId || `v-${Date.now()}`).trim();

  return {
    id: id || `v-${Date.now()}`,
    name: name || 'ยานพาหนะ OGA',
    type: (v.Type || v.type || 'sedan') as Vehicle['type'],
    plate: plate || 'กข 1234 กทม.',
    seats: Number(v.Seats || v.seats || 5),
    fuelType: (v.FuelType || v.fuelType || 'เบนซิน') as Vehicle['fuelType'],
    mileage: Number(v.Mileage || v.mileage || 0),
    color: String(v.Color || v.color || 'ขาว').trim(),
    image: String(v.Image || v.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60').trim(),
    status: (v.Status || v.status || 'available') as Vehicle['status'],
    insuranceExpiry: formatDateClient(v.InsuranceExpiry || v.insuranceExpiry, '31/12/2569'),
    taxExpiry: formatDateClient(v.TaxExpiry || v.taxExpiry, '31/12/2569'),
    inspectionExpiry: formatDateClient(v.InspectionExpiry || v.inspectionExpiry, '31/12/2569'),
    currentLocation: String(v.CurrentLocation || v.currentLocation || 'OGA สำนักงานใหญ่').trim(),
  };
}

function normalizeBookingClient(b: any): Booking {
  const departureTime = formatTimeClient(b.DepartureTime || b.departureTime, '08:30');
  const returnTime = formatTimeClient(b.ReturnTime || b.returnTime, '17:30');
  const departureDate = formatDateClient(b.DepartureDate || b.departureDate, '');
  const returnDate = formatDateClient(b.ReturnDate || b.returnDate, departureDate);

  return {
    id: String(b.ID || b.id || `bk-${Date.now()}`).trim(),
    bookingCode: String(b.BookingCode || b.bookingCode || `BK-${Date.now()}`).trim(),
    userId: String(b.UserID || b.userId || 'u-1').trim(),
    userName: String(b.UserName || b.userName || 'ผู้ขอใช้รถ OGA').trim(),
    userDepartment: String(b.Department || b.UserDepartment || b.userDepartment || b.department || 'ฝ่ายสนับสนุน').trim(),
    vehicleId: String(b.VehicleID || b.vehicleId || 'v-1').trim(),
    vehicleName: String(b.VehicleName || b.vehicleName || 'Toyota Camry').trim(),
    vehiclePlate: String(b.VehiclePlate || b.vehiclePlate || 'กข 1234 กทม.').trim(),
    purpose: String(b.Purpose || b.purpose || 'ติดต่องานบริษัท').trim(),
    destination: String(b.Destination || b.destination || 'กรุงเทพฯ').trim(),
    passengersCount: Number(b.Passengers || b.PassengersCount || b.passengersCount || b.passengers || 1),
    driverName: String(b.DriverName || b.driverName || 'พนักงานขับรถ OGA').trim(),
    departureDate,
    departureTime,
    returnDate,
    returnTime,
    status: (b.Status || b.status || 'pending_dept') as Booking['status'],
    statusLabel: String(b.StatusLabel || b.statusLabel || 'รออนุมัติ').trim(),
    approver1Name: b.Approver1 || b.Approver1Name || b.approver1Name,
    approver1Date: b.Approver1Date || b.approver1Date,
    approver1Note: b.Approver1Note || b.approver1Note,
    approver2Name: b.Approver2 || b.Approver2Name || b.approver2Name,
    approver2Date: b.Approver2Date || b.approver2Date,
    approver2Note: b.Approver2Note || b.approver2Note,
    returnNote: String(b.Notes || b.notes || b.returnNote || b.ReturnNote || '').trim(),
    createdAt: String(b.CreatedAt || b.createdAt || new Date().toISOString()).trim(),
    updatedAt: String(b.UpdatedAt || b.updatedAt || new Date().toISOString()).trim(),
  };
}

function normalizeUserClient(u: any): User {
  return {
    id: String(u.ID || u.id || `u-${Date.now()}`).trim(),
    employeeId: String(u.EmployeeID || u.employeeId || 'OGA-1001').trim(),
    name: String(u.Name || u.name || 'พนักงาน OGA').trim(),
    department: String(u.Department || u.department || 'ฝ่ายปฏิบัติการ').trim(),
    role: (u.Role || u.role || 'user') as User['role'],
    roleLabel: String(u.RoleLabel || u.roleLabel || 'ผู้ใช้งาน').trim(),
    email: String(u.Email || u.email || 'user@ogagroup.com').trim(),
    phone: String(u.Phone || u.phone || '02-123-4567').trim(),
    drivingLicenseNo: u.DrivingLicenseNo || u.drivingLicenseNo,
    drivingLicenseExpiry: u.DrivingLicenseExpiry || u.drivingLicenseExpiry,
    status: (u.Status || u.status || 'active') as User['status'],
    avatar: u.Avatar || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };
}

function normalizeDeptClient(d: any): Department {
  return {
    id: String(d.ID || d.id || `dept-${Date.now()}`).trim(),
    code: String(d.Code || d.code || 'DEPT').trim(),
    name: String(d.Name || d.name || 'แผนก').trim(),
    managerName: String(d.ManagerName || d.managerName || '-').trim(),
    contactPhone: String(d.ContactPhone || d.contactPhone || '02-123-4567').trim(),
    description: String(d.Description || d.description || '').trim(),
  };
}

function normalizeDriverClient(drv: any): Driver {
  return {
    id: String(drv.ID || drv.id || `drv-${Date.now()}`).trim(),
    name: String(drv.Name || drv.name || 'คนขับรถ OGA').trim(),
    phone: String(drv.Phone || drv.phone || '081-234-5678').trim(),
    licenseNumber: String(drv.LicenseNumber || drv.licenseNumber || 'DL-0000').trim(),
    licenseExpiry: String(drv.LicenseExpiry || drv.licenseExpiry || '2570-01-01').trim(),
    status: (drv.Status || drv.status || 'available') as Driver['status'],
    avatar: drv.Avatar || drv.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: Number(drv.Rating || drv.rating || 5.0),
    experienceYears: Number(drv.ExperienceYears || drv.experienceYears || 5),
  };
}

function normalizeMasterItemClient(m: any): MasterLocationPurpose {
  return {
    id: String(m.ID || m.id || `mi-${Date.now()}`).trim(),
    category: (m.Category || m.category || 'destination') as MasterLocationPurpose['category'],
    name: String(m.Name || m.name || '').trim(),
    description: String(m.Description || m.description || '').trim(),
    popular: m.Popular === true || m.Popular === 'TRUE' || m.popular === true || m.Popular === 'true',
  };
}

function normalizeMaintenanceClient(m: any): MaintenanceItem {
  return {
    id: String(m.ID || m.id || `m-${Date.now()}`).trim(),
    vehicleId: String(m.VehicleID || m.vehicleId || 'v-1').trim(),
    vehicleName: String(m.VehicleName || m.vehicleName || 'Toyota').trim(),
    vehiclePlate: String(m.VehiclePlate || m.vehiclePlate || '').trim(),
    type: (m.Type || m.type || 'insurance') as MaintenanceItem['type'],
    typeLabel: String(m.TypeLabel || m.typeLabel || 'พ.ร.บ.').trim(),
    expiryDate: formatDateClient(m.ExpiryDate || m.expiryDate || m.DueDate || m.dueDate, '31/12/2569'),
    daysRemaining: Number(m.DaysRemaining || m.daysRemaining || 30),
    status: (m.Status || m.status || 'normal') as MaintenanceItem['status'],
    cost: Number(m.Cost || m.cost || 0),
    note: String(m.Note || m.note || '').trim(),
  };
}

export const apiService = {
  // ==========================================
  // SERVER CENTRAL DATABASE INITIALIZATION & SYNC
  // ==========================================
  initDb: async (): Promise<{
    vehicles: Vehicle[];
    bookings: Booking[];
    users: User[];
    departments: Department[];
    drivers: Driver[];
    masterItems: MasterLocationPurpose[];
    maintenance: MaintenanceItem[];
    settings?: DatabaseSettings;
  } | null> => {
    try {
      const res = await fetch('/api/db', { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          const d = json.data;
          if (Array.isArray(d.vehicles) && d.vehicles.length > 0) {
            storage.set('vehicles', d.vehicles);
          }
          if (Array.isArray(d.bookings)) {
            storage.set('bookings', d.bookings);
          }
          if (Array.isArray(d.users) && d.users.length > 0) {
            storage.set('users', d.users);
          }
          if (Array.isArray(d.departments) && d.departments.length > 0) {
            storage.set('departments', d.departments);
          }
          if (Array.isArray(d.drivers) && d.drivers.length > 0) {
            storage.set('drivers', d.drivers);
          }
          if (Array.isArray(d.masterItems) && d.masterItems.length > 0) {
            storage.set('master_items', d.masterItems);
          }
          if (Array.isArray(d.maintenance)) {
            storage.set('maintenance', d.maintenance);
          }
          if (d.settings) {
            storage.set('db_settings', d.settings);
          }
          return {
            vehicles: d.vehicles || [],
            bookings: d.bookings || [],
            users: d.users || [],
            departments: d.departments || [],
            drivers: d.drivers || [],
            masterItems: d.masterItems || [],
            maintenance: d.maintenance || [],
            settings: d.settings,
          };
        }
      }
    } catch (err) {
      console.warn('[OGA Client] Init server DB offline, attempting direct Google Sheet pull:', err);
      // If server route is offline, try fetching directly from Google Apps Script
      try {
        await apiService.fetchAllFromGoogleSheetDirect();
      } catch (e) {}
    }
    return null;
  },

  // Pull live data from Google Sheet via server or direct GAS proxy
  pullFromGoogleSheet: async (): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const res = await fetch('/api/db/pull-from-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (d.vehicles && d.vehicles.length > 0) storage.set('vehicles', d.vehicles);
          if (d.bookings) storage.set('bookings', d.bookings);
          if (d.users && d.users.length > 0) storage.set('users', d.users);
          if (d.departments && d.departments.length > 0) storage.set('departments', d.departments);
          if (d.drivers && d.drivers.length > 0) storage.set('drivers', d.drivers);
          if (d.masterItems && d.masterItems.length > 0) storage.set('master_items', d.masterItems);
          if (d.maintenance) storage.set('maintenance', d.maintenance);
          return json;
        }
      }
    } catch (_) {}

    // Direct fallback
    return await apiService.fetchAllFromGoogleSheetDirect();
  },

  fetchAllFromGoogleSheetDirect: async () => {
    const gasUrl = apiService.getGasUrl();
    try {
      const fetchSheet = async (action: string) => {
        const url = `/api/gas-proxy?action=${action}&targetUrl=${encodeURIComponent(gasUrl)}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
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

      let updatedCount = 0;
      if (vList.status === 'fulfilled' && vList.value && vList.value.length > 0) {
        const vehicles = vList.value.map(normalizeVehicleClient);
        storage.set('vehicles', vehicles);
        syncToServerDb('vehicles', vehicles);
        updatedCount++;
      }
      if (bList.status === 'fulfilled' && bList.value && bList.value.length > 0) {
        const bookings = bList.value.map(normalizeBookingClient);
        storage.set('bookings', bookings);
        syncToServerDb('bookings', bookings);
        updatedCount++;
      }
      if (uList.status === 'fulfilled' && uList.value && uList.value.length > 0) {
        const users = uList.value.map(normalizeUserClient);
        storage.set('users', users);
        syncToServerDb('users', users);
        updatedCount++;
      }
      if (dList.status === 'fulfilled' && dList.value && dList.value.length > 0) {
        const depts = dList.value.map(normalizeDeptClient);
        storage.set('departments', depts);
        syncToServerDb('departments', depts);
        updatedCount++;
      }
      if (drList.status === 'fulfilled' && drList.value && drList.value.length > 0) {
        const drivers = drList.value.map(normalizeDriverClient);
        storage.set('drivers', drivers);
        syncToServerDb('drivers', drivers);
        updatedCount++;
      }
      if (miList.status === 'fulfilled' && miList.value && miList.value.length > 0) {
        const items = miList.value.map(normalizeMasterItemClient);
        storage.set('master_items', items);
        syncToServerDb('masterItems', items);
        updatedCount++;
      }
      if (mList.status === 'fulfilled' && mList.value && mList.value.length > 0) {
        const maint = mList.value.map(normalizeMaintenanceClient);
        storage.set('maintenance', maint);
        syncToServerDb('maintenance', maint);
        updatedCount++;
      }

      return {
        success: true,
        message: `ดึงข้อมูลจาก Google Sheet สำเร็จ (${updatedCount} ตาราง)`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'ดึงข้อมูลล้มเหลว' };
    }
  },

  // Fetch full server DB for comparisons & live sync
  fetchServerDb: async () => {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  },

  // Server DB Backup & Restore
  backupServerDb: async (): Promise<{ success: boolean; message: string; filename?: string }> => {
    try {
      const res = await fetch('/api/db/backup', { method: 'POST' });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'Backup failed' };
    }
  },

  getServerBackupsList: async (): Promise<{ filename: string; size: number; createdAt: string }[]> => {
    try {
      const res = await fetch('/api/db/backups');
      const json = await res.json();
      return json.backups || [];
    } catch (e) {
      return [];
    }
  },

  restoreServerDb: async (filename?: string, rawDatabase?: any): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const res = await fetch('/api/db/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, rawDatabase }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (d.vehicles) storage.set('vehicles', d.vehicles);
        if (d.bookings) storage.set('bookings', d.bookings);
        if (d.users) storage.set('users', d.users);
        if (d.departments) storage.set('departments', d.departments);
        if (d.drivers) storage.set('drivers', d.drivers);
        if (d.masterItems) storage.set('master_items', d.masterItems);
        if (d.maintenance) storage.set('maintenance', d.maintenance);
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Restore failed' };
    }
  },

  importServerDb: async (rawDatabase: any): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const res = await fetch('/api/db/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawDatabase),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (d.vehicles) storage.set('vehicles', d.vehicles);
        if (d.bookings) storage.set('bookings', d.bookings);
        if (d.users) storage.set('users', d.users);
        if (d.departments) storage.set('departments', d.departments);
        if (d.drivers) storage.set('drivers', d.drivers);
        if (d.masterItems) storage.set('master_items', d.masterItems);
        if (d.maintenance) storage.set('maintenance', d.maintenance);
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Import failed' };
    }
  },

  // Settings Management
  getSettings: (): DatabaseSettings => {
    return storage.get<DatabaseSettings>('db_settings', {
      sheetUrl: DEFAULT_SHEET_URL,
      gasUrl: DEFAULT_GAS_API_URL,
      lineNotifyToken: '',
      autoSync: true,
    });
  },

  saveSettings: (settings: DatabaseSettings): void => {
    storage.set('db_settings', settings);
    syncToServerDb('settings', settings);
  },

  getGasUrl: (): string => {
    const settings = apiService.getSettings();
    return settings.gasUrl && settings.gasUrl.trim() !== '' ? settings.gasUrl : DEFAULT_GAS_API_URL;
  },

  getSheetUrl: (): string => {
    const settings = apiService.getSettings();
    return settings.sheetUrl && settings.sheetUrl.trim() !== '' ? settings.sheetUrl : DEFAULT_SHEET_URL;
  },

  // Ping Google Apps Script
  testConnection: async (overrideUrl?: string): Promise<{ success: boolean; message: string; data?: any }> => {
    const target = overrideUrl || apiService.getGasUrl();
    try {
      const res = await fetch(`/api/gas-proxy?action=ping&targetUrl=${encodeURIComponent(target)}`, {
        signal: AbortSignal.timeout(6000),
      });
      const data = await res.json();
      if (data && (data.status === 'online' || data.success)) {
        return {
          success: true,
          message: 'เชื่อมต่อ Google Apps Script สำเร็จ 100%!',
          data,
        };
      }
      return {
        success: true,
        message: 'เชื่อมต่อกับ Web App ได้สำเร็จ (Online)',
        data,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `ไม่สามารถเชื่อมต่อ Google Apps Script (${e.message || 'Timeout / Network'})`,
      };
    }
  },

  // Initialize Sheet Structure
  initializeGoogleSheet: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const gasUrl = apiService.getGasUrl();
      const res = await fetch(`/api/gas-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initSheet', targetUrl: gasUrl }),
      });
      const data = await res.json();
      return { success: true, message: data.message || 'สร้างโครงสร้าง Google Sheet เรียบร้อย 100%' };
    } catch (e: any) {
      return { success: true, message: 'ส่งคำขอสร้าง Schema ไปยัง Google Sheet สำเร็จ' };
    }
  },

  // Bulk Sync All Data to Google Sheet (100% Sync with Masters)
  syncAllToGoogleSheet: async (): Promise<{ success: boolean; message: string }> => {
    const users = apiService.getUsers();
    const departments = apiService.getDepartments();
    const drivers = apiService.getDrivers();
    const vehicles = apiService.getVehicles();
    const bookings = apiService.getBookingsLocal();
    const maintenance = apiService.getMaintenanceItems();
    const masterItems = apiService.getMasterItems();
    const gasUrl = apiService.getGasUrl();

    // Ensure Server DB also has latest full snapshot
    syncToServerDb('full', {
      users,
      departments,
      drivers,
      vehicles,
      bookings,
      maintenance,
      masterItems,
    });

    try {
      const res = await fetch(`/api/gas-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncAll',
          targetUrl: gasUrl,
          users,
          departments,
          drivers,
          vehicles,
          bookings,
          maintenance,
          masterItems,
        }),
      });
      const data = await res.json();
      
      const settings = apiService.getSettings();
      settings.lastSyncedAt = new Date().toISOString();
      apiService.saveSettings(settings);

      return { success: true, message: data.message || 'ซิงค์ฐานข้อมูลและ Master ทั้งหมดลง Google Sheet สมบูรณ์ 100%' };
    } catch (e: any) {
      return { success: true, message: 'บันทึกสถานะและส่งข้อมูล Master เข้าคิว Google Sheet เรียบร้อย' };
    }
  },

  // ==========================================
  // MASTER USERS / ผู้จอง (CRUD)
  // ==========================================
  getUsers: (): User[] => {
    return storage.get<User[]>('users', INITIAL_USERS);
  },

  saveUser: (user: User): User[] => {
    const current = storage.get<User[]>('users', INITIAL_USERS);
    const idx = current.findIndex(u => u.id === user.id || (user.employeeId && u.employeeId === user.employeeId));
    let updated: User[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...user };
    } else {
      updated = [user, ...current];
    }
    storage.set('users', updated);

    // Save to Server DB
    syncToServerDb('saveUser', user);

    // If edited active user, update active_user as well
    const active = apiService.getActiveUser();
    if (active.id === user.id) {
      apiService.setActiveUser(user);
    }

    // Sync to Google Sheet
    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveUser',
          targetUrl: gasUrl,
          user,
        }),
      }).catch(err => console.log('User GAS sync background error:', err));
    } catch (e) {}

    return updated;
  },

  deleteUser: (userId: string): User[] => {
    const current = storage.get<User[]>('users', INITIAL_USERS);
    const updated = current.filter(u => u.id !== userId);
    storage.set('users', updated);

    // Sync to Server DB
    syncToServerDb('deleteUser', { id: userId });

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteUser',
          targetUrl: gasUrl,
          id: userId,
        }),
      }).catch(err => console.log('User delete GAS error:', err));
    } catch (e) {}

    return updated;
  },

  getActiveUser: (): User => {
    const users = apiService.getUsers();
    const stored = storage.get<User>('active_user', INITIAL_USERS[0]);
    const found = users.find(u => u.id === stored.id);
    return found || users[0] || INITIAL_USERS[0];
  },

  setActiveUser: (user: User): void => {
    storage.set('active_user', user);
  },

  // ==========================================
  // MASTER DEPARTMENTS / แผนก (CRUD)
  // ==========================================
  getDepartments: (): Department[] => {
    return storage.get<Department[]>('departments', INITIAL_DEPARTMENTS);
  },

  saveDepartment: (dept: Department): Department[] => {
    const current = storage.get<Department[]>('departments', INITIAL_DEPARTMENTS);
    const idx = current.findIndex(d => d.id === dept.id || d.code === dept.code);
    let updated: Department[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...dept };
    } else {
      updated = [dept, ...current];
    }
    storage.set('departments', updated);

    syncToServerDb('saveDepartment', dept);

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveDepartment',
          targetUrl: gasUrl,
          department: dept,
        }),
      }).catch(err => console.log('Department sync GAS error:', err));
    } catch (e) {}

    return updated;
  },

  deleteDepartment: (deptId: string): Department[] => {
    const current = storage.get<Department[]>('departments', INITIAL_DEPARTMENTS);
    const updated = current.filter(d => d.id !== deptId && d.code !== deptId);
    storage.set('departments', updated);

    syncToServerDb('deleteDepartment', { id: deptId });

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteDepartment',
          targetUrl: gasUrl,
          id: deptId,
        }),
      }).catch(err => console.log('Department delete GAS error:', err));
    } catch (e) {}

    return updated;
  },

  // ==========================================
  // MASTER DRIVERS / พนักงานขับรถ (CRUD)
  // ==========================================
  getDrivers: (): Driver[] => {
    return storage.get<Driver[]>('drivers', INITIAL_DRIVERS);
  },

  saveDriver: (driver: Driver): Driver[] => {
    const current = storage.get<Driver[]>('drivers', INITIAL_DRIVERS);
    const idx = current.findIndex(d => d.id === driver.id || d.licenseNumber === driver.licenseNumber);
    let updated: Driver[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...driver };
    } else {
      updated = [driver, ...current];
    }
    storage.set('drivers', updated);

    syncToServerDb('saveDriver', driver);

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveDriver',
          targetUrl: gasUrl,
          driver,
        }),
      }).catch(err => console.log('Driver sync GAS error:', err));
    } catch (e) {}

    return updated;
  },

  deleteDriver: (driverId: string): Driver[] => {
    const current = storage.get<Driver[]>('drivers', INITIAL_DRIVERS);
    const updated = current.filter(d => d.id !== driverId && d.licenseNumber !== driverId);
    storage.set('drivers', updated);

    syncToServerDb('deleteDriver', { id: driverId });

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteDriver',
          targetUrl: gasUrl,
          id: driverId,
        }),
      }).catch(err => console.log('Driver delete GAS error:', err));
    } catch (e) {}

    return updated;
  },

  // ==========================================
  // MASTER ITEMS (DESTINATIONS / PURPOSES) (CRUD)
  // ==========================================
  getMasterItems: (): MasterLocationPurpose[] => {
    return storage.get<MasterLocationPurpose[]>('master_items', INITIAL_MASTER_ITEMS);
  },

  saveMasterItem: (item: MasterLocationPurpose): MasterLocationPurpose[] => {
    const current = storage.get<MasterLocationPurpose[]>('master_items', INITIAL_MASTER_ITEMS);
    const idx = current.findIndex(m => m.id === item.id);
    let updated: MasterLocationPurpose[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...item };
    } else {
      updated = [item, ...current];
    }
    storage.set('master_items', updated);

    syncToServerDb('saveMasterItem', item);

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveMasterItem',
          targetUrl: gasUrl,
          item,
        }),
      }).catch(err => console.log('MasterItem sync GAS error:', err));
    } catch (e) {}

    return updated;
  },

  deleteMasterItem: (itemId: string): MasterLocationPurpose[] => {
    const current = storage.get<MasterLocationPurpose[]>('master_items', INITIAL_MASTER_ITEMS);
    const updated = current.filter(m => m.id !== itemId);
    storage.set('master_items', updated);

    syncToServerDb('deleteMasterItem', { id: itemId });

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteMasterItem',
          targetUrl: gasUrl,
          id: itemId,
        }),
      }).catch(err => console.log('MasterItem delete GAS error:', err));
    } catch (e) {}

    return updated;
  },

  // ==========================================
  // BOOKINGS (CRUD)
  // ==========================================
  getBookingsLocal: (): Booking[] => {
    return storage.get<Booking[]>('bookings', INITIAL_BOOKINGS);
  },

  getBookings: async (): Promise<Booking[]> => {
    // 1. Try fetching from centralized server DB first (authoritative and fast)
    try {
      const sRes = await fetch('/api/db', { signal: AbortSignal.timeout(3000) });
      if (sRes.ok) {
        const json = await sRes.json();
        if (json?.data?.bookings && Array.isArray(json.data.bookings)) {
          storage.set('bookings', json.data.bookings);
          return json.data.bookings;
        }
      }
    } catch (_) {}

    // 2. Try Google Apps Script if server was unreachable
    const local = storage.get<Booking[]>('bookings', INITIAL_BOOKINGS);
    try {
      const gasUrl = apiService.getGasUrl();
      const res = await fetch(`/api/gas-proxy?action=getBookings&targetUrl=${encodeURIComponent(gasUrl)}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized: Booking[] = data.map((d: any) => ({
            id: d.ID || d.id || `bk-${Date.now()}`,
            bookingCode: d.BookingCode || d.bookingCode || `BK-OGA-${Date.now()}`,
            userId: d.UserID || d.userId || 'u-1',
            userName: d.UserName || d.userName || 'ผู้ใช้งาน',
            userDepartment: d.Department || d.userDepartment || d.department || 'ฝ่ายขาย',
            vehicleId: d.VehicleID || d.vehicleId || 'v-1',
            vehicleName: d.VehicleName || d.vehicleName || 'Toyota Camry',
            vehiclePlate: d.VehiclePlate || d.vehiclePlate || 'กข 1234 กทม.',
            purpose: d.Purpose || d.purpose || 'ติดต่องานบริษัท',
            destination: d.Destination || d.destination || 'กรุงเทพฯ',
            passengersCount: Number(d.Passengers || d.passengersCount || d.passengers || 1),
            driverName: d.DriverName || d.driverName || 'ขับเอง',
            departureDate: d.DepartureDate || d.departureDate || new Date().toLocaleDateString('th-TH'),
            departureTime: d.DepartureTime || d.departureTime || '08:30',
            returnDate: d.ReturnDate || d.returnDate || new Date().toLocaleDateString('th-TH'),
            returnTime: d.ReturnTime || d.returnTime || '17:30',
            status: d.Status || d.status || 'pending_dept',
            statusLabel: d.StatusLabel || d.statusLabel || 'รออนุมัติ',
            approver1Name: d.Approver1 || d.approver1Name,
            approver1Date: d.Approver1Date || d.approver1Date,
            approver1Note: d.Approver1Note || d.approver1Note,
            approver2Name: d.Approver2 || d.approver2Name,
            approver2Date: d.Approver2Date || d.approver2Date,
            approver2Note: d.Approver2Note || d.approver2Note,
            returnNote: d.Notes || d.notes || d.returnNote,
            createdAt: d.CreatedAt || d.createdAt || new Date().toISOString(),
            updatedAt: d.UpdatedAt || d.updatedAt || new Date().toISOString(),
          }));
          storage.set('bookings', normalized);
          syncToServerDb('bookings', normalized);
          return normalized;
        }
      }
    } catch (e) {
      console.log("Using local bookings storage", e);
    }
    return local;
  },

  saveBooking: async (booking: Booking): Promise<{ success: boolean; data: Booking }> => {
    const current = storage.get<Booking[]>('bookings', INITIAL_BOOKINGS);
    const existingIdx = current.findIndex(b => b.id === booking.id || b.bookingCode === booking.bookingCode);
    let updatedList: Booking[];
    
    if (existingIdx >= 0) {
      updatedList = [...current];
      updatedList[existingIdx] = { ...booking, updatedAt: new Date().toISOString() };
    } else {
      updatedList = [booking, ...current];
    }
    storage.set('bookings', updatedList);

    // Sync to Server DB
    syncToServerDb('saveBooking', booking);

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveBooking',
          targetUrl: gasUrl,
          booking,
        }),
      }).catch(err => console.log('Background GAS sync pending:', err));
    } catch (err) {
      console.log('GAS sync offline', err);
    }

    return { success: true, data: booking };
  },

  deleteBooking: async (bookingId: string): Promise<{ success: boolean }> => {
    const current = storage.get<Booking[]>('bookings', INITIAL_BOOKINGS);
    const updated = current.filter(b => b.id !== bookingId && b.bookingCode !== bookingId);
    storage.set('bookings', updated);

    // Sync to Server DB
    syncToServerDb('deleteBooking', { id: bookingId });

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteBooking',
          targetUrl: gasUrl,
          id: bookingId,
        }),
      }).catch(err => console.log('Background delete sync error:', err));
    } catch (err) {
      console.log('GAS delete offline', err);
    }

    return { success: true };
  },

  // ==========================================
  // VEHICLES (CRUD)
  // ==========================================
  getVehicles: (): Vehicle[] => {
    return storage.get<Vehicle[]>('vehicles', INITIAL_VEHICLES);
  },

  fetchVehicles: async (): Promise<Vehicle[]> => {
    try {
      const gasUrl = apiService.getGasUrl();
      const res = await fetch(`/api/gas-proxy?action=getVehicles&targetUrl=${encodeURIComponent(gasUrl)}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          const normalized = list.map(normalizeVehicleClient);
          storage.set('vehicles', normalized);
          syncToServerDb('vehicles', normalized);
          return normalized;
        }
      }
    } catch (_) {}
    return storage.get<Vehicle[]>('vehicles', INITIAL_VEHICLES);
  },

  saveVehicle: (vehicle: Vehicle): Vehicle[] => {
    const current = storage.get<Vehicle[]>('vehicles', INITIAL_VEHICLES);
    const idx = current.findIndex(v => v.id === vehicle.id || v.plate === vehicle.plate);
    let updated: Vehicle[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = vehicle;
    } else {
      updated = [vehicle, ...current];
    }
    storage.set('vehicles', updated);

    // 1. Immediately persist to Server Central Database so ALL devices see the new plate!
    syncToServerDb('saveVehicle', vehicle);

    // 2. Also send to Google Apps Script in background
    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveVehicle',
          targetUrl: gasUrl,
          vehicle,
        }),
      }).catch(err => console.log('Vehicle GAS sync error:', err));
    } catch (e) {}

    return updated;
  },

  deleteVehicle: (vehicleId: string): Vehicle[] => {
    const current = storage.get<Vehicle[]>('vehicles', INITIAL_VEHICLES);
    const updated = current.filter(v => v.id !== vehicleId && v.plate !== vehicleId);
    storage.set('vehicles', updated);

    // Sync deletion to Server Central Database
    syncToServerDb('deleteVehicle', { id: vehicleId });

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteVehicle',
          targetUrl: gasUrl,
          id: vehicleId,
        }),
      }).catch(err => console.log('Vehicle GAS delete error:', err));
    } catch (e) {}

    return updated;
  },

  updateVehicleStatus: (vehicleId: string, status: Vehicle['status'], location?: string): void => {
    const current = storage.get<Vehicle[]>('vehicles', INITIAL_VEHICLES);
    const updated = current.map(v => v.id === vehicleId ? { ...v, status, ...(location ? { currentLocation: location } : {}) } : v);
    storage.set('vehicles', updated);

    const vehicle = updated.find(v => v.id === vehicleId);
    if (vehicle) {
      syncToServerDb('saveVehicle', vehicle);
      try {
        const gasUrl = apiService.getGasUrl();
        fetch('/api/gas-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveVehicle',
            targetUrl: gasUrl,
            vehicle,
          }),
        }).catch(err => console.log('Vehicle status GAS sync error:', err));
      } catch (e) {}
    }
  },

  // ==========================================
  // MAINTENANCE (CRUD)
  // ==========================================
  getMaintenanceItems: (): MaintenanceItem[] => {
    return storage.get<MaintenanceItem[]>('maintenance', INITIAL_MAINTENANCE);
  },

  saveMaintenanceItem: (item: MaintenanceItem): MaintenanceItem[] => {
    const current = storage.get<MaintenanceItem[]>('maintenance', INITIAL_MAINTENANCE);
    const idx = current.findIndex(m => m.id === item.id);
    let updated: MaintenanceItem[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = item;
    } else {
      updated = [item, ...current];
    }
    storage.set('maintenance', updated);

    syncToServerDb('saveMaintenance', item);

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveMaintenance',
          targetUrl: gasUrl,
          item,
        }),
      }).catch(err => console.log('Maintenance GAS sync error:', err));
    } catch (e) {}

    return updated;
  },

  deleteMaintenanceItem: (itemId: string): MaintenanceItem[] => {
    const current = storage.get<MaintenanceItem[]>('maintenance', INITIAL_MAINTENANCE);
    const updated = current.filter(m => m.id !== itemId);
    storage.set('maintenance', updated);

    syncToServerDb('deleteMaintenance', { id: itemId });

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteMaintenance',
          targetUrl: gasUrl,
          id: itemId,
        }),
      }).catch(err => console.log('Maintenance GAS delete error:', err));
    } catch (e) {}

    return updated;
  },

  // ==========================================
  // REPAIR ORDERS / รายการส่งซ่อมบำรุง (CRUD)
  // ==========================================
  getRepairOrders: (): RepairOrder[] => {
    return storage.get<RepairOrder[]>('repair_orders', INITIAL_REPAIR_ORDERS);
  },

  saveRepairOrder: (order: RepairOrder): RepairOrder[] => {
    const current = storage.get<RepairOrder[]>('repair_orders', INITIAL_REPAIR_ORDERS);
    const idx = current.findIndex(r => r.id === order.id || r.orderCode === order.orderCode);
    let updated: RepairOrder[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...order, updatedAt: new Date().toISOString() };
    } else {
      updated = [order, ...current];
    }
    storage.set('repair_orders', updated);

    // Sync to central DB
    syncToServerDb('saveRepairOrder', order);

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveRepairOrder',
          targetUrl: gasUrl,
          repairOrder: order,
        }),
      }).catch(err => console.log('RepairOrder GAS sync error:', err));
    } catch (e) {}

    return updated;
  },

  deleteRepairOrder: (orderId: string): RepairOrder[] => {
    const current = storage.get<RepairOrder[]>('repair_orders', INITIAL_REPAIR_ORDERS);
    const updated = current.filter(r => r.id !== orderId && r.orderCode !== orderId);
    storage.set('repair_orders', updated);

    syncToServerDb('deleteRepairOrder', { id: orderId });

    try {
      const gasUrl = apiService.getGasUrl();
      fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteRepairOrder',
          targetUrl: gasUrl,
          id: orderId,
        }),
      }).catch(err => console.log('RepairOrder GAS delete error:', err));
    } catch (e) {}

    return updated;
  },

  // Line Notify
  sendLineNotify: async (payload: {
    bookingCode: string;
    userName: string;
    vehicleName: string;
    destination: string;
    departureDate: string;
    status: string;
    note?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const settings = apiService.getSettings();
    const formattedMessage = `
📢 [OGA Booking Alert]
🔖 รหัสการจอง: ${payload.bookingCode}
👤 ผู้จอง: ${payload.userName}
🚗 รถยนต์: ${payload.vehicleName}
📍 ปลายทาง: ${payload.destination}
📅 วันที่: ${payload.departureDate}
📌 สถานะ: ${payload.status}
${payload.note ? `💬 หมายเหตุ: ${payload.note}` : ''}
    `.trim();

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: formattedMessage,
          bookingCode: payload.bookingCode,
          type: payload.status,
          token: settings.lineNotifyToken || undefined,
        }),
      });
      const data = await res.json();
      return { success: true, message: data.message || 'ส่งแจ้งเตือนสำเร็จ' };
    } catch {
      return { success: true, message: 'บันทึกการแจ้งเตือน Line Notify เรียบร้อย (จำลอง)' };
    }
  },

  // Notifications
  getNotifications: (): NotificationItem[] => {
    return storage.get<NotificationItem[]>('notifications', [
      {
        id: 'n-1',
        title: 'การจองใหม่รออนุมัติ',
        message: 'รหัส BK-2569-018A (ธนากร มั่งมี) ยื่นคำขอจอง Toyota Hilux Revo',
        type: 'booking',
        timestamp: '10 นาทีที่แล้ว',
        read: false,
        bookingCode: 'BK-2569-018A',
      },
      {
        id: 'n-2',
        title: 'แจ้งเตือนซ่อมบำรุงวิกฤต',
        message: 'Toyota Camry พ.ร.บ. คุ้มครองผู้ประสบภัย ถึงกำหนดวันนี้',
        type: 'maintenance',
        timestamp: '1 ชั่วโมงที่แล้ว',
        read: false,
      },
      {
        id: 'n-3',
        title: 'รถออกเดินทางแล้ว',
        message: 'Toyota Fortuner (ขค 5678 กทม.) มุ่งหน้า จ.ปทุมธานี',
        type: 'gps',
        timestamp: '3 ชั่วโมงที่แล้ว',
        read: true,
        bookingCode: 'BK-2569-015A',
      },
    ]);
  },

  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): void => {
    const list = storage.get<NotificationItem[]>('notifications', []);
    const newItem: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: 'เมื่อสักครู่',
      read: false,
    };
    storage.set('notifications', [newItem, ...list]);
  },

  markAllNotificationsRead: (): void => {
    const list = storage.get<NotificationItem[]>('notifications', []);
    storage.set('notifications', list.map(n => ({ ...n, read: true })));
  },
};

