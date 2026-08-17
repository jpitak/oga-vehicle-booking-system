/**
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
  const idToMatch = String(u.id || u.employeeId || "").trim();

  let targetRowIdx = -1;
  if (idToMatch) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === idToMatch || String(rows[i][1]).trim() === idToMatch) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }

  const rowValues = [
    u.id || ("u-" + new Date().getTime()),
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
  const idToMatch = String(d.id || d.code || "").trim();

  let targetRowIdx = -1;
  if (idToMatch) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === idToMatch || String(rows[i][1]).trim() === idToMatch) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }

  const rowValues = [
    d.id || ("dept-" + new Date().getTime()),
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
  const idToMatch = String(drv.id || drv.licenseNumber || drv.name || "").trim();

  let targetRowIdx = -1;
  if (idToMatch) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === idToMatch || String(rows[i][1]).trim() === idToMatch || String(rows[i][3]).trim() === idToMatch) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }

  const rowValues = [
    drv.id || ("drv-" + new Date().getTime()),
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
  const idToMatch = String(item.id || item.name || "").trim();

  let targetRowIdx = -1;
  if (idToMatch) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === idToMatch || String(rows[i][2]).trim() === idToMatch) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }

  const rowValues = [
    item.id || ("mi-" + new Date().getTime()),
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
  const idToMatch = String(b.id || b.bookingCode || "").trim();

  let targetRowIdx = -1;
  if (idToMatch) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === idToMatch || String(rows[i][1]).trim() === idToMatch) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }

  const rowValues = [
    b.id || ("bk-" + new Date().getTime()),
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

// Upsert Vehicle (Matches by ID first, then Plate)
function upsertVehicle(ss, v) {
  const sheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const idToMatch = String(v.id || "").trim();
  const plateToMatch = String(v.plate || "").trim();

  let targetRowIdx = -1;
  // Match by ID first
  if (idToMatch) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === idToMatch) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }
  // Match by plate if ID not found
  if (targetRowIdx === -1 && plateToMatch) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][3]).trim() === plateToMatch) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }

  const rowValues = [
    v.id || ("v-" + new Date().getTime()),
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
  const idToMatch = String(m.id || "").trim();

  let targetRowIdx = -1;
  if (idToMatch) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === idToMatch) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }

  const rowValues = [
    m.id || ("m-" + new Date().getTime()),
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
