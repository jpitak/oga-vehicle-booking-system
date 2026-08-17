import React, { useState } from 'react';
import { MaintenanceItem, RepairOrder, RepairCategory, RepairOrderStatus, Vehicle, User } from '../types';
import { apiService } from '../services/apiService';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Calendar,
  X,
  FileCheck,
  FileText,
  Truck,
  Car,
  DollarSign,
  UserCheck,
  MapPin,
  Phone,
  Edit3,
  Trash2,
  ChevronRight,
  Printer,
  Check,
  ArrowRight,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

interface MaintenanceViewProps {
  currentUser?: User;
  maintenanceItems: MaintenanceItem[];
  vehicles: Vehicle[];
  onUpdateMaintenance: (updatedList: MaintenanceItem[]) => void;
  onUpdateVehicles?: (updatedList: Vehicle[]) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  currentUser,
  maintenanceItems,
  vehicles,
  onUpdateMaintenance,
  onUpdateVehicles,
}) => {
  // Tab Switcher: 'repairs' (รายการส่งซ่อมบำรุง) vs 'alerts' (การแจ้งเตือนหมดอายุ & เช็คระยะ)
  const [activeTab, setActiveTab] = useState<'repairs' | 'alerts'>('repairs');

  // Repair Orders Data State
  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>(() => apiService.getRepairOrders());
  const [repairFilterStatus, setRepairFilterStatus] = useState<'all' | RepairOrderStatus>('all');
  const [repairCategoryFilter, setRepairCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Alerts State
  const [alertFilterStatus, setAlertFilterStatus] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const [selectedAlertItem, setSelectedAlertItem] = useState<MaintenanceItem | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('31/12/2570');
  const [serviceCost, setServiceCost] = useState(3500);
  const [serviceNote, setServiceNote] = useState('');

  // Repair Order Form Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<RepairOrder | null>(null);
  const [viewingDetailOrder, setViewingDetailOrder] = useState<RepairOrder | null>(null);

  // Form Fields State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || 'v-1');
  const [repairCategory, setRepairCategory] = useState<RepairCategory>('general');
  const [issueDescription, setIssueDescription] = useState('');
  const [repairDetails, setRepairDetails] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.toLocaleDateString('th-TH')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [estimatedReturnDate, setEstimatedReturnDate] = useState(() => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    return `${future.toLocaleDateString('th-TH')} 17:00`;
  });
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [garageName, setGarageName] = useState('');
  const [garageContact, setGarageContact] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [repairCost, setRepairCost] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'company_billing'>('company_billing');
  const [orderStatus, setOrderStatus] = useState<RepairOrderStatus>('in_progress');
  const [orderNote, setOrderNote] = useState('');
  const [requesterName, setRequesterName] = useState(currentUser?.name || 'นายพิทักษ์ จุ้ยสัมพันธ์');
  const [requesterDepartment, setRequesterDepartment] = useState(currentUser?.department || 'ฝ่ายเทคโนโลยีและยานพาหนะ');
  const [vehicleMileage, setVehicleMileage] = useState<number>(vehicles[0]?.mileage || 45000);

  // Stats calculation
  const inProgressRepairsCount = repairOrders.filter((r) => r.status === 'in_progress').length;
  const pendingRepairsCount = repairOrders.filter((r) => r.status === 'pending').length;
  const completedRepairsCount = repairOrders.filter((r) => r.status === 'completed').length;
  const returnedRepairsCount = repairOrders.filter((r) => r.status === 'returned').length;
  const totalRepairCost = repairOrders.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  const criticalCount = maintenanceItems.filter((m) => m.status === 'critical').length;
  const warningCount = maintenanceItems.filter((m) => m.status === 'warning').length;
  const normalCount = maintenanceItems.filter((m) => m.status === 'normal').length;

  // Category labels helper
  const getCategoryLabel = (cat: RepairCategory): string => {
    switch (cat) {
      case 'general':
        return 'งานซ่อมทั่วไป';
      case 'periodic_service':
        return 'เช็คระยะตามรอบ / ถ่ายน้ำมันเครื่อง';
      case 'gas_system':
        return 'ระบบแก๊ส LPG / NGV (Dual Fuel)';
      case 'engine_trans':
        return 'เครื่องยนต์ & ระบบส่งกำลัง';
      case 'brake_suspension':
        return 'เบรก / ช่วงล่าง / ยาง';
      case 'ac_electrical':
        return 'ระบบแอร์ & ระบบไฟฟ้า';
      case 'body_paint':
        return 'ตัวถัง / สี / เคลมประกัน';
      default:
        return 'ซ่อมบำรุงทั่วไป';
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingOrder(null);
    const defaultVeh = vehicles[0] || { id: 'v-1', mileage: 45000, name: 'Toyota' };
    setSelectedVehicleId(defaultVeh.id);
    setVehicleMileage(defaultVeh.mileage || 0);
    setRepairCategory('general');
    setIssueDescription('');
    setRepairDetails('');
    setPartsReplaced('');
    const now = new Date();
    setStartDate(`${now.toLocaleDateString('th-TH')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    setEstimatedReturnDate(`${future.toLocaleDateString('th-TH')} 17:00`);
    setActualReturnDate('');
    setGarageName('ศูนย์บริการมาตรฐาน OGA Fleet');
    setGarageContact('02-678-9000');
    setTechnicianName('');
    setInvoiceNo(`WO-${now.getFullYear() + 543}-${String(repairOrders.length + 1).padStart(3, '0')}`);
    setRepairCost(0);
    setPaymentStatus('company_billing');
    setOrderStatus('in_progress');
    setOrderNote('');
    setRequesterName(currentUser?.name || 'นายพิทักษ์ จุ้ยสัมพันธ์');
    setRequesterDepartment(currentUser?.department || 'ฝ่ายเทคโนโลยีและยานพาหนะ');
    setIsOrderModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (order: RepairOrder) => {
    setEditingOrder(order);
    setSelectedVehicleId(order.vehicleId);
    setVehicleMileage(order.vehicleMileage || 0);
    setRepairCategory(order.repairCategory);
    setIssueDescription(order.issueDescription || '');
    setRepairDetails(order.repairDetails || '');
    setPartsReplaced(order.partsReplaced || '');
    setStartDate(order.startDate || '');
    setEstimatedReturnDate(order.estimatedReturnDate || '');
    setActualReturnDate(order.actualReturnDate || '');
    setGarageName(order.garageName || '');
    setGarageContact(order.garageContact || '');
    setTechnicianName(order.technicianName || '');
    setInvoiceNo(order.invoiceNo || order.orderCode);
    setRepairCost(order.cost || 0);
    setPaymentStatus(order.paymentStatus || 'company_billing');
    setOrderStatus(order.status);
    setOrderNote(order.note || '');
    setRequesterName(order.requesterName || '');
    setRequesterDepartment(order.requesterDepartment || '');
    setIsOrderModalOpen(true);
  };

  // Vehicle change handler in Modal
  const handleVehicleChange = (vehId: string) => {
    setSelectedVehicleId(vehId);
    const targetVeh = vehicles.find((v) => v.id === vehId);
    if (targetVeh) {
      setVehicleMileage(targetVeh.mileage || 0);
    }
  };

  // Save Repair Order Handler
  const handleSaveRepairOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
    const orderCode = editingOrder?.orderCode || invoiceNo || `WO-2569-${String(Date.now()).slice(-3)}`;

    const newOrUpdatedOrder: RepairOrder = {
      id: editingOrder?.id || `ro-${Date.now()}`,
      orderCode,
      vehicleId: veh.id,
      vehicleName: veh.name,
      vehiclePlate: veh.plate,
      vehicleMileage: Number(vehicleMileage) || veh.mileage || 0,
      repairCategory,
      repairCategoryLabel: getCategoryLabel(repairCategory),
      issueDescription: issueDescription.trim() || 'แจ้งซ่อมบำรุงตามระยะ/อาการทั่วไป',
      repairDetails: repairDetails.trim() || 'ตรวจเช็คและแก้ไขตามมาตรฐานช่าง',
      partsReplaced: partsReplaced.trim(),
      startDate: startDate.trim(),
      estimatedReturnDate: estimatedReturnDate.trim(),
      actualReturnDate: orderStatus === 'returned' && !actualReturnDate ? new Date().toLocaleDateString('th-TH') : actualReturnDate.trim(),
      garageName: garageName.trim() || 'ศูนย์บริการมาตรฐาน OGA Fleet',
      garageContact: garageContact.trim(),
      technicianName: technicianName.trim(),
      invoiceNo: invoiceNo.trim() || orderCode,
      cost: Number(repairCost) || 0,
      paymentStatus,
      requesterName: requesterName.trim() || currentUser?.name || 'แอดมิน OGA',
      requesterDepartment: requesterDepartment.trim() || 'ฝ่ายยานพาหนะ',
      status: orderStatus,
      note: orderNote.trim(),
      createdAt: editingOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = apiService.saveRepairOrder(newOrUpdatedOrder);
    setRepairOrders(updatedList);

    // Sync vehicle status:
    // If order status is in_progress -> vehicle status becomes 'maintenance'
    // If order status is returned -> vehicle status becomes 'available' (if not currently booked)
    if (veh) {
      let nextVehStatus: Vehicle['status'] = veh.status;
      if (orderStatus === 'in_progress') {
        nextVehStatus = 'maintenance';
      } else if (orderStatus === 'returned' && veh.status === 'maintenance') {
        nextVehStatus = 'available';
      }

      if (nextVehStatus !== veh.status) {
        apiService.updateVehicleStatus(veh.id, nextVehStatus);
        if (onUpdateVehicles) {
          const currentVehicles = apiService.getVehicles();
          onUpdateVehicles(currentVehicles);
        }
      }
    }

    // Add Notification
    apiService.addNotification({
      title: editingOrder ? 'อัปเดตใบสั่งซ่อมบำรุงเรียบร้อย' : 'เปิดใบสั่งซ่อมบำรุงใหม่',
      message: `${veh.name} (${veh.plate}) - ${getCategoryLabel(repairCategory)} (${orderCode})`,
      type: 'maintenance',
    });

    setIsOrderModalOpen(false);
    setEditingOrder(null);
  };

  // Delete Repair Order
  const handleDeleteRepairOrder = (orderId: string) => {
    if (window.confirm('คุณต้องการลบรายการส่งซ่อมนี้ใช่หรือไม่?')) {
      const updated = apiService.deleteRepairOrder(orderId);
      setRepairOrders(updated);
      if (viewingDetailOrder?.id === orderId) {
        setViewingDetailOrder(null);
      }
    }
  };

  // Quick Mark as Returned
  const handleQuickReturn = (order: RepairOrder) => {
    const returnDateStr = new Date().toLocaleDateString('th-TH');
    const updatedOrder: RepairOrder = {
      ...order,
      status: 'returned',
      actualReturnDate: returnDateStr,
      updatedAt: new Date().toISOString(),
    };
    const updatedList = apiService.saveRepairOrder(updatedOrder);
    setRepairOrders(updatedList);

    // Update vehicle status back to available
    apiService.updateVehicleStatus(order.vehicleId, 'available');
    if (onUpdateVehicles) {
      onUpdateVehicles(apiService.getVehicles());
    }

    apiService.addNotification({
      title: 'บันทึกรับรถคืนเข้า Fleet สำเร็จ',
      message: `${order.vehicleName} (${order.vehiclePlate}) ซ่อมเสร็จและรับรถคืนเรียบร้อย พร้อมใช้งานทันที`,
      type: 'maintenance',
    });

    if (viewingDetailOrder?.id === order.id) {
      setViewingDetailOrder(updatedOrder);
    }
  };

  // Quick Renew Expiry Alert
  const handleRenewService = () => {
    if (!selectedAlertItem) return;

    const updatedItem: MaintenanceItem = {
      ...selectedAlertItem,
      expiryDate: newExpiryDate,
      daysRemaining: 365,
      status: 'normal',
      cost: serviceCost,
      note: serviceNote,
    };

    const updatedList = apiService.saveMaintenanceItem(updatedItem);
    onUpdateMaintenance(updatedList);

    apiService.addNotification({
      title: `ต่ออายุ/ตรวจสภาพสำเร็จ`,
      message: `${selectedAlertItem.vehicleName} (${selectedAlertItem.typeLabel}) ต่ออายุถึง ${newExpiryDate}`,
      type: 'maintenance',
    });

    setSelectedAlertItem(null);
  };

  // Filter Repair Orders
  const filteredRepairOrders = repairOrders.filter((order) => {
    if (repairFilterStatus !== 'all' && order.status !== repairFilterStatus) return false;
    if (repairCategoryFilter !== 'all' && order.repairCategory !== repairCategoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.vehicleName.toLowerCase().includes(term) ||
        order.vehiclePlate.toLowerCase().includes(term) ||
        order.orderCode.toLowerCase().includes(term) ||
        order.garageName.toLowerCase().includes(term) ||
        order.issueDescription.toLowerCase().includes(term) ||
        order.repairDetails.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Filter Expiry Alerts
  const filteredAlertItems = maintenanceItems.filter((item) => {
    if (alertFilterStatus !== 'all' && item.status !== alertFilterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.vehicleName.toLowerCase().includes(term) ||
        item.vehiclePlate.toLowerCase().includes(term) ||
        item.typeLabel.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Status Badge Rendering
  const renderStatusBadge = (status: RepairOrderStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            อยู่ระหว่างส่งซ่อม
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3 h-3" />
            รอดำเนินการ
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3" />
            ซ่อมเสร็จ รอรับรถ
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Check className="w-3 h-3" />
            รับรถคืนแล้ว (พร้อมใช้งาน)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                ระบบซ่อมบำรุง & การแจ้งเตือนหมดอายุ (Fleet Maintenance)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                บันทึกเปิดใบสั่งซ่อมบำรุง, ติดตามสถานะอู่ซ่อม, กำหนดวันเริ่ม-วันคืน, และแจ้งเตือนภาษี พ.ร.บ. แก๊ส LPG
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาทะเบียน, งานซ่อม, ศูนย์บริการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
            />
          </div>

          <button
            id="btn-open-create-repair-order"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ บันทึกส่งซ่อมบำรุง / เปิดใบสั่งซ่อม</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active In Repair */}
        <div
          onClick={() => {
            setActiveTab('repairs');
            setRepairFilterStatus('in_progress');
          }}
          className="panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
              อยู่ระหว่างส่งซ่อมบำรุง
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wrench className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {inProgressRepairsCount}{' '}
            <span className="text-xs font-medium text-slate-400">คัน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">รถขึ้นสถานะ 'ซ่อมบำรุง' ชั่วคราว</p>
        </div>

        {/* Total Orders */}
        <div
          onClick={() => {
            setActiveTab('repairs');
            setRepairFilterStatus('all');
          }}
          className="panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              รายการส่งซ่อมทั้งหมด
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {repairOrders.length}{' '}
            <span className="text-xs font-medium text-slate-400">รายการ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            รอส่ง: {pendingRepairsCount} | คืนแล้ว: {returnedRepairsCount}
          </p>
        </div>

        {/* Total Cost */}
        <div className="panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              ค่าใช้จ่ายซ่อมสะสม
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ฿{totalRepairCost.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-400">บาท</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ยอดรวมค่าอะไหล่ & ค่าแรงศูนย์</p>
        </div>

        {/* Critical Expiry Alerts */}
        <div
          onClick={() => {
            setActiveTab('alerts');
            setAlertFilterStatus('critical');
          }}
          className="panel p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:border-rose-500 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
              แจ้งเตือนหมดอายุวิกฤต
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {criticalCount}{' '}
            <span className="text-xs font-medium text-slate-400">รายการ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ใกล้ครบกำหนด 30 วัน: {warningCount} รายการ
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('repairs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'repairs'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>รายการส่งซ่อมบำรุง & ประวัติงานซ่อม</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'repairs'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {repairOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'alerts'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>การแจ้งเตือนหมดอายุ & เช็คระยะ (Expiries)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'alerts'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {maintenanceItems.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: REPAIR ORDERS & WORK ORDERS VIEW (รายการส่งซ่อมบำรุง)
          ========================================================================= */}
      {activeTab === 'repairs' && (
        <div className="space-y-4">
          {/* Sub Filters for Repair Orders */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'ทั้งหมด', count: repairOrders.length },
                { id: 'in_progress', label: 'อยู่ระหว่างส่งซ่อม', count: inProgressRepairsCount },
                { id: 'pending', label: 'รอดำเนินการ', count: pendingRepairsCount },
                { id: 'completed', label: 'ซ่อมเสร็จ รอรับรถ', count: completedRepairsCount },
                { id: 'returned', label: 'รับรถคืนแล้ว', count: returnedRepairsCount },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRepairFilterStatus(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    repairFilterStatus === t.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({t.count})</span>
                </button>
              ))}
            </div>

            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">หมวดหมู่งาน:</span>
              <select
                value={repairCategoryFilter}
                onChange={(e) => setRepairCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="all">ทุกหมวดหมู่งานซ่อม</option>
                <option value="periodic_service">เช็คระยะ / เปลี่ยนของเหลว</option>
                <option value="gas_system">ระบบแก๊ส LPG / NGV</option>
                <option value="engine_trans">เครื่องยนต์ & เกียร์</option>
                <option value="brake_suspension">เบรก / ช่วงล่าง / ยาง</option>
                <option value="ac_electrical">แอร์ & ระบบไฟ</option>
                <option value="body_paint">ตัวถัง / สี / เคลม</option>
                <option value="general">ซ่อมทั่วไป</option>
              </select>
            </div>
          </div>

          {/* Repair Orders List / Table */}
          {filteredRepairOrders.length === 0 ? (
            <div className="panel p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                ไม่พบรายการส่งซ่อมบำรุงที่ค้นหา
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                คุณสามารถเพิ่มรายการส่งซ่อมบำรุงใหม่ได้โดยคลิกปุ่มด้านล่าง
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                + บันทึกส่งซ่อมบำรุงใหม่
              </button>
            </div>
          ) : (
            <div className="panel rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">เลขที่ใบสั่งซ่อม</th>
                      <th className="py-3.5 px-4">ยานพาหนะ / ทะเบียน</th>
                      <th className="py-3.5 px-4">หมวดหมู่งานซ่อม</th>
                      <th className="py-3.5 px-4">รายละเอียดการซ่อม & อะไหล่</th>
                      <th className="py-3.5 px-4">กำหนดวันเริ่ม - วันคืน</th>
                      <th className="py-3.5 px-4">ศูนย์บริการ / ค่าใช้จ่าย</th>
                      <th className="py-3.5 px-4 text-center">สถานะ</th>
                      <th className="py-3.5 px-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRepairOrders.map((order) => {
                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                        >
                          {/* Code */}
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {order.orderCode}
                          </td>

                          {/* Vehicle */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-slate-400" />
                              {order.vehicleName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {order.vehiclePlate}{' '}
                              {order.vehicleMileage ? `(${order.vehicleMileage.toLocaleString()} กม.)` : ''}
                            </div>
                          </td>

                          {/* Category & Issue */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 inline-block mb-1">
                              {order.repairCategoryLabel}
                            </span>
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]" title={order.issueDescription}>
                              {order.issueDescription}
                            </p>
                          </td>

                          {/* Repair Details & Parts */}
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2" title={order.repairDetails}>
                              {order.repairDetails || '-'}
                            </div>
                            {order.partsReplaced && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-1" title={order.partsReplaced}>
                                📦 อะไหล่: {order.partsReplaced}
                              </div>
                            )}
                          </td>

                          {/* Dates */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              เริ่ม: {order.startDate}
                            </div>
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-[11px] mt-0.5 font-bold">
                              <Clock className="w-3 h-3 text-amber-500" />
                              นัดคืน: {order.estimatedReturnDate}
                            </div>
                            {order.actualReturnDate && (
                              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                ✓ รับรถจริง: {order.actualReturnDate}
                              </div>
                            )}
                          </td>

                          {/* Garage & Cost */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                              {order.garageName}
                            </div>
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                              ฿{(order.cost || 0).toLocaleString()}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {renderStatusBadge(order.status)}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* View Detail Button */}
                              <button
                                onClick={() => setViewingDetailOrder(order)}
                                title="ดูรายละเอียดใบสั่งซ่อม"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditModal(order)}
                                title="แก้ไขข้อมูลรายการส่งซ่อม"
                                className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Fast Return Button (if in progress or completed) */}
                              {order.status !== 'returned' && (
                                <button
                                  onClick={() => handleQuickReturn(order)}
                                  title="บันทึกรับรถคืนเข้า Fleet (เปลี่ยนสถานะเป็นพร้อมใช้งาน)"
                                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 transition cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteRepairOrder(order.id)}
                                title="ลบรายการ"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: EXPIRY & DUE ALERTS VIEW (การแจ้งเตือนหมดอายุ & เช็คระยะ)
          ========================================================================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Sub Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'ทั้งหมด', count: maintenanceItems.length },
              { id: 'critical', label: 'วิกฤต / หมดอายุ', count: criticalCount },
              { id: 'warning', label: 'ใกล้หมดอายุ (30 วัน)', count: warningCount },
              { id: 'normal', label: 'ปกติ', count: normalCount },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setAlertFilterStatus(t.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  alertFilterStatus === t.id
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span>{t.label}</span>
                <span className="text-[10px] opacity-70">({t.count})</span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">ยานพาหนะ</th>
                    <th className="py-3.5 px-4">รายการซ่อมบำรุง / เอกสาร</th>
                    <th className="py-3.5 px-4">หมวดหมู่</th>
                    <th className="py-3.5 px-4">วันหมดอายุ / กำหนดรอบ</th>
                    <th className="py-3.5 px-4">ระยะเวลาคงเหลือ</th>
                    <th className="py-3.5 px-4 text-center">สถานะ</th>
                    <th className="py-3.5 px-4 text-center">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAlertItems.map((item) => {
                    const isOverdue = item.daysRemaining < 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.vehicleName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.vehiclePlate}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {item.typeLabel}
                          </span>
                          {item.gasCertNo && (
                            <div className="text-[10px] text-amber-600 mt-0.5 font-mono">
                              ใบวิศวกร: {item.gasCertNo}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {item.categoryLabel || item.category || 'เอกสารประจำปี'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          {item.expiryDate}
                        </td>
                        <td className="py-3.5 px-4">
                          {isOverdue ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              หมดอายุแล้ว {Math.abs(item.daysRemaining)} วัน
                            </span>
                          ) : item.daysRemaining <= 30 ? (
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              เหลืออีก {item.daysRemaining} วัน
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              เหลืออีก {item.daysRemaining} วัน
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              item.status === 'critical'
                                ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                                : item.status === 'warning'
                                ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {item.status === 'critical' ? 'วิกฤต' : item.status === 'warning' ? 'ใกล้หมดอายุ' : 'ปกติ'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedAlertItem(item);
                              setNewExpiryDate('31/12/2570');
                              setServiceCost(3500);
                              setServiceNote('');
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>ต่ออายุ / บันทึกผล</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CREATE / EDIT REPAIR ORDER (แบบฟอร์มบันทึกส่งซ่อมบำรุง)
          ========================================================================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-100">
                    {editingOrder ? 'แก้ไขใบสั่งซ่อมบำรุง' : 'บันทึกส่งซ่อมบำรุง / เปิดใบสั่งซ่อม (New Work Order)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    กรอกข้อมูลอาการเสีย รายละเอียดการซ่อม รายการอะไหล่ และกำหนดวันส่งซ่อม-วันนัดคืน
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRepairOrder} className="space-y-4">
              {/* Row 1: Vehicle & Mileage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    1. เลือกรถยนต์ที่ส่งซ่อม <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    required
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} - ทะเบียน {v.plate} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    เลขไมล์ปัจจุบัน (กม.)
                  </label>
                  <input
                    type="number"
                    value={vehicleMileage}
                    onChange={(e) => setVehicleMileage(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    placeholder="เช่น 45000"
                  />
                </div>
              </div>

              {/* Row 2: Category & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    2. หมวดหมู่งานซ่อมบำรุง <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={repairCategory}
                    onChange={(e) => setRepairCategory(e.target.value as RepairCategory)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  >
                    <option value="general">งานซ่อมทั่วไป</option>
                    <option value="periodic_service">เช็คระยะตามรอบ / เปลี่ยนถ่ายของเหลว</option>
                    <option value="gas_system">ระบบแก๊ส LPG / NGV (Dual Fuel)</option>
                    <option value="engine_trans">เครื่องยนต์ & ระบบส่งกำลัง</option>
                    <option value="brake_suspension">เบรก / ช่วงล่าง / ยาง</option>
                    <option value="ac_electrical">ระบบแอร์ & ระบบไฟฟ้า</option>
                    <option value="body_paint">ตัวถัง / สี / เคลมประกัน</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    3. สถานะงานซ่อม <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as RepairOrderStatus)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  >
                    <option value="in_progress">🟠 อยู่ระหว่างส่งซ่อม (ปรับรถเป็น 'ซ่อมบำรุง')</option>
                    <option value="pending">🟡 รอดำเนินการส่งซ่อม</option>
                    <option value="completed">🔵 ซ่อมเสร็จแล้ว รอตรวจรับรถ</option>
                    <option value="returned">🟢 รับรถคืนเรียบร้อย (ปรับรถกลับเป็น 'พร้อมใช้งาน')</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Issue Description (อาการเสีย / รายละเอียดที่แจ้ง) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  4. อาการเสีย / รายละเอียดที่แจ้งส่งซ่อม <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="เช่น มีเสียงดังขณะเบรก, แอร์ไม่เย็น, เช็คระยะ 50,000 กม., สลับระบบแก๊สแล้วสะดุด..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Row 4: Repair Details & Parts Replaced (รายละเอียดที่แก้ไข & รายการอะไหล่) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    5. รายละเอียดที่แก้ไข / รายละเอียดในการซ่อม
                  </label>
                  <textarea
                    rows={2}
                    value={repairDetails}
                    onChange={(e) => setRepairDetails(e.target.value)}
                    placeholder="เช่น เปลี่ยนผ้าเบรกหน้าคู่แท้ เจียรจานเบรก เปลี่ยนถ่ายน้ำมันเครื่องสังเคราะห์ 5W-30..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    รายการอะไหล่ที่เปลี่ยน / เบิกใช้อะไหล่
                  </label>
                  <textarea
                    rows={2}
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                    placeholder="เช่น กรองแก๊สไอ 12mm, ผ้าเบรกหน้า 04465-0K360, น้ำมันเครื่อง 4L..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Start Date & Estimated Return Date (กำหนดวันเริ่ม - กำหนดวันคืน) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    กำหนดวันเริ่มส่งซ่อม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="ว/ด/ป เวลา (เช่น 16/08/2569 08:30)"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    กำหนดวันคืนเมื่อซ่อมเสร็จ / นัดรับรถ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={estimatedReturnDate}
                    onChange={(e) => setEstimatedReturnDate(e.target.value)}
                    placeholder="ว/ด/ป เวลา (เช่น 18/08/2569 17:00)"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>

              {/* Row 6: Garage & Mechanic */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ศูนย์บริการ / อู่ซ่อม
                  </label>
                  <input
                    type="text"
                    value={garageName}
                    onChange={(e) => setGarageName(e.target.value)}
                    placeholder="เช่น ศูนย์โตโยต้า สาทร"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    เบอร์โทรติดต่ออู่ / ศูนย์
                  </label>
                  <input
                    type="text"
                    value={garageContact}
                    onChange={(e) => setGarageContact(e.target.value)}
                    placeholder="เช่น 02-678-9000"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ช่างผู้ดูแล / ผู้ตรวจรับ
                  </label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="เช่น ช่างสมศักดิ์"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 7: Cost & Invoice */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ค่าใช้จ่ายในการซ่อม (บาท)
                  </label>
                  <input
                    type="number"
                    value={repairCost}
                    onChange={(e) => setRepairCost(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    เลขที่ใบเสร็จ / Invoice No.
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="เช่น TY-2569-09"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    สถานะการชำระเงิน
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  >
                    <option value="company_billing">วางบิลบริษัท (Corporate Billing)</option>
                    <option value="paid">ชำระเงินเรียบร้อย (Paid)</option>
                    <option value="pending">รอตั้งเบิก / รอชำระ (Pending)</option>
                  </select>
                </div>
              </div>

              {/* Row 8: Requester Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ผู้ส่งซ่อม / ผู้บันทึก
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    แผนกผู้ส่งซ่อม
                  </label>
                  <input
                    type="text"
                    value={requesterDepartment}
                    onChange={(e) => setRequesterDepartment(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                >
                  {editingOrder ? 'บันทึกการแก้ไข' : 'บันทึกเปิดใบสั่งซ่อม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: WORK ORDER DETAIL VIEW & FAST RETURN (ดูรายละเอียด & รับรถคืน)
          ========================================================================= */}
      {viewingDetailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    ใบสั่งซ่อมบำรุง: {viewingDetailOrder.orderCode}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ยานพาหนะ: {viewingDetailOrder.vehicleName} ({viewingDetailOrder.vehiclePlate})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDetailOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 block">หมวดหมู่งานซ่อม:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {viewingDetailOrder.repairCategoryLabel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-right">สถานะปัจจุบัน:</span>
                  <div className="mt-0.5">{renderStatusBadge(viewingDetailOrder.status)}</div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  📌 อาการเสีย / รายละเอียดที่แจ้งส่งซ่อม:
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {viewingDetailOrder.issueDescription || '-'}
                </p>
              </div>

              {/* Repair Details & Parts */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  🔧 รายละเอียดที่แก้ไข / รายละเอียดการซ่อม:
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {viewingDetailOrder.repairDetails || '-'}
                </p>

                {viewingDetailOrder.partsReplaced && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-medium">
                    📦 <b>อะไหล่ที่เปลี่ยน:</b> {viewingDetailOrder.partsReplaced}
                  </div>
                )}
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 font-mono">
                <div>
                  <span className="text-slate-500 block text-[11px]">กำหนดวันเริ่มส่งซ่อม:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingDetailOrder.startDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">กำหนดวันคืนเมื่อซ่อมเสร็จ:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {viewingDetailOrder.estimatedReturnDate}
                  </span>
                </div>
              </div>

              {/* Garage & Costs */}
              <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-500 block">ศูนย์บริการ / อู่:</span>
                  <b>{viewingDetailOrder.garageName}</b>
                  {viewingDetailOrder.garageContact && (
                    <div className="text-slate-400 font-mono">{viewingDetailOrder.garageContact}</div>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block">ค่าใช้จ่าย / ชำระเงิน:</span>
                  <b className="text-emerald-600 text-sm font-mono">
                    ฿{(viewingDetailOrder.cost || 0).toLocaleString()} บาท
                  </b>
                  <div className="text-slate-400">({viewingDetailOrder.paymentStatus || 'วางบิลบริษัท'})</div>
                </div>
              </div>

              {/* Requester */}
              <div className="text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>ผู้ส่งซ่อม: <b>{viewingDetailOrder.requesterName}</b> ({viewingDetailOrder.requesterDepartment})</span>
                <span>เลขไมล์: <b>{(viewingDetailOrder.vehicleMileage || 0).toLocaleString()} กม.</b></span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบสั่งซ่อม</span>
              </button>

              <div className="flex items-center gap-2">
                {viewingDetailOrder.status !== 'returned' && (
                  <button
                    type="button"
                    onClick={() => handleQuickReturn(viewingDetailOrder)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>บันทึกรับรถคืน (พร้อมใช้งาน)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const orderToEdit = viewingDetailOrder;
                    setViewingDetailOrder(null);
                    handleOpenEditModal(orderToEdit);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition"
                >
                  แก้ไขข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: RENEW EXPIRY ALERT (บันทึกการต่ออายุ / ตรวจสภาพ)
          ========================================================================= */}
      {selectedAlertItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                บันทึกการต่ออายุ / ตรวจสภาพ
              </h3>
              <button
                onClick={() => setSelectedAlertItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
              <div>
                ยานพาหนะ:{' '}
                <b className="text-slate-800 dark:text-slate-200">
                  {selectedAlertItem.vehicleName} ({selectedAlertItem.vehiclePlate})
                </b>
              </div>
              <div>
                รายการ: <b className="text-amber-600">{selectedAlertItem.typeLabel}</b>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                วันหมดอายุรอบถัดไป (ว/ด/ป)
              </label>
              <input
                type="text"
                required
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ค่าใช้จ่าย (บาท)
              </label>
              <input
                type="number"
                value={serviceCost}
                onChange={(e) => setServiceCost(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                หมายเหตุ / ชื่ออู่หรือศูนย์บริการ
              </label>
              <textarea
                rows={2}
                value={serviceNote}
                onChange={(e) => setServiceNote(e.target.value)}
                placeholder="เช่น ศูนย์โตโยต้า บางนา, บริษัท กรุงเทพประกันภัย..."
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedAlertItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleRenewService}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition"
              >
                บันทึกการต่ออายุ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
