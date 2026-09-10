/**
 * OGA Fleet v3.3 - Google Apps Script Backend (100% Live Fix)
 * Sheet tabs: Users, Departments, Drivers, Bookings, Vehicles, MasterItems, Maintenance, SystemLogs
 * Deploy: Execute as Me | Who has access: Anyone
 */

var SHEET_NAMES = {
  USERS: 'Users',
  DEPARTMENTS: 'Departments',
  DRIVERS: 'Drivers',
  BOOKINGS: 'Bookings',
  VEHICLES: 'Vehicles',
  MAINTENANCE: 'Maintenance',
  MASTER_ITEMS: 'MasterItems',
  LOGS: 'SystemLogs'
};

var SHEET_ALIASES = {
  Users: ['Users', 'ผู้ใช้'],
  Departments: ['Departments', 'แผนกต่างๆ'],
  Drivers: ['Drivers', 'คนขับรถ'],
  Bookings: ['Bookings', 'การจอง'],
  Vehicles: ['Vehicles', 'ยานพาหนะ'],
  Maintenance: ['Maintenance', 'การบำรุงรักษา'],
  MasterItems: ['MasterItems', 'MasterItems'],
  SystemLogs: ['SystemLogs', 'บันทึกระบบ']
};

var TIMEZONE = 'Asia/Bangkok';

function getSpreadsheet(e) {
  try {
    if (e && e.parameter && e.parameter.spreadsheetId) {
      return SpreadsheetApp.openById(e.parameter.spreadsheetId);
    }
  } catch (err) {}
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (err2) {}
  return null;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * จัดรูปแบบวันที่ให้เป็น String แบบ DD/MM/YYYY
 */
function toLocalDateStr_(input) {
  if (!input && input !== 0) return '';
  if (Object.prototype.toString.call(input) === '[object Date]' && !isNaN(input.getTime())) {
    return Utilities.formatDate(input, TIMEZONE, 'dd/MM/yyyy');
  }
  var s = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    var p = s.substring(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
    var parts = s.split('/');
    var d = ('0' + parts[0]).slice(-2);
    var m = ('0' + parts[1]).slice(-2);
    var y = parts[2];
    if (parseInt(y, 10) > 2400) y = String(parseInt(y, 10) - 543);
    return d + '/' + m + '/' + y;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}/.test(s)) {
    var q = s.split('-');
    var d2 = ('0' + q[0]).slice(-2);
    var m2 = ('0' + q[1]).slice(-2);
    var y2 = q[2];
    if (parseInt(y2, 10) > 2400) y2 = String(parseInt(y2, 10) - 543);
    return d2 + '/' + m2 + '/' + y2;
  }
  try {
    var dObj = new Date(s);
    if (!isNaN(dObj.getTime())) return Utilities.formatDate(dObj, TIMEZONE, 'dd/MM/yyyy');
  } catch (e) {}
  return s;
}

/**
 * บังคับวันที่ให้เป็นข้อความ Plain Text (ขึ้นต้นด้วย ') เพื่อป้องกัน Google Sheet สลับเดือน/วัน
 */
function forceDateValue_(val) {
  if (val === null || val === undefined || val === '') return '';
  var s = toLocalDateStr_(val);
  return s ? ("'" + s) : '';
}

function resolveSheet_(ss, preferredName) {
  if (!ss) return null;
  var sheet = ss.getSheetByName(preferredName);
  if (sheet) return sheet;
  var aliases = SHEET_ALIASES[preferredName] || [preferredName];
  for (var i = 0; i < aliases.length; i++) {
    sheet = ss.getSheetByName(aliases[i]);
    if (sheet) return sheet;
  }
  var sheets = ss.getSheets();
  for (var j = 0; j < sheets.length; j++) {
    if (String(sheets[j].getName()).toLowerCase() === String(preferredName).toLowerCase()) {
      return sheets[j];
    }
  }
  return null;
}

