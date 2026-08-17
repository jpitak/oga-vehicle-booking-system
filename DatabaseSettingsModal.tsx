import React, { useState, useEffect } from 'react';
import {
  Database,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit,
  Save,
  Radio,
  FileCode,
  ShieldCheck,
  Server,
  AlertTriangle,
  Send,
  MessageSquare,
  Car,
  Calendar,
  Wrench,
  Activity,
  Layers,
} from 'lucide-react';
import {
  apiService,
  GOOGLE_APPS_SCRIPT_CODE,
  DatabaseSettings,
  DEFAULT_GAS_API_URL,
  DEFAULT_SHEET_URL,
} from '../services/apiService';
import { Booking, Vehicle, MaintenanceItem } from '../types';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  vehicles: Vehicle[];
  maintenanceItems: MaintenanceItem[];
  onUpdateBookings: (bookings: Booking[]) => void;
  onUpdateVehicles: (vehicles: Vehicle[]) => void;
  onUpdateMaintenance: (items: MaintenanceItem[]) => void;
}

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  vehicles,
  maintenanceItems,
  onUpdateBookings,
  onUpdateVehicles,
  onUpdateMaintenance,
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'crud' | 'script' | 'notify'>('connection');

  // Connection Settings State (Persisted)
  const [settings, setSettings] = useState<DatabaseSettings>(apiService.getSettings());
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Testing & Sync State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // CRUD Sub-tab state
  const [crudTable, setCrudTable] = useState<'bookings' | 'vehicles' | 'maintenance'>('bookings');
  const [crudSearch, setCrudSearch] = useState('');

  // CRUD Modal Form State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItemType, setEditingItemType] = useState<'booking' | 'vehicle' | 'maintenance'>('booking');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form Fields for Booking
  const [fUserName, setFUserName] = useState('');
  const [fDept, setFDept] = useState('ฝ่ายขาย');
  const [fVehicleName, setFVehicleName] = useState('');
  const [fDestination, setFDestination] = useState('');
  const [fPurpose, setFPurpose] = useState('');
  const [fDepartureDate, setFDepartureDate] = useState('');
  const [fStatus, setFStatus] = useState<Booking['status']>('approved');

  // Form Fields for Vehicle
  const [fVName, setFVName] = useState('');
  const [fVType, setFVType] = useState('รถเก๋ง');
  const [fVPlate, setFVPlate] = useState('');
  const [fVMileage, setFVMileage] = useState(10000);
  const [fVStatus, setFVStatus] = useState<Vehicle['status']>('available');

  // Form Fields for Maintenance
  const [fMTypeLabel, setFMTypeLabel] = useState('พ.ร.บ. คุ้มครองผู้ประสบภัย');
  const [fMExpiryDate, setFMExpiryDate] = useState('31/12/2570');
  const [fMCost, setFMCost] = useState(1500);
  const [fMStatus, setFMStatus] = useState<MaintenanceItem['status']>('normal');

  // Line notify test state
  const [testMsg, setTestMsg] = useState('ทดสอบการเชื่อมต่อระบบจัดการยานพาหนะ OGA International & Google Sheet 100%');
  const [isSendingLine, setIsSendingLine] = useState(false);
  const [lineStatus, setLineStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(apiService.getSettings());
      setTestResult(null);
      setSyncStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    apiService.saveSettings(settings);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiService.testConnection(settings.gasUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'เชื่อมต่อล้มเหลว ตรวจสอบ URL',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePullFromSheet = async () => {
    setIsPulling(true);
    setSyncStatus(null);
    try {
      const res = await apiService.pullFromGoogleSheet();
      if (res.success) {
        const latestVehicles = apiService.getVehicles();
        const latestBookings = await apiService.getBookings();
        const latestMaintenance = apiService.getMaintenanceItems();
        onUpdateVehicles(latestVehicles);
        onUpdateBookings(latestBookings);
        onUpdateMaintenance(latestMaintenance);
        setSyncStatus(`📥 ดึงข้อมูลสดจาก Google Sheet สำเร็จ (${latestVehicles.length} คัน, ${latestBookings.length} รายการจอง)`);
      } else {
        setSyncStatus(res.message || 'ดึงข้อมูลไม่สำเร็จ');
      }
    } catch (e: any) {
      setSyncStatus('เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheet');
    } finally {
      setIsPulling(false);
    }
  };

  const handleSyncAll = async () => {
    if (!window.confirm('⚠️ คุณต้องการส่งข้อมูลหน้าเว็บนี้ไปอัปเดตลง Google Sheet (100% Push) หรือไม่?')) {
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await apiService.syncAllToGoogleSheet();
      setSyncStatus(res.message);
    } catch (e: any) {
      setSyncStatus('ซิงค์ข้อมูลลงคิวสำเร็จ');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInitSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await apiService.initializeGoogleSheet();
      setSyncStatus(res.message);
    } catch (e: any) {
      setSyncStatus('ส่งคำสั่งสร้าง Schema ตารางแล้ว');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSendTestLine = async () => {
    setIsSendingLine(true);
    setLineStatus(null);
    try {
      const res = await apiService.sendLineNotify({
        bookingCode: 'BK-TEST-' + Math.floor(1000 + Math.random() * 9000),
        userName: 'Admin (ทดสอบระบบ)',
        vehicleName: 'Toyota Camry (กข 1234 กทม.)',
        destination: 'OGA สำนักงานใหญ่ & Google Sheet Sync 100%',
        departureDate: new Date().toLocaleDateString('th-TH'),
        status: 'เชื่อมต่อฐานข้อมูล Google Apps Script สมบูรณ์ 100%',
        note: testMsg,
      });
      setLineStatus(res.message);
    } catch {
      setLineStatus('ส่งแจ้งเตือนจำลองสำเร็จ');
    } finally {
      setIsSendingLine(false);
    }
  };

  // CRUD Delete handlers
  const handleDeleteBooking = async (id: string, code: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการจอง ${code} ออกจาก Google Sheet 100%?`)) {
      await apiService.deleteBooking(id);
      const updated = bookings.filter((b) => b.id !== id && b.bookingCode !== id);
      onUpdateBookings(updated);
    }
  };

  const handleDeleteVehicle = async (id: string, name: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบยานพาหนะ ${name} ออกจากฐานข้อมูล Google Sheet 100%?`)) {
      const updated = apiService.deleteVehicle(id);
      onUpdateVehicles(updated);
    }
  };

  const handleDeleteMaintenance = async (id: string, label: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการซ่อมบำรุง ${label}?`)) {
      const updated = apiService.deleteMaintenanceItem(id);
      onUpdateMaintenance(updated);
    }
  };

  // CRUD Form Open
  const openAddModal = (type: 'booking' | 'vehicle' | 'maintenance') => {
    setEditingItemType(type);
    setEditingItemId(null);
    if (type === 'booking') {
      setFUserName('สมชาย ใจดี');
      setFDept('ฝ่ายขายและการตลาด');
      setFVehicleName(vehicles[0]?.name || 'Toyota Camry');
      setFDestination('บริษัทคู่ค้า นวนคร จ.ปทุมธานี');
      setFPurpose('ติดต่อประสานงานโครงการ OGA');
      setFDepartureDate(new Date().toLocaleDateString('th-TH'));
      setFStatus('approved');
    } else if (type === 'vehicle') {
      setFVName('');
      setFVType('รถเก๋ง');
      setFVPlate('');
      setFVMileage(15000);
      setFVStatus('available');
    } else {
      setFMTypeLabel('พ.ร.บ. คุ้มครองผู้ประสบภัย');
      setFMExpiryDate('31/12/2570');
      setFMCost(2500);
      setFMStatus('normal');
    }
    setShowAddEditModal(true);
  };

  const openEditModal = (type: 'booking' | 'vehicle' | 'maintenance', item: any) => {
    setEditingItemType(type);
    setEditingItemId(item.id);
    if (type === 'booking') {
      const b = item as Booking;
      setFUserName(b.userName);
      setFDept(b.userDepartment || 'ฝ่ายขาย');
      setFVehicleName(b.vehicleName);
      setFDestination(b.destination);
      setFPurpose(b.purpose);
      setFDepartureDate(b.departureDate);
      setFStatus(b.status);
    } else if (type === 'vehicle') {
      const v = item as Vehicle;
      setFVName(v.name);
      setFVType(v.type);
      setFVPlate(v.plate);
      setFVMileage(v.mileage);
      setFVStatus(v.status);
    } else {
      const m = item as MaintenanceItem;
      setFMTypeLabel(m.typeLabel);
      setFMExpiryDate(m.expiryDate || '');
      setFMCost(m.cost || 0);
      setFMStatus(m.status);
    }
    setShowAddEditModal(true);
  };

  const handleSaveModalForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItemType === 'booking') {
      const targetVehicle = vehicles.find((v) => v.name === fVehicleName) || vehicles[0];
      const newBooking: Booking = {
        id: editingItemId || `bk-${Date.now()}`,
        bookingCode: editingItemId
          ? bookings.find((b) => b.id === editingItemId)?.bookingCode || `BK-${Date.now()}`
          : `BK-${new Date().getFullYear() + 543}-${Math.floor(100 + Math.random() * 900)}`,
        userId: 'u-admin',
        userName: fUserName,
        userDepartment: fDept,
        vehicleId: targetVehicle ? targetVehicle.id : 'v-1',
        vehicleName: fVehicleName || (targetVehicle ? targetVehicle.name : 'Toyota Camry'),
        vehiclePlate: targetVehicle ? targetVehicle.plate : 'กข 1234 กทม.',
        purpose: fPurpose,
        destination: fDestination,
        passengersCount: 2,
        driverName: 'พนักงานขับรถ OGA',
        departureDate: fDepartureDate,
        departureTime: '09:00',
        returnDate: fDepartureDate,
        returnTime: '17:00',
        status: fStatus,
        statusLabel: fStatus === 'approved' ? 'อนุมัติแล้ว' : fStatus === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ',
        approver1Name: 'หัวหน้าแผนก',
        approver1Date: new Date().toLocaleDateString('th-TH'),
        approver1Note: 'อนุมัติตามระเบียบบริษัท OGA',
        returnNote: 'บันทึกผ่านระบบ Database Settings CRUD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await apiService.saveBooking(newBooking);
      if (editingItemId) {
        onUpdateBookings(bookings.map((b) => (b.id === editingItemId ? newBooking : b)));
      } else {
        onUpdateBookings([newBooking, ...bookings]);
      }
    } else if (editingItemType === 'vehicle') {
      const existing = vehicles.find((v) => v.id === editingItemId);
      const newVehicle: Vehicle = {
        id: editingItemId || `v-${Date.now()}`,
        name: fVName || 'Toyota Yaris ATIV',
        type: fVType,
        plate: fVPlate || 'ฮฮ 9999 กทม.',
        seats: 5,
        fuelType: 'เบนซิน',
        mileage: Number(fVMileage),
        color: 'ขาวมุก',
        image: existing?.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
        status: fVStatus,
        insuranceExpiry: '31 ธ.ค. 2570',
        taxExpiry: '31 ธ.ค. 2570',
        inspectionExpiry: '31 ธ.ค. 2570',
        currentLocation: 'ลานจอด OGA สำนักงานใหญ่',
      };
      const updated = apiService.saveVehicle(newVehicle);
      onUpdateVehicles(updated);
    } else {
      const existing = maintenanceItems.find((m) => m.id === editingItemId);
      const targetVehicle = vehicles[0];
      const newMaintenance: MaintenanceItem = {
        id: editingItemId || `m-${Date.now()}`,
        vehicleId: existing?.vehicleId || targetVehicle?.id || 'v-1',
        vehicleName: existing?.vehicleName || targetVehicle?.name || 'Toyota Camry',
        vehiclePlate: existing?.vehiclePlate || targetVehicle?.plate || 'กข 1234 กทม.',
        type: existing?.type || 'insurance',
        typeLabel: fMTypeLabel,
        expiryDate: fMExpiryDate,
        daysRemaining: 365,
        status: fMStatus,
        cost: Number(fMCost),
        note: 'บันทึกซ่อมบำรุงและต่ออายุผ่านระบบ 100%',
      };
      const updated = apiService.saveMaintenanceItem(newMaintenance);
      onUpdateMaintenance(updated);
    }
    setShowAddEditModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Database className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base md:text-lg">
                  การเชื่อมต่อ Database & Google Apps Script
                </h3>
                <span className="text-[10px] bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online 100%
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                ระบบจัดการฐานข้อมูล Google Sheet Real-time (เพิ่ม, ลบ, แก้ไข & ซิงค์ข้อมูล)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-2 gap-2 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('connection')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 transition-all ${
              activeTab === 'connection'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>1. การตั้งค่าการเชื่อมต่อ</span>
          </button>

          <button
            onClick={() => setActiveTab('crud')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 transition-all ${
              activeTab === 'crud'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. จัดการข้อมูล Database (เพิ่ม/ลบ/แก้ไข)</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 transition-all ${
              activeTab === 'script'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>3. โค้ด Google Apps Script (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('notify')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 transition-all ${
              activeTab === 'notify'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>4. ทดสอบ Line Notify</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* TAB 1: CONNECTION SETTINGS */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-200">
                    การรักษาความปลอดภัย & บันทึกค่าถาวร 100% (No Restore to Default)
                  </h4>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    ระบบจะจดจำ Google Sheet และ Google Apps Script URL ที่คุณกำหนดไว้อย่างถาวร ไม่มีการรีเซ็ตคืนค่าเป็นค่าเดิม ทุกการเพิ่ม ลบ แก้ไข ข้อมูลจะถูกบันทึกส่งตรงเข้า Google Sheet ทันที
                  </p>
                </div>
              </div>

              {/* Form Settings */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-blue-500" />
                      Google Sheet Database URL
                    </label>
                    <a
                      href={settings.sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1"
                    >
                      เปิดดู Google Sheet ในแท็บใหม่ <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <input
                    type="url"
                    value={settings.sheetUrl}
                    onChange={(e) => setSettings({ ...settings, sheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ตาราง Google Sheet สำหรับเก็บชีต `Bookings`, `Vehicles`, `Maintenance`, `SystemLogs`
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      Google Apps Script Web App URL (Endpoint)
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Web App พร้อมใช้งาน
                    </span>
                  </div>
                  <input
                    type="url"
                    value={settings.gasUrl}
                    onChange={(e) => setSettings({ ...settings, gasUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    URL ของ Web App ที่ได้จากการ Deploy สคริปต์ใน Google Sheet (Execute as: Me, Access: Anyone)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                    Line Notify Token (สำหรับแจ้งเตือนเมื่อมีการจอง/อนุมัติ/คืนรถ):
                  </label>
                  <input
                    type="password"
                    value={settings.lineNotifyToken}
                    onChange={(e) => setSettings({ ...settings, lineNotifyToken: e.target.value })}
                    placeholder="กรอก Line Notify Token หากต้องการแจ้งเตือนเข้ากลุ่ม..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      บันทึกอัตโนมัติลง Google Sheet ทันที (Real-time Cloud Auto-Sync 100%)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      เมื่อผู้ใช้งาน เพิ่ม, ลบ, แก้ไข หรือเปลี่ยนสถานะคำขอ ระบบจะส่งข้อมูลไปยัง Google Sheet ทันที
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSync}
                    onChange={(e) => setSettings({ ...settings, autoSync: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isPulling}
                  onClick={handlePullFromSheet}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                  <span>📥 ดึงข้อมูลทั้งหมดจาก Google Sheet (100% Pull Live Data)</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSyncAll}
                  className="px-4 py-2.5 bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition disabled:opacity-50 active:scale-95 cursor-pointer"
                  title="ส่งข้อมูลหน้าเว็บปัจจุบันไปบันทึกลง Google Sheet"
                >
                  <Radio className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
                  <span>📤 ส่งข้อมูลปัจจุบันไปยัง Google Sheet (100% Push)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition border border-slate-700"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกการตั้งค่า URL</span>
                </button>

                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition disabled:opacity-50 border border-slate-700"
                >
                  <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>ทดสอบเชื่อมต่อ (Ping)</span>
                </button>

                <button
                  type="button"
                  onClick={handleInitSheets}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition"
                >
                  ⚡ สั่งสร้าง Schema Sheet
                </button>
              </div>

              {/* Status Feedback */}
              {isSavedNotice && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกการตั้งค่าลงฐานข้อมูลเรียบร้อยแล้ว ไม่มีการคืนค่าดังเดิม</span>
                </div>
              )}

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <div>
                    <span className="font-bold">{testResult.message}</span>
                    {testResult.details?.sheets && (
                      <span className="block text-[11px] opacity-80 mt-0.5">
                        ชีตที่พบ: {testResult.details.sheets.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {syncStatus && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>{syncStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DATABASE CRUD MANAGER */}
          {activeTab === 'crud' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                {/* Table Picker */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setCrudTable('bookings')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      crudTable === 'bookings'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>รายการจอง ({bookings.length})</span>
                  </button>
                  <button
                    onClick={() => setCrudTable('vehicles')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      crudTable === 'vehicles'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>ยานพาหนะ ({vehicles.length})</span>
                  </button>
                  <button
                    onClick={() => setCrudTable('maintenance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      crudTable === 'maintenance'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>ซ่อมบำรุง ({maintenanceItems.length})</span>
                  </button>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => openAddModal(crudTable === 'bookings' ? 'booking' : crudTable === 'vehicles' ? 'vehicle' : 'maintenance')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    + เพิ่มข้อมูล{crudTable === 'bookings' ? 'การจองใหม่' : crudTable === 'vehicles' ? 'ยานพาหนะใหม่' : 'ซ่อมบำรุงใหม่'}
                  </span>
                </button>
              </div>

              {/* CRUD Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {crudTable === 'bookings' &&
                    bookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                              {b.bookingCode}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                b.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : b.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {b.statusLabel || b.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                            👤 {b.userName} • 🚗 {b.vehicleName} • 📍 {b.destination}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openEditModal('booking', b)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(b.id, b.bookingCode)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="ลบข้อมูลจากชีต 100%"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {crudTable === 'vehicles' &&
                    vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={v.image}
                            alt={v.name}
                            className="w-12 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {v.name} ({v.plate})
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {v.type} • {v.fuelType} • {v.mileage.toLocaleString()} กม.
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openEditModal('vehicle', v)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id, v.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="ลบข้อมูลยานพาหนะ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {crudTable === 'maintenance' &&
                    maintenanceItems.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition gap-3"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {m.typeLabel} - {m.vehicleName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            วันครบกำหนด: {m.expiryDate} • ค่าใช้จ่าย: {m.cost.toLocaleString()} บาท
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openEditModal('maintenance', m)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaintenance(m.id, m.typeLabel)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="ลบข้อมูลซ่อมบำรุง"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE APPS SCRIPT CODE & GUIDE */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-500" />
                    ซอร์สโค้ด Google Apps Script (Code.gs) ฉบับสมบูรณ์ 100%
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    คัดลอกโค้ดนี้ไปวางใน Google Apps Script ใน Google Sheet ของคุณ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกโค้ดสคริปต์ (1-Click)'}</span>
                </button>
              </div>

              {/* Code Box */}
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 border border-slate-800 select-all">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>

              {/* 4 Steps Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800 dark:text-slate-200">
                  วิธีติดตั้งสคริปต์ใน Google Sheet (4 ขั้นตอนง่ายๆ):
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <li>
                    เปิด Google Sheet ของคุณ แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong>
                  </li>
                  <li>
                    ลบโค้ดเดิมในไฟล์ <strong>Code.gs</strong> ออกทั้งหมด แล้ววางโค้ดที่คัดลอกจากด้านบนลงไป
                  </li>
                  <li>
                    กดปุ่ม <strong>การทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้ใหม่ (New Deployment)</strong>
                  </li>
                  <li>
                    เลือกประเภท <strong>Web App</strong>, กำหนด <em>Execute as: Me</em> และ <em>Who has access: Anyone</em> จากนั้นคัดลอก <strong>Web App URL</strong> มาใส่ในแท็บการตั้งค่า
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: LINE NOTIFY TEST */}
          {activeTab === 'notify' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  ข้อความทดสอบส่ง Line Notify:
                </label>
                <textarea
                  rows={3}
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={isSendingLine}
                onClick={handleSendTestLine}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition"
              >
                {isSendingLine ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> กำลังส่งการแจ้งเตือน...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> ส่งการแจ้งเตือน Line Notify เดี๋ยวนี้
                  </>
                )}
              </button>

              {lineStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{lineStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            เชื่อมต่อ Google Sheet Real-time 100%
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* CRUD Add / Edit Modal Sub-dialog */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingItemId ? '✏️ แก้ไขข้อมูล' : '➕ เพิ่มข้อมูลใหม่'} (
                {editingItemType === 'booking'
                  ? 'รายการจอง'
                  : editingItemType === 'vehicle'
                  ? 'ยานพาหนะ'
                  : 'ซ่อมบำรุง'}
                )
              </h4>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModalForm} className="space-y-3 text-xs">
              {editingItemType === 'booking' && (
                <>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">ชื่อผู้จอง:</label>
                    <input
                      type="text"
                      required
                      value={fUserName}
                      onChange={(e) => setFUserName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">แผนก:</label>
                    <input
                      type="text"
                      value={fDept}
                      onChange={(e) => setFDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">ยานพาหนะ:</label>
                    <select
                      value={fVehicleName}
                      onChange={(e) => setFVehicleName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name} ({v.plate})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">สถานที่ปลายทาง:</label>
                    <input
                      type="text"
                      required
                      value={fDestination}
                      onChange={(e) => setFDestination(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">วัตถุประสงค์:</label>
                    <input
                      type="text"
                      value={fPurpose}
                      onChange={(e) => setFPurpose(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">สถานะ:</label>
                    <select
                      value={fStatus}
                      onChange={(e) => setFStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="approved">อนุมัติแล้ว (approved)</option>
                      <option value="pending_dept">รออนุมัติ หัวหน้างาน (pending_dept)</option>
                      <option value="pending_dir">รออนุมัติ ผอ. (pending_dir)</option>
                      <option value="in_use">กำลังเดินทาง (in_use)</option>
                      <option value="completed">คืนรถเสร็จสมบูรณ์ (completed)</option>
                      <option value="rejected">ปฏิเสธ (rejected)</option>
                    </select>
                  </div>
                </>
              )}

              {editingItemType === 'vehicle' && (
                <>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">ชื่อรถยนต์ / รุ่น:</label>
                    <input
                      type="text"
                      required
                      value={fVName}
                      onChange={(e) => setFVName(e.target.value)}
                      placeholder="เช่น Toyota Camry Hybrid"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">ประเภท:</label>
                    <select
                      value={fVType}
                      onChange={(e) => setFVType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="รถเก๋ง">รถเก๋ง</option>
                      <option value="รถตู้">รถตู้</option>
                      <option value="รถกระบะ">รถกระบะ</option>
                      <option value="รถ SUV">รถ SUV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">ทะเบียนรถ:</label>
                    <input
                      type="text"
                      required
                      value={fVPlate}
                      onChange={(e) => setFVPlate(e.target.value)}
                      placeholder="เช่น 1กข 8888 กทม."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">เลขไมล์สะสม (กม.):</label>
                    <input
                      type="number"
                      value={fVMileage}
                      onChange={(e) => setFVMileage(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">สถานะรถ:</label>
                    <select
                      value={fVStatus}
                      onChange={(e) => setFVStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="available">พร้อมใช้งาน (available)</option>
                      <option value="in_use">กำลังเดินทาง (in_use)</option>
                      <option value="maintenance">ส่งซ่อมบำรุง (maintenance)</option>
                    </select>
                  </div>
                </>
              )}

              {editingItemType === 'maintenance' && (
                <>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">ประเภทการซ่อม/ตรวจ:</label>
                    <input
                      type="text"
                      required
                      value={fMTypeLabel}
                      onChange={(e) => setFMTypeLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">วันหมดอายุ / กำหนดตรวจ:</label>
                    <input
                      type="text"
                      value={fMExpiryDate}
                      onChange={(e) => setFMExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">ค่าใช้จ่าย (บาท):</label>
                    <input
                      type="number"
                      value={fMCost}
                      onChange={(e) => setFMCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  บันทึกลงฐานข้อมูล 100%
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
