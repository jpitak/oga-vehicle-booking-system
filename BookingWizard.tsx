import React, { useState, useEffect } from 'react';
import { Vehicle, User, Booking } from '../types';
import { SignaturePad } from './SignaturePad';
import { apiService } from '../services/apiService';
import confetti from 'canvas-confetti';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Fuel,
  Gauge,
  Sparkles,
  Printer,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';

interface BookingWizardProps {
  currentUser: User;
  vehicles: Vehicle[];
  onBookingSuccess: (newBooking: Booking) => void;
  onCancel: () => void;
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

// Convert DD/MM/YYYY (Thai BE or CE) or ISO to YYYY-MM-DD
function formatThaiDateToIso(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      let y = parseInt(parts[0], 10);
      if (y > 2400) y -= 543;
      return `${y}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return dateStr;
  }
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      let y = parseInt(parts[2], 10);
      if (y > 2400) y -= 543;
      return `${y}-${m}-${d}`;
    }
  }
  return dateStr;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  currentUser,
  vehicles,
  onBookingSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [vehicleFilter, setVehicleFilter] = useState<string>('ทั้งหมด');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Master lists
  const usersList = apiService.getUsers();
  const driversList = apiService.getDrivers();
  const masterItems = apiService.getMasterItems();
  const popularDestinations = masterItems.filter((i) => i.category === 'destination');
  const popularPurposes = masterItems.filter((i) => i.category === 'purpose');

  // Selected User State (can be chosen from dropdown)
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || (usersList[0]?.id ?? 'u-1'));
  const activeSelectedUser = usersList.find((u) => u.id === selectedUserId) || currentUser || usersList[0];

  // Form Fields
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [passengersCount, setPassengersCount] = useState(1);

  // Date States (ISO format for HTML5 calendar picker and Thai string format for database & display)
  const [departureDateIso, setDepartureDateIso] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear() + 543;
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  });
  const [departureTime, setDepartureTime] = useState('09:00');

  const [returnDateIso, setReturnDateIso] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear() + 543;
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  });
  const [returnTime, setReturnTime] = useState('17:00');

  const [driverName, setDriverName] = useState('สมศักดิ์ ขับดี');
  const [signature, setSignature] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize when current user prop changes
  useEffect(() => {
    if (currentUser?.id) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser]);

  // Handle Departure Date Change from Calendar Picker
  const handleDepartureDateChange = (isoVal: string) => {
    setDepartureDateIso(isoVal);
    const thaiStr = formatIsoToThaiDate(isoVal);
    setDepartureDate(thaiStr);
    // If return date is before departure date, sync return date
    if (returnDateIso < isoVal) {
      setReturnDateIso(isoVal);
      setReturnDate(thaiStr);
    }
  };

  // Handle Return Date Change from Calendar Picker
  const handleReturnDateChange = (isoVal: string) => {
    setReturnDateIso(isoVal);
    setReturnDate(formatIsoToThaiDate(isoVal));
  };

  // Quick Date presets (Today, Tomorrow, Day After)
  const setQuickDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${day}`;
    handleDepartureDateChange(iso);
    handleReturnDateChange(iso);
  };

  const vehicleTypes = ['ทั้งหมด', 'รถเก๋ง', 'รถตู้', 'รถกระบะ', 'รถ SUV'];
  const filteredVehicles = vehicles.filter((v) => {
    if (vehicleFilter === 'ทั้งหมด') return true;
    return v.type === vehicleFilter;
  });

