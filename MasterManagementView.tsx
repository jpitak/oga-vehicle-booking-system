import React, { useState, useEffect } from 'react';
import { User, Department, Driver, Vehicle, MasterLocationPurpose } from '../types';
import { apiService } from '../services/apiService';
import {
  Users,
  Building2,
  UserSquare2,
  Car,
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Shield,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface MasterManagementViewProps {
  onOpenDbSettings: () => void;
  onRefreshData?: () => void;
}

type MasterTab = 'users' | 'departments' | 'drivers' | 'vehicles' | 'destinations';

export const MasterManagementView: React.FC<MasterManagementViewProps> = ({
  onOpenDbSettings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ทั้งหมด');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Master Data State
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [masterItems, setMasterItems] = useState<MasterLocationPurpose[]>([]);

  // Modals
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    employeeId: '',
    department: 'ฝ่ายสนับสนุน',
    role: 'user',
    roleLabel: 'ผู้ใช้งาน',
    email: '',
    phone: '',
    drivingLicenseNo: '',
    drivingLicenseExpiry: '',
    status: 'active',
    avatar: '',
  });

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState<Partial<Department>>({
    code: '',
    name: '',
    managerName: '',
    contactPhone: '',
    description: '',
  });

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverForm, setDriverForm] = useState<Partial<Driver>>({
    name: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    status: 'available',
    experienceYears: 5,
    rating: 5.0,
  });

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterLocationPurpose | null>(null);
  const [itemForm, setItemForm] = useState<Partial<MasterLocationPurpose>>({
    category: 'destination',
    name: '',
    description: '',
    popular: true,
  });

  // Load all master data
  const loadData = () => {
    setUsers(apiService.getUsers());
    setDepartments(apiService.getDepartments());
    setDrivers(apiService.getDrivers());
    setVehicles(apiService.getVehicles());
    setMasterItems(apiService.getMasterItems());
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync with Google Sheet (Pull live data from Google Sheet)
  const [isPulling, setIsPulling] = useState(false);
  const handlePullFromSheet = async () => {
    setIsPulling(true);
    try {
      const res = await apiService.pullFromGoogleSheet();
      if (res.success) {
        showToast(res.message || 'ดึงข้อมูลสดจาก Google Sheet สำเร็จ 100%');
        loadData();
        if (onRefreshData) onRefreshData();
      } else {
        showToast(res.message || 'ดึงข้อมูลไม่สำเร็จ', 'error');
      }
    } catch (e: any) {
      showToast('เกิดข้อผิดพลาดในการดึงข้อมูล', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  // Push to Google Sheet
  const handleSyncAll = async () => {
    if (!window.confirm('⚠️ คุณต้องการส่งข้อมูล Master ทั้งหมดบนหน้านี้ไปบันทึกทับใน Google Sheet หรือไม่?')) {
      return;
    }
    setIsSyncing(true);
    try {
      const res = await apiService.syncAllToGoogleSheet();
      showToast(res.message || 'ส่งข้อมูล Master ทั้งหมดขึ้น Google Sheet เรียบร้อย 100%');
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      showToast('เกิดข้อผิดพลาดในการส่งข้อมูล', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // -------------------------------------------------------------
  // USER CRUD
  // -------------------------------------------------------------
  const handleOpenAddUser = () => {
    setEditingUser(null);
    const nextNum = users.length + 1;
    setUserForm({
      id: `u-${Date.now()}`,
      employeeId: `OGA-${1000 + nextNum}`,
      name: '',
      department: departments[0]?.name || 'ฝ่ายสนับสนุน',
      role: 'user',
      roleLabel: 'ผู้ใช้งาน',
      email: '',
      phone: '',
      drivingLicenseNo: '',
      drivingLicenseExpiry: '',
      status: 'active',
      avatar: '',
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({ ...u });
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name?.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุลของผู้จอง');
      return;
    }

    const roleLabels: Record<string, string> = {
      admin: 'ผู้ดูแลระบบ',
      approver1: 'หัวหน้า',
      approver2: 'ผู้อำนวยการ',
      driver: 'พนักงานขับรถ',
      user: 'ผู้ใช้งาน',
    };

    const userToSave: User = {
      id: editingUser ? editingUser.id : (userForm.id || `u-${Date.now()}`),
      employeeId: userForm.employeeId || `OGA-${1000 + users.length + 1}`,
      name: userForm.name.trim(),
      department: userForm.department || 'ฝ่ายสนับสนุน',
      role: userForm.role || 'user',
      roleLabel: roleLabels[userForm.role || 'user'] || 'ผู้ใช้งาน',
      avatar: userForm.avatar || userForm.name.trim().charAt(0),
      email: userForm.email || `${userForm.name.trim().replace(/\s+/g, '.').toLowerCase()}@ogainternational.com`,
      phone: userForm.phone || '081-000-0000',
      drivingLicenseNo: userForm.drivingLicenseNo,
      drivingLicenseExpiry: userForm.drivingLicenseExpiry,
      status: userForm.status || 'active',
    };

    const updated = apiService.saveUser(userToSave);
    setUsers(updated);
    setUserModalOpen(false);
    showToast(editingUser ? 'แก้ไขข้อมูลผู้จองสำเร็จ 100%' : 'เพิ่ม Master ผู้จองใหม่สำเร็จ 100%');
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (confirm(`คุณต้องการลบข้อมูลผู้จอง "${name}" ออกจาก Master และ Google Sheet หรือไม่?`)) {
      const updated = apiService.deleteUser(userId);
      setUsers(updated);
      showToast(`ลบข้อมูล "${name}" สำเร็จ`);
      if (onRefreshData) onRefreshData();
    }
  };

  // -------------------------------------------------------------
  // DEPARTMENT CRUD
  // -------------------------------------------------------------
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptForm({
      id: `dept-${Date.now()}`,
      code: `DEPT-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      managerName: '',
      contactPhone: '',
      description: '',
    });
    setDeptModalOpen(true);
  };

  const handleOpenEditDept = (d: Department) => {
    setEditingDept(d);
    setDeptForm({ ...d });
    setDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name?.trim()) {
      alert('กรุณาระบุชื่อฝ่าย/แผนก');
      return;
    }

    const deptToSave: Department = {
      id: editingDept ? editingDept.id : (deptForm.id || `dept-${Date.now()}`),
      code: deptForm.code?.trim() || `DEPT-${Date.now()}`,
      name: deptForm.name.trim(),
      managerName: deptForm.managerName?.trim() || '',
      contactPhone: deptForm.contactPhone?.trim() || '',
      description: deptForm.description?.trim() || '',
    };

    const updated = apiService.saveDepartment(deptToSave);
    setDepartments(updated);
    setDeptModalOpen(false);
    showToast(editingDept ? 'แก้ไขข้อมูลแผนกสำเร็จ' : 'เพิ่มแผนกใหม่สำเร็จ');
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteDept = (deptId: string, name: string) => {
    if (confirm(`คุณต้องการลบแผนก "${name}" หรือไม่?`)) {
      const updated = apiService.deleteDepartment(deptId);
      setDepartments(updated);
      showToast(`ลบแผนก "${name}" สำเร็จ`);
      if (onRefreshData) onRefreshData();
    }
  };

  // -------------------------------------------------------------
  // DRIVER CRUD
  // -------------------------------------------------------------
  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setDriverForm({
      id: `drv-${Date.now()}`,
      name: '',
      phone: '',
      licenseNumber: `DL-66-${Math.floor(100000 + Math.random() * 900000)}`,
      licenseExpiry: '31/12/2572',
      status: 'available',
      experienceYears: 5,
      rating: 5.0,
    });
    setDriverModalOpen(true);
  };

  const handleOpenEditDriver = (dr: Driver) => {
    setEditingDriver(dr);
    setDriverForm({ ...dr });
    setDriverModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name?.trim() || !driverForm.phone?.trim()) {
      alert('กรุณาระบุชื่อและเบอร์โทรศัพท์ของคนขับ');
      return;
    }

    const driverToSave: Driver = {
      id: editingDriver ? editingDriver.id : (driverForm.id || `drv-${Date.now()}`),
      name: driverForm.name.trim(),
      phone: driverForm.phone.trim(),
      licenseNumber: driverForm.licenseNumber?.trim() || '',
      licenseExpiry: driverForm.licenseExpiry || '31/12/2572',
      status: driverForm.status || 'available',
      experienceYears: Number(driverForm.experienceYears) || 1,
      rating: Number(driverForm.rating) || 5.0,
      avatar: driverForm.name.trim().charAt(0),
    };

    const updated = apiService.saveDriver(driverToSave);
    setDrivers(updated);
    setDriverModalOpen(false);
    showToast(editingDriver ? 'แก้ไขข้อมูลพนักงานขับรถสำเร็จ' : 'เพิ่มพนักงานขับรถสำเร็จ');
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteDriver = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบพนักงานขับรถ "${name}" หรือไม่?`)) {
      const updated = apiService.deleteDriver(id);
      setDrivers(updated);
      showToast(`ลบพนักงานขับรถ "${name}" สำเร็จ`);
      if (onRefreshData) onRefreshData();
    }
  };

  // -------------------------------------------------------------
  // MASTER ITEMS (DESTINATION / PURPOSE) CRUD
  // -------------------------------------------------------------
  const handleOpenAddItem = (cat: 'destination' | 'purpose') => {
    setEditingItem(null);
    setItemForm({
      id: `mi-${Date.now()}`,
      category: cat,
      name: '',
      description: '',
      popular: true,
    });
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MasterLocationPurpose) => {
    setEditingItem(item);
    setItemForm({ ...item });
    setItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name?.trim()) {
      alert('กรุณาระบุชื่อรายการ');
      return;
    }

    const itemToSave: MasterLocationPurpose = {
      id: editingItem ? editingItem.id : (itemForm.id || `mi-${Date.now()}`),
      category: itemForm.category || 'destination',
      name: itemForm.name.trim(),
      description: itemForm.description?.trim() || '',
      popular: !!itemForm.popular,
    };

    const updated = apiService.saveMasterItem(itemToSave);
    setMasterItems(updated);
    setItemModalOpen(false);
    showToast(editingItem ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลใหม่สำเร็จ');
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบ "${name}" หรือไม่?`)) {
      const updated = apiService.deleteMasterItem(id);
      setMasterItems(updated);
      showToast(`ลบ "${name}" สำเร็จ`);
      if (onRefreshData) onRefreshData();
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);

    const matchDept = filterDepartment === 'ทั้งหมด' || u.department === filterDepartment;
    return matchSearch && matchDept;
  });

  const sheetUrl = apiService.getSheetUrl();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl bg-slate-900 text-white border border-slate-700 animate-in slide-in-from-top-3">
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-sm font-medium">{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Master Data Management
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Google Sheet Live 100%
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              ระบบจัดการข้อมูล Master ผู้จอง & ข้อมูลหลัก
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              จัดการ Master ผู้จอง, แผนก, พนักงานขับรถ, ยานพาหนะ และจุดหมายปลายทาง สามารถ เพิ่ม-ลบ-แก้ไข ได้อย่างอิสระ พร้อมส่งข้อมูลตรงเข้า Google Sheet ทันที
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePullFromSheet}
              disabled={isPulling}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition border border-emerald-400/30 disabled:opacity-50 cursor-pointer"
              title="ดึงข้อมูลล่าสุดจาก Google Sheet มาอัปเดตบนหน้าเว็บ"
            >
              <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
              {isPulling ? 'กำลังดึงข้อมูลสด...' : '📥 ดึงข้อมูลล่าสุดจาก Google Sheet'}
            </button>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition border border-indigo-400/30 disabled:opacity-50 cursor-pointer"
              title="ส่งข้อมูลหน้าเว็บไปบันทึกลง Google Sheet"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'กำลังส่งข้อมูล...' : '📤 ส่งข้อมูลทั้งหมดไป Sheet (Push)'}
            </button>

            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg transition border border-emerald-400/30"
            >
              <FileSpreadsheet className="w-4 h-4" />
              เปิด Google Sheet
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              onClick={onOpenDbSettings}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-medium text-xs sm:text-sm flex items-center gap-2 transition border border-slate-700"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              ตั้งค่า Script
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Master ผู้จอง / ผู้ใช้งาน ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
            activeTab === 'departments'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Master แผนก / ฝ่าย ({departments.length})
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
            activeTab === 'drivers'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <UserSquare2 className="w-4 h-4" />
          Master พนักงานขับรถ ({drivers.length})
        </button>

        <button
          onClick={() => setActiveTab('destinations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
            activeTab === 'destinations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Master จุดหมาย & วัตถุประสงค์ ({masterItems.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MASTER USERS / ผู้จอง                             */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้จอง, รหัสพนักงาน, อีเมล, แผนก, เบอร์โทร..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 whitespace-nowrap">แผนก:</span>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                >
                  <option value="ทั้งหมด">ทุกแผนก ({users.length})</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleOpenAddUser}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม Master ผู้จองใหม่
            </button>
          </div>

          {/* Users Table / Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">ผู้จอง / พนักงาน</th>
                    <th className="py-3.5 px-4">รหัสพนักงาน</th>
                    <th className="py-3.5 px-4">แผนก / ฝ่าย</th>
                    <th className="py-3.5 px-4">บทบาท (Role)</th>
                    <th className="py-3.5 px-4">เบอร์โทร & อีเมล</th>
                    <th className="py-3.5 px-4">ใบขับขี่</th>
                    <th className="py-3.5 px-4 text-center">สถานะ</th>
                    <th className="py-3.5 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium">ไม่พบข้อมูลผู้จองตามเงื่อนไข</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center shadow-sm">
                              {u.avatar || u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {u.employeeId || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {u.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                              u.role === 'admin'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : u.role === 'approver1'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : u.role === 'approver2'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : u.role === 'driver'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {u.roleLabel || u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-slate-600 dark:text-slate-300">{u.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.drivingLicenseNo ? (
                            <div className="text-xs">
                              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{u.drivingLicenseNo}</span>
                              {u.drivingLicenseExpiry && (
                                <div className="text-[10px] text-slate-400">หมดอายุ: {u.drivingLicenseExpiry}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              u.status !== 'inactive'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {u.status !== 'inactive' ? 'พร้อมใช้งาน' : 'ระงับการใช้งาน'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                              title="ลบข้อมูล"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MASTER DEPARTMENTS / แผนก                          */}
      {/* ========================================================= */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">รายการแผนก / ฝ่าย (Master Departments)</h3>
              <p className="text-xs text-slate-500">จัดการข้อมูลแผนก หัวหน้าฝ่าย และเบอร์ติดต่อ</p>
            </div>
            <button
              onClick={handleOpenAddDept}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              เพิ่มแผนกใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const memberCount = users.filter((u) => u.department === dept.name).length;
              return (
                <div
                  key={dept.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-slate-400">{dept.code}</span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{dept.name}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEditDept(dept)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDept(dept.id, dept.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {dept.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>หัวหน้าฝ่าย (ผู้อนุมัติ):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{dept.managerName || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>เบอร์ติดต่อ:</span>
                      <span className="font-mono">{dept.contactPhone || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>จำนวนสมาชิก:</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        {memberCount} คน
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MASTER DRIVERS / พนักงานขับรถ                      */}
      {/* ========================================================= */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">รายการพนักงานขับรถ (Master Drivers)</h3>
              <p className="text-xs text-slate-500">จัดการข้อมูลคนขับรถ เบอร์ติดต่อ เลขใบขับขี่ และสถานะความพร้อม</p>
            </div>
            <button
              onClick={handleOpenAddDriver}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              เพิ่มพนักงานขับรถ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((dr) => (
              <div
                key={dr.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 font-extrabold text-lg flex items-center justify-center border border-emerald-500/20">
                      {dr.avatar || dr.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{dr.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{dr.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditDriver(dr)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(dr.id, dr.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>เลขที่ใบขับขี่:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{dr.licenseNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>วันหมดอายุ:</span>
                    <span className="text-slate-700 dark:text-slate-300">{dr.licenseExpiry}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ประสบการณ์:</span>
                    <span>{dr.experienceYears || 5} ปี (คะแนน ⭐ {dr.rating || 5.0})</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span>สถานะการทำงาน:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        dr.status === 'available'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : dr.status === 'on_trip'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {dr.status === 'available' ? 'พร้อมขับ' : dr.status === 'on_trip' ? 'กำลังเดินทาง' : 'พักงาน'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MASTER DESTINATIONS & PURPOSES                     */}
      {/* ========================================================= */}
      {activeTab === 'destinations' && (
        <div className="space-y-6">
          {/* Destinations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  Master จุดหมายปลายทางยอดนิยม (Preset Destinations)
                </h3>
                <p className="text-xs text-slate-500">สถานที่ปลายทางที่ใช้งานบ่อยสำหรับให้ผู้จองเลือกอย่างรวดเร็ว</p>
              </div>
              <button
                onClick={() => handleOpenAddItem('destination')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> เพิ่มสถานที่
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {masterItems
                .filter((item) => item.category === 'destination')
                .map((dest) => (
                  <div
                    key={dest.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {dest.name}
                        {dest.popular && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                            ยอดนิยม
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{dest.description || 'ไม่มีคำอธิบาย'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditItem(dest)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(dest.id, dest.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Purposes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Master วัตถุประสงค์การใช้รถ (Preset Purposes)
                </h3>
                <p className="text-xs text-slate-500">เหตุผลการขอใช้รถสำหรับ Dropdown ฟอร์มการจอง</p>
              </div>
              <button
                onClick={() => handleOpenAddItem('purpose')}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> เพิ่มวัตถุประสงค์
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {masterItems
                .filter((item) => item.category === 'purpose')
                .map((pur) => (
                  <div
                    key={pur.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {pur.name}
                        {pur.popular && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                            ยอดนิยม
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{pur.description || 'ไม่มีคำอธิบาย'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditItem(pur)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(pur.id, pur.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT MASTER USER                           */}
      {/* ========================================================= */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {editingUser ? 'แก้ไข Master ผู้จอง / ผู้ใช้งาน' : 'เพิ่ม Master ผู้จองใหม่'}
                  </h3>
                  <p className="text-xs text-slate-500">บันทึกข้อมูลและซิงค์ตรงเข้า Google Sheet อัตโนมัติ</p>
                </div>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสพนักงาน (Employee ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.employeeId}
                    onChange={(e) => setUserForm({ ...userForm, employeeId: e.target.value })}
                    placeholder="OGA-1008"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ-นามสกุล ผู้จอง *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="นายสมเกียรติ มั่นคง"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    แผนก / ฝ่าย *
                  </label>
                  <select
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    สิทธิ์ / บทบาทในระบบ (Role) *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  >
                    <option value="user">ผู้ใช้งานทั่วไป (จองรถ)</option>
                    <option value="approver1">หัวหน้าฝ่าย (ผู้อนุมัติขั้น 1)</option>
                    <option value="approver2">ผู้อำนวยการ / ผู้บริหาร (ผู้อนุมัติขั้น 2)</option>
                    <option value="driver">พนักงานขับรถ</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรศัพท์มือถือ *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="081-234-5678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    อีเมล (Email)
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="user@ogainternational.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เลขที่ใบอนุญาตขับขี่ (กรณีขับเอง)
                  </label>
                  <input
                    type="text"
                    value={userForm.drivingLicenseNo}
                    onChange={(e) => setUserForm({ ...userForm, drivingLicenseNo: e.target.value })}
                    placeholder="DL-66-123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วันหมดอายุใบขับขี่
                  </label>
                  <input
                    type="text"
                    value={userForm.drivingLicenseExpiry}
                    onChange={(e) => setUserForm({ ...userForm, drivingLicenseExpiry: e.target.value })}
                    placeholder="31/12/2572"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สถานะการใช้งาน
                </label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                >
                  <option value="active">🟢 พร้อมใช้งาน (Active)</option>
                  <option value="inactive">⚪ ระงับการใช้งาน (Inactive)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  บันทึกข้อมูล Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT DEPARTMENT                            */}
      {/* ========================================================= */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {editingDept ? 'แก้ไข Master แผนก / ฝ่าย' : 'เพิ่ม Master แผนกใหม่'}
                  </h3>
                  <p className="text-xs text-slate-500">กำหนดชื่อฝ่าย รหัส และหัวหน้าฝ่ายผู้อนุมัติ</p>
                </div>
              </div>
              <button
                onClick={() => setDeptModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสแผนก (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    placeholder="DEPT-SALES"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อแผนก / ฝ่าย *
                  </label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    placeholder="ฝ่ายขายและการตลาด"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    หัวหน้าฝ่าย (ผู้อนุมัติ)
                  </label>
                  <input
                    type="text"
                    value={deptForm.managerName}
                    onChange={(e) => setDeptForm({ ...deptForm, managerName: e.target.value })}
                    placeholder="นายวิชาญ เกียรติสุข"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์ติดต่อภายใน / ตรง
                  </label>
                  <input
                    type="text"
                    value={deptForm.contactPhone}
                    onChange={(e) => setDeptForm({ ...deptForm, contactPhone: e.target.value })}
                    placeholder="02-123-4507"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รายละเอียด / หน้าที่รับผิดชอบ
                </label>
                <textarea
                  rows={3}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="รายละเอียดหน้าที่งาน และขอบเขตงานของฝ่าย..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  บันทึกแผนก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD / EDIT DRIVER                                */}
      {/* ========================================================= */}
      {driverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <UserSquare2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {editingDriver ? 'แก้ไข Master พนักงานขับรถ' : 'เพิ่ม Master พนักงานขับรถใหม่'}
                  </h3>
                  <p className="text-xs text-slate-500">ข้อมูลคนขับรถประจำกองยานพาหนะ OGA</p>
                </div>
              </div>
              <button
                onClick={() => setDriverModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ-นามสกุล คนขับ *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    placeholder="นายสมศักดิ์ ขับดี"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรศัพท์ติดต่อ *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    placeholder="084-999-3344"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เลขที่ใบอนุญาตขับขี่
                  </label>
                  <input
                    type="text"
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                    placeholder="DL-66-889912"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วันหมดอายุใบขับขี่
                  </label>
                  <input
                    type="text"
                    value={driverForm.licenseExpiry}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                    placeholder="31/12/2572"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    สถานะการทำงาน
                  </label>
                  <select
                    value={driverForm.status}
                    onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  >
                    <option value="available">🟢 พร้อมปฏิบัติงาน (Available)</option>
                    <option value="on_trip">🟡 กำลังเดินทาง (On Trip)</option>
                    <option value="off_duty">⚪ พักงาน / ลาหยุด (Off Duty)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ประสบการณ์ (ปี)
                  </label>
                  <input
                    type="number"
                    value={driverForm.experienceYears}
                    onChange={(e) => setDriverForm({ ...driverForm, experienceYears: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDriverModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  บันทึกพนักงานขับรถ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD / EDIT MASTER ITEM (LOCATION/PURPOSE)        */}
      {/* ========================================================= */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  {itemForm.category === 'destination' ? <MapPin className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {editingItem ? 'แก้ไข Master Item' : itemForm.category === 'destination' ? 'เพิ่มสถานที่ปลายทาง' : 'เพิ่มวัตถุประสงค์การใช้รถ'}
                  </h3>
                  <p className="text-xs text-slate-500">บันทึกข้อมูลเพื่อใช้ในระบบการจอง</p>
                </div>
              </div>
              <button
                onClick={() => setItemModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ประเภทข้อมูล *
                </label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                >
                  <option value="destination">📍 สถานที่ปลายทาง (Destination)</option>
                  <option value="purpose">✨ วัตถุประสงค์การใช้รถ (Purpose)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อรายการ *
                </label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder={itemForm.category === 'destination' ? 'เช่น นิคมอุตสาหกรรมบางปู' : 'เช่น ส่งมอบงานและติดตั้งระบบ'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  คำอธิบายเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="คำอธิบายสั้นๆ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={itemForm.popular}
                  onChange={(e) => setItemForm({ ...itemForm, popular: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="popularCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  แสดงเป็นรายการยอดนิยม (Quick Select)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