function getSheetData(ss, sheetName) {
  var sheet = resolveSheet_(ss, sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    var empty = true;
    for (var j = 0; j < headers.length; j++) {
      var val = values[i][j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, TIMEZONE, 'dd/MM/yyyy');
      } else if (typeof val === 'string') {
        val = val.replace(/^'/, '');
      }
      obj[headers[j]] = val;
      if (val !== '' && val !== null && val !== undefined) empty = false;
    }
    if (!empty) rows.push(obj);
  }
  return rows;
}

function ensureHeaders_(sheet, headers) {
  var lastCol = Math.max(headers.length, 1);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!existing[0] || String(existing[0]).trim() === '') {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0A6B89')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    try { sheet.autoResizeColumns(1, headers.length); } catch (e) {}
  }
  // ตั้งค่าคอลัมน์ที่เป็นข้อความทั่วไปเพื่อไม่ให้เลขอัตโนมัติเพี้ยน
  for (var c = 0; c < headers.length; c++) {
    if (/date|expire|due/i.test(headers[c])) {
      try {
        sheet.getRange(2, c + 1, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('@');
      } catch (e) {}
    }
  }
}

function userHeaders_() {
  return ['ID', 'EmployeeID', 'Name', 'Department', 'Role', 'RoleLabel', 'Email', 'Phone', 'DrivingLicenseNo', 'DrivingLicenseExpiry', 'Status', 'UpdatedAt'];
}
function deptHeaders_() {
  return ['ID', 'Name', 'Manager', 'Phone', 'Status', 'UpdatedAt'];
}
function driverHeaders_() {
  return ['ID', 'Name', 'Phone', 'LicenseNo', 'LicenseExpire', 'Rating', 'Status', 'UpdatedAt'];
}
function vehicleHeaders_() {
  return ['ID', 'Plate', 'Brand', 'Model', 'Year', 'Color', 'Mileage', 'Status', 'ImageUrl', 'FuelType', 'UpdatedAt'];
}
function bookingHeaders_() {
  return ['ID', 'BookingCode', 'VehicleID', 'Plate', 'Requester', 'Department', 'DriverID', 'DriverName',
    'Destination', 'Purpose', 'DepartureDate', 'ReturnDate', 'StartTime', 'EndTime',
    'Status', 'ApprovedBy', 'ApprovedDate', 'ReturnConfirmDate', 'Notes', 'CreatedAt', 'UpdatedAt'];
}
function maintHeaders_() {
  return ['ID', 'VehicleID', 'Plate', 'Type', 'Date', 'Cost', 'NextDue', 'Status', 'Notes', 'UpdatedAt'];
}
function masterHeaders_() {
  return ['ID', 'Type', 'Name', 'Value', 'Status', 'UpdatedAt'];
}