  const handleNextStep1 = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !purpose.trim()) {
      alert('กรุณากรอกสถานที่ปลายทางและวัตถุประสงค์การใช้รถ');
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    if (!selectedVehicle) return;
    if (!agreeTerms) {
      alert('กรุณายินยอมตามระเบียบการใช้รถของบริษัท OGA International');
      return;
    }

    setIsSubmitting(true);
    const bookingCode = `BK-2569-${String(Math.floor(10 + Math.random() * 90))}`;
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingCode,
      userId: activeSelectedUser.id,
      userName: activeSelectedUser.name,
      userDepartment: activeSelectedUser.department,
      vehicleId: selectedVehicle.id,
      vehicleName: selectedVehicle.name,
      vehiclePlate: selectedVehicle.plate,
      vehicleImage: selectedVehicle.image,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      destination,
      purpose,
      passengersCount,
      driverName,
      userSignature: signature,
      status: 'pending_dept',
      statusLabel: 'รออนุมัติหัวหน้า',
      startMileage: selectedVehicle.mileage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiService.saveBooking(newBooking);
      apiService.addNotification({
        title: 'ยื่นคำขอจองรถสำเร็จ',
        message: `รหัส ${bookingCode} กำลังรอการอนุมัติจากหัวหน้าฝ่าย`,
        type: 'booking',
        bookingCode,
      });

      // Send Line Notify
      apiService.sendLineNotify({
        bookingCode,
        userName: activeSelectedUser.name,
        vehicleName: `${selectedVehicle.name} (${selectedVehicle.plate})`,
        destination,
        departureDate: `${departureDate} ${departureTime}`,
        status: 'รออนุมัติหัวหน้าฝ่าย (ขั้นที่ 1)',
        note: purpose,
      });

      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setCreatedBooking(newBooking);
      setStep(4);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Wizard Step Progress Bar */}
      <div className="panel p-4 md:p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'เลือกรถ' },
            { num: 2, label: 'รายละเอียดเดินทาง' },
            { num: 3, label: 'ลงนาม & ยืนยัน' },
            { num: 4, label: 'จองสำเร็จ' },
          ].map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 scale-110 shadow-md'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-medium text-center ${
                      isCurrent
                        ? 'text-amber-500 font-bold'
                        : isCompleted
                        ? 'text-emerald-500 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 rounded ${
                      step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: SELECT VEHICLE */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                เลือกรถที่ต้องการจอง
              </h3>
              <p className="text-xs text-slate-500">
                คลิกเลือกยานพาหนะ OGA ที่พร้อมใช้งานสำหรับการเดินทางของคุณ
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {vehicleTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setVehicleFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    vehicleFilter === type
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => {
              const isSelected = selectedVehicle?.id === vehicle.id;
              const isAvailable = vehicle.status === 'available';

              return (
                <div
                  key={vehicle.id}
                  onClick={() => isAvailable && setSelectedVehicle(vehicle)}
                  className={`panel overflow-hidden rounded-2xl border transition-all flex flex-col justify-between ${
                    !isAvailable
                      ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800'
                      : isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg cursor-pointer'
                      : 'hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div>
                    {/* Vehicle Image */}
                    <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md ${
                            vehicle.status === 'available'
                              ? 'bg-emerald-500 text-white'
                              : vehicle.status === 'in_use'
                              ? 'bg-purple-600 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {vehicle.status === 'available'
                            ? 'พร้อมใช้'
                            : vehicle.status === 'in_use'
                            ? 'กำลังเดินทาง'
                            : 'ซ่อมบำรุง'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-mono text-xs font-bold">
                        {vehicle.plate}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {vehicle.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          {vehicle.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vehicle.seats} ที่นั่ง</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vehicle.fuelType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vehicle.mileage.toLocaleString()} กม.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                          <span>{vehicle.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleNextStep1(vehicle)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                        !isAvailable
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                          : isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <span>เลือกรถคันนี้</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        'ไม่พร้อมใช้งาน'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: JOURNEY DETAILS FORM */}
      {step === 2 && selectedVehicle && (
        <form onSubmit={handleNextStep2} className="space-y-6">
          {/* Selected Vehicle Quick Banner */}
          <div className="panel p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedVehicle.image}
                alt={selectedVehicle.name}
                className="w-16 h-12 object-cover rounded-xl"
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedVehicle.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  ทะเบียน: {selectedVehicle.plate} • {selectedVehicle.seats} ที่นั่ง ({selectedVehicle.fuelType})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold"
            >
              เปลี่ยนรถ
            </button>
          </div>

          {/* Form Fields Card */}
          <div className="panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              กรอกรายละเอียดการเดินทาง
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Dropdown Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                    ชื่อผู้ขอใช้รถ <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">เลือกจากรายชื่อ</span>
                </label>
                <div className="relative">
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
              </div>

              {/* Department (Auto updated) */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  ฝ่าย / แผนก (อ้างอิงตามผู้ขอ)
                </label>
                <input
                  type="text"
                  readOnly
                  value={activeSelectedUser.department || '-'}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-medium text-slate-800 dark:text-slate-200 cursor-not-allowed"
                />
              </div>

              {/* Destination */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    สถานที่ปลายทาง <span className="text-rose-500">*</span>
                  </label>
                  {popularDestinations.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">กดเลือกจุดหมาย Master ยอดนิยม:</span>
                  )}
                </div>

                {/* Master Destination Quick Chips */}
                {popularDestinations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {popularDestinations.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDestination(p.name)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          destination === p.name
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        📍 {p.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น กระทรวงการคลัง ถ.พระราม 6, ศูนย์ประชุมไบเทค บางนา..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    วัตถุประสงค์การใช้รถ <span className="text-rose-500">*</span>
                  </label>
                  {popularPurposes.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">กดเลือกวัตถุประสงค์ Master ยอดนิยม:</span>
                  )}
                </div>

                {/* Master Purpose Quick Chips */}
                {popularPurposes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {popularPurposes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPurpose(p.name)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          purpose === p.name
                            ? 'bg-purple-600 text-white border-purple-500 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        ✨ {p.name}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={2}
                  required
                  placeholder="ระบุภารกิจการเดินทาง เช่น ยื่นเอกสารราชการ, พบลูกค้า OGA Partner..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Quick Date Presets */}
              <div className="md:col-span-2 flex items-center justify-between pt-1 pb-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  กำหนดการเดินทาง (เลือกวันที่จากปฏิทิน):
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950 dark:hover:text-amber-300 font-medium transition"
                  >
                    วันนี้ (15 มี.ค.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950 dark:hover:text-amber-300 font-medium transition"
                  >
                    พรุ่งนี้ (16 มี.ค.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(2)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950 dark:hover:text-amber-300 font-medium transition"
                  >
                    มะรืนนี้ (17 มี.ค.)
                  </button>
                </div>
              </div>

              {/* Date / Time Departure (Interactive Calendar Picker) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    วันที่เดินทางไป (ว/ด/ป) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {departureDate}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={departureDateIso}
                    onChange={(e) => handleDepartureDateChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  เวลาที่ออกเดินทาง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer font-medium"
                />
              </div>

              {/* Date / Time Return (Interactive Calendar Picker) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    วันที่เดินทางกลับ (ว/ด/ป) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                    {returnDate}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    min={departureDateIso}
                    value={returnDateIso}
                    onChange={(e) => handleReturnDateChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  เวลาเดินทางกลับ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer font-medium"
                />
              </div>

              {/* Passengers & Driver */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  จำนวนผู้โดยสาร (รวมผู้ขอ)
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedVehicle.seats}
                  value={passengersCount}
                  onChange={(e) => setPassengersCount(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  พนักงานขับรถ (Master Drivers)
                </label>
                <select
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {driversList.map((dr) => (
                    <option key={dr.id} value={dr.name}>
                      {dr.name} ({dr.status === 'available' ? 'พร้อมขับ' : 'ติดภารกิจ'}) - {dr.phone}
                    </option>
                  ))}
                  <option value="ขับเอง (มีใบอนุญาต)">ขับเอง (มีใบขับขี่ยานพาหนะถูกต้อง)</option>
                  <option value="พนักงานขับรถจัดสรรเพิ่มเติม">พนักงานขับรถจัดสรรเพิ่มเติม</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
            </button>

            <button
              type="submit"
              className="btn-3d px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <span>ถัดไป: ลงนามและยืนยัน</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: SIGNATURE & CONFIRMATION */}
      {step === 3 && selectedVehicle && (
        <div className="space-y-6">
          {/* Booking Summary Box */}
          <div className="panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              สรุปรายละเอียดการจองยานพาหนะ
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">ผู้ขอจอง:</span>{' '}
                <b className="text-slate-800 dark:text-slate-200">{activeSelectedUser.name} ({activeSelectedUser.department})</b>
              </div>
              <div>
                <span className="text-slate-400">ยานพาหนะ:</span>{' '}
                <b className="text-slate-800 dark:text-slate-200">{selectedVehicle.name} ({selectedVehicle.plate})</b>
              </div>
              <div>
                <span className="text-slate-400">ปลายทาง:</span>{' '}
                <b className="text-slate-800 dark:text-slate-200">{destination}</b>
              </div>
              <div>
                <span className="text-slate-400">วัตถุประสงค์:</span>{' '}
                <b className="text-slate-800 dark:text-slate-200">{purpose}</b>
              </div>
              <div>
                <span className="text-slate-400">วัน-เวลาเดินทาง:</span>{' '}
                <b className="text-slate-800 dark:text-slate-200">{departureDate} {departureTime} - {returnDate} {returnTime}</b>
              </div>
              <div>
                <span className="text-slate-400">คนขับ:</span>{' '}
                <b className="text-slate-800 dark:text-slate-200">{driverName} ({passengersCount} คน)</b>
              </div>
            </div>

            {/* Digital Signature Canvas */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                ลายเซ็นดิจิทัลของผู้ขอจอง (Digital Signature)
              </label>
              <SignaturePad
                height={160}
                label="วาดลายเซ็นของคุณที่นี่เพื่อยืนยันคำขอจองรถ"
                onSave={(dataUrl) => setSignature(dataUrl)}
              />
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                ข้าพเจ้าขอยืนยันว่าข้อมูลข้างต้นเป็นความจริงทุกประการ และยินยอมปฏิบัติตามระเบียบการใช้ยานพาหนะของบริษัท OGA International อย่างเคร่งครัด
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="btn-3d px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>กำลังบันทึกข้อมูล...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยื่นคำขอจองรถ (ส่งอนุมัติ)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS RECEIPT */}
      {step === 4 && createdBooking && (
        <div className="panel p-8 rounded-3xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ยื่นคำขอจองรถสำเร็จเรียบร้อย!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ระบบได้ส่งการแจ้งเตือนไปยังหัวหน้างานและส่ง Line Notify อัตโนมัติแล้ว
            </p>
          </div>

          {/* Receipt Card */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-400">เลขที่จอง (Booking Code):</span>
              <b className="text-amber-600 dark:text-amber-400 text-sm font-bold">
                {createdBooking.bookingCode}
              </b>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ยานพาหนะ:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{createdBooking.vehicleName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ทะเบียน:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{createdBooking.vehiclePlate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">สถานที่:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{createdBooking.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">กำหนดการ:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{createdBooking.departureDate} {createdBooking.departureTime}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-400">สถานะปัจจุบัน:</span>
              <span className="font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                รออนุมัติหัวหน้าฝ่าย (Tier 1)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onBookingSuccess(createdBooking)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
            >
              ดูรายการจองของฉัน
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" /> พิมพ์ใบคำขอ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
