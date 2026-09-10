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