function initSheets(ss) {
  if (!ss || typeof ss.getSheetByName !== 'function') {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) {
    Logger.log('ERROR: ไม่พบ Spreadsheet');
    return { success: false, error: 'No active spreadsheet' };
  }

  var configs = [
    { name: SHEET_NAMES.USERS, headers: userHeaders_() },
    { name: SHEET_NAMES.DEPARTMENTS, headers: deptHeaders_() },
    { name: SHEET_NAMES.DRIVERS, headers: driverHeaders_() },
    { name: SHEET_NAMES.VEHICLES, headers: vehicleHeaders_() },
    { name: SHEET_NAMES.BOOKINGS, headers: bookingHeaders_() },
    { name: SHEET_NAMES.MAINTENANCE, headers: maintHeaders_() },
    { name: SHEET_NAMES.MASTER_ITEMS, headers: masterHeaders_() },
    { name: SHEET_NAMES.LOGS, headers: ['ID', 'Action', 'User', 'Detail', 'Timestamp'] }
  ];

  var created = [];
  configs.forEach(function (c) {
    var sheet = resolveSheet_(ss, c.name);
    if (!sheet) {
      sheet = ss.insertSheet(c.name);
      created.push(c.name);
    }
    ensureHeaders_(sheet, c.headers);
  });

  try {
    var s1 = ss.getSheetByName('Sheet1');
    if (s1 && ss.getSheets().length > 1) {
      ss.deleteSheet(s1);
    }
  } catch (e) {}

  try {
    ss.setSpreadsheetLocale('th_TH');
    ss.setSpreadsheetTimeZone('Asia/Bangkok');
  } catch (e) {}

  return { success: true, created: created, sheets: ss.getSheets().map(function (s) { return s.getName(); }) };
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';
  var ss = getSpreadsheet(e);

  if (action === 'ping' || action === 'test') {
    return jsonResponse({
      success: true,
      status: 'ออนไลน์',
      message: 'เชื่อมต่อฐานข้อมูล Google Sheet ของ OGA Fleet สำเร็จ 100%',
      sheets: ss ? ss.getSheets().map(function (s) { return s.getName(); }) : [],
      spreadsheetId: ss ? ss.getId() : '',
      timestamp: Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm:ss')
    });
  }

  if (action === 'initSheets' || action === 'setup' || action === 'initSchema') {
    var result = initSheets(ss);
    return jsonResponse({
      success: true,
      message: 'สร้าง/ตรวจสอบโครงสร้างตารางสำเร็จ 100%',
      created: result.created || [],
      sheets: result.sheets || []
    });
  }

  if (action === 'getAll' || action === 'listAll') {
    return jsonResponse({
      success: true,
      data: {
        users: getSheetData(ss, SHEET_NAMES.USERS),
        departments: getSheetData(ss, SHEET_NAMES.DEPARTMENTS),
        drivers: getSheetData(ss, SHEET_NAMES.DRIVERS),
        bookings: getSheetData(ss, SHEET_NAMES.BOOKINGS),
        vehicles: getSheetData(ss, SHEET_NAMES.VEHICLES),
        maintenance: getSheetData(ss, SHEET_NAMES.MAINTENANCE),
        masterItems: getSheetData(ss, SHEET_NAMES.MASTER_ITEMS)
      },
      syncedAt: Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm:ss')
    });
  }

  if (action === 'getUsers') return jsonResponse({ success: true, data: getSheetData(ss, SHEET_NAMES.USERS) });
  if (action === 'getDepartments') return jsonResponse({ success: true, data: getSheetData(ss, SHEET_NAMES.DEPARTMENTS) });
  if (action === 'getDrivers') return jsonResponse({ success: true, data: getSheetData(ss, SHEET_NAMES.DRIVERS) });
  if (action === 'getBookings') return jsonResponse({ success: true, data: getSheetData(ss, SHEET_NAMES.BOOKINGS) });
  if (action === 'getVehicles') return jsonResponse({ success: true, data: getSheetData(ss, SHEET_NAMES.VEHICLES) });
  if (action === 'getMaintenance') return jsonResponse({ success: true, data: getSheetData(ss, SHEET_NAMES.MAINTENANCE) });
  if (action === 'getMasterItems') return jsonResponse({ success: true, data: getSheetData(ss, SHEET_NAMES.MASTER_ITEMS) });

  return jsonResponse({ success: false, error: 'Unknown action: ' + action });
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
    }
    var action = body.action || (e && e.parameter && e.parameter.action) || '';
    var payload = body.payload || body.data || body;
    var ss = getSpreadsheet(e);

    if (action === 'PING' || action === 'ping') {
      return jsonResponse({
        success: true,
        status: 'ออนไลน์',
        message: 'เชื่อมต่อฐานข้อมูล Google Sheet ของ OGA Fleet สำเร็จ 100%',
        timestamp: Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm:ss')
      });
    }

    if (action === 'SAVE_BOOKING' || action === 'saveBooking') {
      // บังคับล้าง ID ทุกรูปแบบเพื่อสร้างแถวใหม่เสมอ (แก้ปัญหาบันทึกทับบรรทัดเดิม)
      if (payload) {
        delete payload.ID;
        delete payload.id;
        delete payload.booking_id;
        delete payload.BookingCode;
        delete payload.ROW;
        delete payload.row;
      }
      return jsonResponse(saveRow_(ss, SHEET_NAMES.BOOKINGS, payload, 'ID', bookingHeaders_(), 'BookingCode', true));
    }

    if (action === 'UPDATE_BOOKING' || action === 'updateBooking') {
      return jsonResponse(saveRow_(ss, SHEET_NAMES.BOOKINGS, payload, 'ID', bookingHeaders_(), 'BookingCode', false));
    }

    if (action === 'DELETE_BOOKING' || action === 'deleteBooking') {
      return jsonResponse(deleteRow_(ss, SHEET_NAMES.BOOKINGS, payload.id || payload.ID || payload.booking_id, 'ID'));
    }

    if (action === 'APPROVE_BOOKING' || action === 'approveBooking') {
      payload.Status = (payload.approve === false || payload.approve === 'false') ? 'ไม่อนุมัติ' : 'อนุมัติแล้ว';
      payload.ApprovedDate = forceDateValue_(new Date());
      return jsonResponse(saveRow_(ss, SHEET_NAMES.BOOKINGS, payload, 'ID', bookingHeaders_(), 'BookingCode', false));
    }

    if (action === 'RETURN_VEHICLE' || action === 'returnVehicle') {
      payload.Status = 'คืนรถแล้ว';
      payload.ReturnConfirmDate = forceDateValue_(new Date());
      return jsonResponse(saveRow_(ss, SHEET_NAMES.BOOKINGS, payload, 'ID', bookingHeaders_(), 'BookingCode', false));
    }

    if (action === 'SAVE_VEHICLE' || action === 'saveVehicle') {
      return jsonResponse(saveRow_(ss, SHEET_NAMES.VEHICLES, payload, 'ID', vehicleHeaders_()));
    }
    if (action === 'SAVE_USER' || action === 'saveUser') {
      return jsonResponse(saveRow_(ss, SHEET_NAMES.USERS, payload, 'ID', userHeaders_()));
    }
    if (action === 'SAVE_DRIVER' || action === 'saveDriver') {
      return jsonResponse(saveRow_(ss, SHEET_NAMES.DRIVERS, payload, 'ID', driverHeaders_()));
    }
    if (action === 'SAVE_DEPARTMENT' || action === 'saveDepartment') {
      return jsonResponse(saveRow_(ss, SHEET_NAMES.DEPARTMENTS, payload, 'ID', deptHeaders_()));
    }
    if (action === 'SAVE_MAINTENANCE' || action === 'saveMaintenance') {
      return jsonResponse(saveRow_(ss, SHEET_NAMES.MAINTENANCE, payload, 'ID', maintHeaders_()));
    }
    if (action === 'SAVE_MASTER' || action === 'saveMaster') {
      return jsonResponse(saveRow_(ss, SHEET_NAMES.MASTER_ITEMS, payload, 'ID', masterHeaders_()));
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function pickId_(data, idField, altField) {
  return data[idField] || data[altField] || data.booking_id || data.user_id || data.vehicle_id || data.driver_id || data.dept_id || data.maint_id || data.ID || data.id || '';
}

function saveRow_(ss, sheetName, data, idField, headers, altIdField, forceInsertNew) {
  if (!data) data = {};
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = resolveSheet_(ss, sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    ensureHeaders_(sheet, headers);
  }
  ensureHeaders_(sheet, headers);

  var values = sheet.getDataRange().getValues();
  var hdrs = values[0].map(function (h) { return String(h).trim(); });

  var normalized = {};
  Object.keys(data).forEach(function (k) { normalized[k] = data[k]; });

  // Map frontend field aliases
  if (data.booking_id && !normalized.BookingCode) normalized.BookingCode = data.booking_id;
  if (data.plate && !normalized.Plate) normalized.Plate = data.plate;
  if (data.requester && !normalized.Requester) normalized.Requester = data.requester;
  if (data.department && !normalized.Department) normalized.Department = data.department;
  if (data.destination && !normalized.Destination) normalized.Destination = data.destination;
  if (data.purpose && !normalized.Purpose) normalized.Purpose = data.purpose;
  if (data.start_date && !normalized.DepartureDate) normalized.DepartureDate = data.start_date;
  if (data.end_date && !normalized.ReturnDate) normalized.ReturnDate = data.end_date;
  if (data.start_time && !normalized.StartTime) normalized.StartTime = data.start_time;
  if (data.end_time && !normalized.EndTime) normalized.EndTime = data.end_time;
  if (data.status && !normalized.Status) normalized.Status = data.status;
  if (data.driver_name && !normalized.DriverName) normalized.DriverName = data.driver_name;
  if (data.vehicle_id && !normalized.VehicleID) normalized.VehicleID = data.vehicle_id;
  if (data.driver_id && !normalized.DriverID) normalized.DriverID = data.driver_id;
  if (data.notes && !normalized.Notes) normalized.Notes = data.notes;

  var isNew = forceInsertNew === true;
  var id = isNew ? '' : pickId_(normalized, idField, altIdField);

  if (isNew || !id || String(id).trim() === '') {
    isNew = true;
    var beYear = new Date().getFullYear() + 543;
    var uid = Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();
    id = 'BK-' + beYear + '-' + uid;
    normalized[idField] = id;
    if (altIdField) normalized[altIdField] = id;
  } else {
    normalized[idField] = id;
    if (altIdField && (!normalized[altIdField] || String(normalized[altIdField]).trim() === '')) {
      normalized[altIdField] = id;
    }
  }

  // แปลงคอลัมน์วันที่ทั้งหมดให้เป็นข้อความ Plain Text ป้องกันการสลับเดือน/วัน
  Object.keys(normalized).forEach(function (k) {
    if (/date|expire|due/i.test(k)) {
      normalized[k] = forceDateValue_(normalized[k]);
    }
  });

  normalized.UpdatedAt = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  if (!normalized.CreatedAt) normalized.CreatedAt = normalized.UpdatedAt;

  var rowIndex = -1;
  if (!isNew) {
    var idCol = hdrs.indexOf(idField);
    var altCol = altIdField ? hdrs.indexOf(altIdField) : -1;
    var idStr = String(id).trim();
    var altStr = (altIdField && normalized[altIdField]) ? String(normalized[altIdField]).trim() : '';

    for (var i = 1; i < values.length; i++) {
      var match = false;
      if (idCol >= 0 && idStr !== '') {
        if (String(values[i][idCol]).trim() === idStr) match = true;
      }
      if (!match && altCol >= 0 && altStr !== '') {
        if (String(values[i][altCol]).trim() === altStr) match = true;
      }
      if (match) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var row = hdrs.map(function (h) {
    return (normalized[h] !== undefined && normalized[h] !== null) ? normalized[h] : '';
  });

  var writtenRow;
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, hdrs.length).setValues([row]);
    writtenRow = rowIndex;
  } else {
    sheet.appendRow(row);
    writtenRow = sheet.getLastRow();
  }

  return {
    success: true,
    id: id,
    BookingCode: normalized.BookingCode || id,
    data: normalized,
    inserted: rowIndex < 0,
    row: writtenRow
  };
}

function deleteRow_(ss, sheetName, id, idField) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = resolveSheet_(ss, sheetName);
  if (!sheet) return { success: false, error: 'Sheet not found' };
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var idCol = headers.indexOf(idField);
  if (idCol < 0) return { success: false, error: 'ID field not found' };
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, deleted: id };
    }
  }
  return { success: false, error: 'Record not found' };
}