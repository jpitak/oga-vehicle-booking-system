import React, { useState, useEffect } from 'react';
import { Booking, Vehicle, User, Driver, MasterLocationPurpose } from '../types';
import { apiService } from '../services/apiService';
import {
  X,
  Car,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Users,
  User as UserIcon,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface EditBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBooking: Booking) => void;
  onDelete?: (bookingId: string) => void;
  vehicles: Vehicle[];
}

// Convert YYYY-MM-DD to DD/MM/YYYY (Thai BE)
function formatIsoToThaiDate(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10) + 543;
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  return isoStr;
}

// Convert DD/MM/YYYY or ISO to YYYY-MM-DD
function formatThaiDateToIso(dateStr?: string): string {
  if (!dateStr) return '2026-03-16';
  const str = String(dateStr).trim();
  if (str.includes('T')) {
    const p = str.split('T')[0].split('-');
    if (p.length === 3) {
      let y = parseInt(p[0], 10);
      if (y > 2400) y -= 543;
      return `${y}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
    }
  }
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      let y = parseInt(parts[0], 10);
      if (y > 2400) y -= 543;
      return `${y}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      let y = parseInt(parts[2], 10);
      if (y > 2400) y -= 543;
      return `${y}-${m}-${d}`;
    }
  }
  return '2026-03-16';
}

// Normalize time strings e.g. 1899-12-30T02:17:56.000Z -> 09:00
function formatCleanTime(timeStr?: string, defaultTime = '09:00'): string {
  if (!timeStr) return defaultTime;
  const str = String(timeStr).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  if (str.includes('T')) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    } catch (e) {}
  }
  if (str.includes(':')) {
    const parts = str.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return defaultTime;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSave,
  onDelete,
  vehicles,
}) => {
  if (!isOpen || !booking) return null;

  const usersList = apiService.getUsers();
  const driversList = apiService.getDrivers();
  const masterItems = apiService.getMasterItems();
  const popularDestinations = masterItems.filter((i) => i.category === 'destination');
  const popularPurposes = masterItems.filter((i) => i.category === 'purpose');

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    booking.vehicleId || vehicles[0]?.id || 'v-1'
  );
  const [selectedUserId, setSelectedUserId] = useState<string>(
    booking.userId || usersList[0]?.id || 'u-1'
  );
  const [driverName, setDriverName] = useState<string>(
    booking.driverName || driversList[0]?.name || 'สมศักดิ์ ขับดี'
  );
  const [destination, setDestination] = useState<string>(booking.destination || '');
  const [purpose, setPurpose] = useState<string>(booking.purpose || '');
  const [passengersCount, setPassengersCount] = useState<number>(
    booking.passengersCount || 1
  );

  // Dates & Times
  const [depDateIso, setDepDateIso] = useState<string>(() =>
    formatThaiDateToIso(booking.departureDate)
  );
  const [depTime, setDepTime] = useState<string>(() =>
    formatCleanTime(booking.departureTime, '09:00')
  );

  const [retDateIso, setRetDateIso] = useState<string>(() =>
    formatThaiDateToIso(booking.returnDate)
  );
  const [retTime, setRetTime] = useState<string>(() =>
    formatCleanTime(booking.returnTime, '17:00')
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Sync state whenever selected booking changes
  useEffect(() => {
    if (booking) {
      // Find matching vehicle
      const matchedVeh = vehicles.find(
        (v) =>
          v.id === booking.vehicleId ||
          v.plate === booking.vehiclePlate ||
          booking.vehiclePlate?.includes(v.plate)
      );
      setSelectedVehicleId(matchedVeh ? matchedVeh.id : booking.vehicleId || vehicles[0]?.id || 'v-1');

      // Find matching user
      const matchedUser = usersList.find(
        (u) => u.id === booking.userId || u.name === booking.userName
      );
      setSelectedUserId(matchedUser ? matchedUser.id : usersList[0]?.id || 'u-1');

      setDriverName(booking.driverName || driversList[0]?.name || 'สมศักดิ์ ขับดี');
      setDestination(booking.destination || '');
      setPurpose(booking.purpose || '');
      setPassengersCount(booking.passengersCount || 1);

      const dIso = formatThaiDateToIso(booking.departureDate);
      setDepDateIso(dIso);
      setDepTime(formatCleanTime(booking.departureTime, '09:00'));

      const rIso = formatThaiDateToIso(booking.returnDate);
      setRetDateIso(rIso);
      setRetTime(formatCleanTime(booking.returnTime, '17:00'));
      setShowConfirmDelete(false);
    }
  }, [booking, vehicles]);

  // Derived selected items
  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const activeUser = usersList.find((u) => u.id === selectedUserId) || usersList[0];

  const handleDepDateChange = (isoVal: string) => {
    setDepDateIso(isoVal);
    if (retDateIso < isoVal) {
      setRetDateIso(isoVal);
    }
  };

  const setQuickDate = (daysFromBase: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromBase);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${day}`;
    setDepDateIso(iso);
    setRetDateIso(iso);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      alert('กรุณาระบุสถานที่ปลายทาง');
      return;
    }

    setIsSaving(true);
    try {
      const depDateThai = formatIsoToThaiDate(depDateIso);
      const retDateThai = formatIsoToThaiDate(retDateIso);

      const updated: Booking = {
        ...booking,
        userId: activeUser?.id || booking.userId,
        userName: activeUser?.name || booking.userName,
        userDepartment: activeUser?.department || booking.userDepartment,
        vehicleId: activeVehicle?.id || booking.vehicleId,
        vehicleName: activeVehicle?.name || booking.vehicleName,
        vehiclePlate: activeVehicle?.plate || booking.vehiclePlate,
        purpose: purpose.trim() || 'ติดต่องานบริษัท',
        destination: destination.trim(),
        passengersCount: Number(passengersCount) || 1,
        driverName: driverName || 'สมศักดิ์ ขับดี',
        departureDate: depDateThai,
        departureTime: depTime,
        returnDate: retDateThai,
        returnTime: retTime,
        updatedAt: new Date().toISOString(),
      };

      await apiService.saveBooking(updated);
      onSave(updated);

      apiService.addNotification({
        title: `แก้ไขข้อมูลการจอง ${updated.bookingCode} สำเร็จ`,
        message: `เปลี่ยนข้อมูลยานพาหนะเป็น ${updated.vehiclePlate} (${updated.vehicleName}) เรียบร้อยแล้ว`,
        type: 'booking',
        bookingCode: updated.bookingCode,
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await apiService.deleteBooking(booking.id);
      onDelete(booking.id);
      apiService.addNotification({
        title: `ยกเลิกการจอง ${booking.bookingCode} เรียบร้อย`,
        message: `ลบรายการจองรถ ${booking.vehiclePlate} ออกจากระบบแล้ว`,
        type: 'booking',
        bookingCode: booking.bookingCode,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบการจอง');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-50 to-transparent dark:from-amber-500/15 dark:via-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {booking.bookingCode}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    booking.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {booking.statusLabel || 'รออนุมัติ'}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                แก้ไขข้อมูลการจองรถ (ก่อนการอนุมัติ)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* 1. VEHICLE SELECTION (ทะเบียนรถ / ยานพาหนะ) */}
          <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-500" />
                เลือกรถ / เปลี่ยนทะเบียนรถ <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                กำลังเลือก: {activeVehicle?.plate} ({activeVehicle?.name})
              </span>
            </label>

            {/* Vehicle Select Dropdown */}
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  🚗 {v.plate} — {v.name} ({v.type}, {v.capacity} ที่นั่ง, เชื้อเพลิง: {v.fuelType})
                </option>
              ))}
            </select>

            {/* Active Vehicle Preview Card */}
            {activeVehicle && (
              <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <img
                  src={activeVehicle.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80'}
                  alt={activeVehicle.name}
                  className="w-16 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs sm:text-sm">
                    {activeVehicle.name}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {activeVehicle.plate}
                    </span>
                    <span>• {activeVehicle.type}</span>
                    <span>• {activeVehicle.capacity} ที่นั่ง</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. USER & DEPARTMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                  ชื่อผู้ขอใช้รถ <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400">เลือกจาก Master</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer font-medium"
              >
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.department} ({u.roleLabel || 'พนักงาน'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                ฝ่าย / แผนก (อัปเดตตามผู้ขอ)
              </label>
              <input
                type="text"
                readOnly
                value={activeUser?.department || '-'}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-medium text-slate-800 dark:text-slate-200 cursor-not-allowed"
              />
            </div>
          </div>

          {/* 3. DATES & TIMES (Calendar Pickers) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                กำหนดการเดินทาง (เลือกวันที่จากปฏิทิน):
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                >
                  พรุ่งนี้
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Departure */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between mb-1">
                  <span>วันที่เดินทางไป <span className="text-rose-500">*</span></span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatIsoToThaiDate(depDateIso)}
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={depDateIso}
                  onChange={(e) => handleDepDateChange(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  เวลาออกเดินทาง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={depTime}
                  onChange={(e) => setDepTime(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Return */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between mb-1">
                  <span>วันที่เดินทางกลับ <span className="text-rose-500">*</span></span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {formatIsoToThaiDate(retDateIso)}
                  </span>
                </label>
                <input
                  type="date"
                  required
                  min={depDateIso}
                  value={retDateIso}
                  onChange={(e) => setRetDateIso(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  เวลาเดินทางกลับ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={retTime}
                  onChange={(e) => setRetTime(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. DESTINATION & PURPOSE */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                สถานที่ปลายทาง <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">กดเลือก Master ยอดนิยม:</span>
            </div>
            {popularDestinations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {popularDestinations.slice(0, 4).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDestination(d.name)}
                    className="text-[10px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    📍 {d.name}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="ระบุสถานที่ปลายทาง"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                วัตถุประสงค์การใช้รถ
              </label>
              <span className="text-[10px] text-slate-400">กดเลือก Master ยอดนิยม:</span>
            </div>
            {popularPurposes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {popularPurposes.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPurpose(p.name)}
                    className="text-[10px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    ✨ {p.name}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="ระบุวัตถุประสงค์ เช่น ส่งมอบอุปกรณ์, ประชุมลูกค้า"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* 5. DRIVER & PASSENGERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                พนักงานขับรถ
              </label>
              <select
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer font-medium"
              >
                <option value="ขับเอง">🚗 ขับเอง (Self-drive)</option>
                {driversList.map((d) => (
                  <option key={d.id} value={d.name}>
                    👤 {d.name} ({d.phone || 'ประจำกองยานพาหนะ'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                จำนวนผู้โดยสาร (รวมผู้ขอ)
              </label>
              <input
                type="number"
                min="1"
                max={activeVehicle?.capacity || 10}
                value={passengersCount}
                onChange={(e) => setPassengersCount(parseInt(e.target.value, 10) || 1)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Confirm Delete Section */}
          {showConfirmDelete && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                ยืนยันการยกเลิก / ลบรายการจองนี้?
              </div>
              <p className="text-rose-600 dark:text-rose-400 text-xs">
                เมื่อลบแล้ว รายการจอง {booking.bookingCode} จะถูกนำออกจากระบบและปฏิทินทันที
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบรายการ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            {onDelete && !showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ยกเลิก / ลบการจอง
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
