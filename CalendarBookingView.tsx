import React, { useState, useMemo } from 'react';
import { User, Booking, Vehicle } from '../types';
import { EditBookingModal } from './EditBookingModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Car,
  CheckCircle2,
  AlertCircle,
  X,
  User as UserIcon,
  Shield,
  Layers,
  Phone,
  FileText,
  Filter,
  List,
  Grid,
  Search,
  Users,
  Navigation,
  Edit,
  Trash2,
} from 'lucide-react';

interface CalendarBookingViewProps {
  currentUser: User;
  bookings: Booking[];
  vehicles: Vehicle[];
  onSelectBooking?: (booking: Booking) => void;
  onNavigateBooking?: (date?: string) => void;
  onUpdateBooking?: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onLogout?: () => void;
}

// Vehicle color definitions matching the screenshot - tuned for crisp readability on white backgrounds
interface VehicleColorConfig {
  border: string;
  bg: string;
  text: string;
  dotBg: string;
  indicatorSvgColor: string;
  badgeBg: string;
}

const COLOR_PALETTE: VehicleColorConfig[] = [
  {
    // Red / Coral (e.g. กข-1234)
    border: 'border-l-rose-500',
    bg: 'bg-rose-50/90 hover:bg-rose-100/90 text-rose-950 border-rose-200/80',
    text: 'text-rose-950',
    dotBg: 'bg-rose-500',
    indicatorSvgColor: '#ef4444',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    // Blue / Cyan (e.g. ขค-5678)
    border: 'border-l-blue-500',
    bg: 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-950 border-blue-200/80',
    text: 'text-blue-950',
    dotBg: 'bg-blue-500',
    indicatorSvgColor: '#3b82f6',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    // Green / Emerald (e.g. งจ-9012)
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200/80',
    text: 'text-emerald-950',
    dotBg: 'bg-emerald-500',
    indicatorSvgColor: '#10b981',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    // Orange / Amber (e.g. ฉช-3344)
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-950 border-amber-200/80',
    text: 'text-amber-950',
    dotBg: 'bg-amber-500',
    indicatorSvgColor: '#f59e0b',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    // Purple / Indigo (e.g. ญฎ-7890)
    border: 'border-l-purple-500',
    bg: 'bg-purple-50/90 hover:bg-purple-100/90 text-purple-950 border-purple-200/80',
    text: 'text-purple-950',
    dotBg: 'bg-purple-500',
    indicatorSvgColor: '#8b5cf6',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    // Teal / Cyan
    border: 'border-l-teal-500',
    bg: 'bg-teal-50/90 hover:bg-teal-100/90 text-teal-950 border-teal-200/80',
    text: 'text-teal-950',
    dotBg: 'bg-teal-500',
    indicatorSvgColor: '#14b8a6',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
  },
];

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to normalize plate string for display like กข-1234
function formatShortPlate(plate: string): string {
  if (!plate) return 'ยานพาหนะ';
  const clean = plate.trim().replace(/\s+กทม\.?/g, '').replace(/\s+/g, '-');
  return clean;
}

// Clean and normalize time strings (handles Google Apps Script 1899-12-30 ISO strings or simple HH:mm)
function formatDisplayTime(timeStr?: string, fallback = '09:00'): string {
  if (!timeStr) return fallback;
  const str = String(timeStr).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    return str;
  }
  if (str.includes('T')) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const h = String(d.getUTCHours()).padStart(2, '0');
        const m = String(d.getUTCMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
      const timePart = str.split('T')[1];
      const timeSub = timePart.split('.')[0].split(':');
      if (timeSub.length >= 2) {
        return `${timeSub[0].padStart(2, '0')}:${timeSub[1].padStart(2, '0')}`;
      }
    } catch (e) {}
  }
  if (str.includes(':')) {
    const parts = str.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return fallback;
}

// Format date cleanly to Thai BE DD/MM/YYYY
function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const str = String(dateStr).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    return str;
  }
  if (str.includes('-')) {
    const p = str.split('T')[0].split('-');
    if (p.length === 3) {
      let y = parseInt(p[0], 10);
      if (y < 2400) y += 543;
      return `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${y}`;
    }
  }
  return str;
}

// Ultra-robust date parser supporting all formats (ISO, DD/MM/YYYY, YYYY-MM-DD, Thai BE & AD)
function parseBookingDate(dateStr?: string): { day: number; month: number; year: number } | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // 1. ISO string with T (e.g. 2569-10-07T17:00:00.000Z or 2026-03-16T...)
  if (str.includes('T')) {
    const datePart = str.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length >= 3) {
      let year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      if (year > 2400) year -= 543;
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return { day, month, year };
      }
    }
  }

  // 2. Format: YYYY-MM-DD
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length >= 3) {
      let year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      if (year > 2400) year -= 543;
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return { day, month, year };
      }
    }
  }

  // 3. Format: DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      let year = parseInt(parts[2], 10);
      if (year > 2400) year -= 543;
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return { day, month, year };
      }
    }
  }

  // 4. Try Standard JS Date parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    let year = d.getFullYear();
    if (year > 2400) year -= 543;
    return { day: d.getDate(), month: d.getMonth(), year };
  }

  return null;
}

export const CalendarBookingView: React.FC<CalendarBookingViewProps> = ({
  currentUser,
  bookings,
  vehicles,
  onSelectBooking,
  onNavigateBooking,
  onUpdateBooking,
  onDeleteBooking,
  onLogout,
}) => {
  // Current view date - automatically defaults to the REAL current date (Month and Year)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedBookingModal, setSelectedBookingModal] = useState<Booking | null>(null);

  // Edit Modal State
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEdit = (booking: Booking, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookingToEdit(booking);
    setIsEditModalOpen(true);
    setSelectedBookingModal(null);
  };

  const handleSaveBookingEdit = (updated: Booking) => {
    if (onUpdateBooking) {
      onUpdateBooking(updated);
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (onDeleteBooking) {
      onDeleteBooking(bookingId);
    }
    setSelectedBookingModal(null);
  };

  // Assign consistent colors to each vehicle
  const vehicleColorMap = useMemo(() => {
    const map: Record<string, VehicleColorConfig> = {};
    vehicles.forEach((v, index) => {
      map[v.id] = COLOR_PALETTE[index % COLOR_PALETTE.length];
      map[v.plate] = COLOR_PALETTE[index % COLOR_PALETTE.length];
      map[formatShortPlate(v.plate)] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });
    return map;
  }, [vehicles]);

  const getVehicleColor = (vehicleId?: string, plate?: string): VehicleColorConfig => {
    if (vehicleId && vehicleColorMap[vehicleId]) return vehicleColorMap[vehicleId];
    if (plate && vehicleColorMap[plate]) return vehicleColorMap[plate];
    if (plate && vehicleColorMap[formatShortPlate(plate)]) return vehicleColorMap[formatShortPlate(plate)];
    return COLOR_PALETTE[0];
  };

  // Calendar calculations for the active view month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const thaiYear = year + 543;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, ...
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleMonthChange = (newMonth: number) => {
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const handleYearChange = (newYear: number) => {
    setCurrentDate(new Date(newYear, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date()); // Jump to real current Month & Year
  };

  // Filtered bookings for the active month
  const monthlyBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Vehicle filter
      if (selectedVehicleFilter && b.vehiclePlate !== selectedVehicleFilter && b.vehicleId !== selectedVehicleFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'all' && b.status !== selectedStatusFilter) {
        return false;
      }
      // Keyword search
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const match =
          b.userName?.toLowerCase().includes(q) ||
          b.driverName?.toLowerCase().includes(q) ||
          b.vehiclePlate?.toLowerCase().includes(q) ||
          b.destination?.toLowerCase().includes(q) ||
          b.purpose?.toLowerCase().includes(q) ||
          b.bookingCode?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Check date matches current month & year
      const parsed = parseBookingDate(b.departureDate);
      if (!parsed) return false;
      return parsed.year === year && parsed.month === month;
    });
  }, [bookings, year, month, selectedVehicleFilter, selectedStatusFilter, searchKeyword]);

  // Group bookings by day number (1..31) for the active month
  const bookingsByDay = useMemo(() => {
    const map: Record<number, Booking[]> = {};

    monthlyBookings.forEach((b) => {
      const parsed = parseBookingDate(b.departureDate);
      if (parsed && parsed.year === year && parsed.month === month) {
        if (!map[parsed.day]) {
          map[parsed.day] = [];
        }
        map[parsed.day].push(b);
      }
    });

    return map;
  }, [monthlyBookings, year, month]);

  // Handle day click
  const handleDayClick = (dayNumber: number) => {
    const formattedDate = `${String(dayNumber).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${thaiYear}`;
    if (onNavigateBooking) {
      onNavigateBooking(formattedDate);
    }
  };

  // Year options for dropdown (e.g. 2565 to 2573 / 2022 to 2030)
  const yearOptions = [
    { ad: 2022, be: 2565 },
    { ad: 2023, be: 2566 },
    { ad: 2024, be: 2567 },
    { ad: 2025, be: 2568 },
    { ad: 2026, be: 2569 },
    { ad: 2027, be: 2570 },
    { ad: 2028, be: 2571 },
    { ad: 2029, be: 2572 },
    { ad: 2030, be: 2573 },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12 select-none bg-white p-3 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
      {/* ========================================================= */}
      {/* 1. STICKY TOP CONTROLS & HEADER (Stationary top)          */}
      {/* ========================================================= */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md pb-3 pt-1 space-y-3 border-b border-slate-100">
        {/* Main Title & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3 sm:p-4 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-amber-500" />
                ปฏิทินการจองรถยนต์ (Calendar View)
              </h1>
              <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold shadow-xs">
                เดือน {THAI_MONTHS[month]} {thaiYear} ({monthlyBookings.length} รายการ)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              ผู้ใช้: <span className="font-bold text-slate-900">{currentUser?.name || 'นายพิทักษ์ จุ้ยสัมพันธ์'}</span> •{' '}
              <span className="text-slate-600">{currentUser?.roleLabel || 'ผู้ดูแลระบบ'}</span> ({currentUser?.department || 'กองเทคโนโลยี'})
            </p>
          </div>

          {/* Action Controls & Selectors */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-2xl border border-slate-200 p-1 shadow-xs">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'calendar'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                ตารางปฏิทิน
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                รายการเดือนนี้
              </button>
            </div>

            {/* Month & Year Dropdown Selectors (ดูประวัติย้อนหลัง ปี / เดือน) */}
            <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-300 shadow-xs p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Select */}
              <select
                value={month}
                onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent py-1 px-1.5 rounded-lg focus:outline-none cursor-pointer"
              >
                {THAI_MONTHS.map((mName, idx) => (
                  <option key={mName} value={idx} className="bg-white text-slate-900">
                    {mName}
                  </option>
                ))}
              </select>

              {/* Year Select (รองรับประวัติย้อนหลัง) */}
              <select
                value={year}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent py-1 px-1.5 rounded-lg focus:outline-none cursor-pointer border-l border-slate-200"
              >
                {yearOptions.map((y) => (
                  <option key={y.ad} value={y.ad} className="bg-white text-slate-900">
                    พ.ศ. {y.be}
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-100 shadow-xs transition"
            >
              วันนี้
            </button>

            {onNavigateBooking && (
              <button
                onClick={() => onNavigateBooking()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                จองรถใหม่
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={() => {
                if (onLogout) onLogout();
              }}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* 2. VEHICLE COLOR TAGS BAR & SEARCH */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Vehicle Color Tags */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-slate-500" /> สีประจำรถ:
            </span>
            {vehicles.map((v) => {
              const color = getVehicleColor(v.id, v.plate);
              const isSelected = selectedVehicleFilter === v.plate || selectedVehicleFilter === v.id;
              const shortPlate = formatShortPlate(v.plate);

              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicleFilter(isSelected ? null : v.plate);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-400 font-extrabold shadow-sm'
                      : 'bg-white hover:bg-slate-100 border-slate-300 shadow-2xs'
                  }`}
                  title={`คลิกเพื่อกรองเฉพาะ ${v.name} (${shortPlate})`}
                >
                  {/* Crescent / Moon Icon indicator */}
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      fill={color.indicatorSvgColor}
                    />
                  </svg>

                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {shortPlate}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาคนขับ, ปลายทาง, ผู้จอง..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 sm:w-60 shadow-2xs"
              />
            </div>

            {(selectedVehicleFilter || selectedStatusFilter !== 'all' || searchKeyword) && (
              <button
                onClick={() => {
                  setSelectedVehicleFilter(null);
                  setSelectedStatusFilter('all');
                  setSearchKeyword('');
                }}
                className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* 3. Day Name Headers (Sun-Sat) */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center bg-white rounded-2xl py-2 px-1 border border-slate-200 shadow-xs">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={`text-xs sm:text-sm font-extrabold ${
                  idx === 0 || idx === 6
                    ? 'text-rose-600'
                    : 'text-slate-800'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. SCROLLABLE CALENDAR GRID OR LIST VIEW                  */}
      {/* ========================================================= */}
      {viewMode === 'calendar' ? (
        <div className="space-y-2">
          {/* Month Day Cards Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {/* 1. Leading Padding Days from Previous Month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const prevDayNum = daysInPrevMonth - firstDayOfWeek + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[120px] sm:min-h-[155px] rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-2.5 sm:p-3 opacity-40 select-none"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">
                    {prevDayNum}
                  </span>
                </div>
              );
            })}

            {/* 2. Days of the Current Month (1..daysInMonth) */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNumber = i + 1;
              const dayBookings = bookingsByDay[dayNumber] || [];
              const todayObj = new Date();
              const isToday =
                dayNumber === todayObj.getDate() &&
                month === todayObj.getMonth() &&
                year === todayObj.getFullYear();

              return (
                <div
                  key={`day-${dayNumber}`}
                  onClick={() => handleDayClick(dayNumber)}
                  className={`min-h-[125px] sm:min-h-[165px] rounded-2xl sm:rounded-3xl border transition-all duration-200 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 relative bg-white ${
                    dayBookings.length > 0
                      ? 'border-slate-300 shadow-xs'
                      : 'border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  {/* Top: Day Number & Quick Add */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm sm:text-base font-black ${
                        isToday
                          ? 'w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs sm:text-sm font-extrabold shadow-sm'
                          : 'text-slate-900'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    <span className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Middle/Bottom: Bookings Mini Cards (Featuring Driver, Plate, Destination, Time) */}
                  <div className="space-y-1.5 overflow-hidden flex-1 flex flex-col justify-end">
                    {dayBookings.slice(0, 3).map((booking) => {
                      const color = getVehicleColor(booking.vehicleId, booking.vehiclePlate);
                      const shortPlate = formatShortPlate(booking.vehiclePlate);

                      return (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBookingModal(booking);
                            if (onSelectBooking) onSelectBooking(booking);
                          }}
                          className={`border-l-4 ${color.border} ${color.bg} rounded-xl p-1.5 sm:p-2 border shadow-xs hover:shadow-md transition-all duration-150 text-left`}
                        >
                          {/* Line 1: ทะเบียนรถ + เวลา */}
                          <div className="font-extrabold text-[11px] sm:text-xs flex items-center justify-between leading-tight text-slate-900">
                            <span className="truncate flex items-center gap-1">
                              🚗 {shortPlate} <span className="font-medium text-[10px] text-slate-600">{formatDisplayTime(booking.departureTime)}</span>
                            </span>
                          </div>

                          {/* Line 2: ชื่อคนขับ */}
                          <div className="text-[10px] font-bold text-indigo-900 truncate mt-0.5 leading-tight flex items-center gap-1">
                            <span>👤 {booking.driverName || 'สมศักดิ์ ขับดี'}</span>
                          </div>

                          {/* Line 3: สถานที่ที่ไป + ผู้ขอใช้รถ */}
                          <div className="text-[9px] sm:text-[10px] text-slate-700 truncate mt-0.5 leading-tight font-medium">
                            📍 {booking.destination || 'จุดหมาย'} <span className="text-slate-500">({booking.userName})</span>
                          </div>
                        </div>
                      );
                    })}

                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-center font-extrabold text-indigo-700 py-0.5">
                        +{dayBookings.length - 3} รายการเพิ่มเติม
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 3. Trailing Padding Days for End of Calendar Grid */}
            {Array.from({
              length: (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7,
            }).map((_, i) => (
              <div
                key={`next-${i}`}
                className="min-h-[120px] sm:min-h-[155px] rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-2.5 sm:p-3 opacity-40 select-none"
              >
                <span className="text-xs sm:text-sm font-semibold text-slate-400">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 4. LIST VIEW FOR THE ACTIVE MONTH                         */
        /* ========================================================= */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-500" />
              รายการจองรถประจำเดือน {THAI_MONTHS[month]} {thaiYear} ({monthlyBookings.length} รายการ)
            </h3>
          </div>

          {monthlyBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              ไม่มีรายการจองรถในเดือน {THAI_MONTHS[month]} {thaiYear}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {monthlyBookings.map((b) => {
                const color = getVehicleColor(b.vehicleId, b.vehiclePlate);
                const shortPlate = formatShortPlate(b.vehiclePlate);

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBookingModal(b)}
                    className="p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 border ${color.badgeBg}`}
                      >
                        {shortPlate}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                            {b.bookingCode}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {b.vehicleName} ({b.vehiclePlate})
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              b.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : b.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {b.statusLabel || 'รออนุมัติ'}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-slate-900">
                            👤 คนขับ: {b.driverName || 'สมศักดิ์ ขับดี'}
                          </span>
                          <span className="flex items-center gap-1">
                            📍 ปลายทาง: {b.destination}
                          </span>
                          <span className="flex items-center gap-1">
                            ⏰ วันที่: {formatDisplayDate(b.departureDate)} เวลา {formatDisplayTime(b.departureTime)} - {formatDisplayTime(b.returnTime)} น.
                          </span>
                          <span className="flex items-center gap-1">
                            👥 ผู้ขอใช้รถ: {b.userName} ({b.userDepartment})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={(e) => handleOpenEdit(b, e)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-amber-200"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        แก้ไข
                      </button>
                      <button className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer border border-slate-200">
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BOOKING DETAIL MODAL                                   */}
      {/* ========================================================= */}
      {selectedBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {selectedBookingModal.bookingCode}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        selectedBookingModal.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : selectedBookingModal.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : selectedBookingModal.status === 'returned'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {selectedBookingModal.statusLabel || 'รออนุมัติ'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    🚗 {selectedBookingModal.vehiclePlate} — {selectedBookingModal.vehicleName}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedBookingModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Details */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm bg-white">
              {/* Highlight Box for Driver & Booker */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <div>
                  <span className="text-xs text-slate-500 block">👤 พนักงานขับรถ:</span>
                  <span className="font-bold text-indigo-900 text-base">
                    {selectedBookingModal.driverName || 'สมศักดิ์ ขับดี'}
                  </span>
                  <div className="text-xs text-slate-500 mt-0.5">ประจำกองยานพาหนะ OGA</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">👥 ผู้ขอใช้รถ:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedBookingModal.userName}
                  </span>
                  <div className="text-xs text-slate-500">{selectedBookingModal.userDepartment}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 block">กำหนดการเดินทาง:</span>
                    <span className="font-semibold text-slate-900">
                      {formatDisplayDate(selectedBookingModal.departureDate)} เวลา {formatDisplayTime(selectedBookingModal.departureTime)} น. ถึง{' '}
                      {formatDisplayDate(selectedBookingModal.returnDate)} เวลา {formatDisplayTime(selectedBookingModal.returnTime)} น.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 block">สถานที่ปลายทาง:</span>
                    <span className="font-bold text-slate-900 text-base">
                      {selectedBookingModal.destination}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 block">วัตถุประสงค์การใช้รถ:</span>
                    <span className="text-slate-800">
                      {selectedBookingModal.purpose || 'ไม่มีระบุ'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 block">จำนวนผู้โดยสาร:</span>
                    <span className="text-slate-800">
                      {selectedBookingModal.passengersCount || 1} ท่าน
                    </span>
                  </div>
                </div>
              </div>

              {/* Approvals Step History */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  ประวัติการอนุมัติ 2 ขั้นตอน (Approval Workflow):
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">1. หัวหน้างาน / ฝ่าย:</span>
                    <span className="font-medium text-slate-800">
                      {selectedBookingModal.approver1Name ? (
                        <span className="text-emerald-700 font-bold">
                          ✓ อนุมัติแล้ว ({selectedBookingModal.approver1Name})
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">รอการตรวจสอบ</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">2. ผู้อำนวยการ:</span>
                    <span className="font-medium text-slate-800">
                      {selectedBookingModal.approver2Name ? (
                        <span className="text-emerald-700 font-bold">
                          ✓ อนุมัติแล้ว ({selectedBookingModal.approver2Name})
                        </span>
                      ) : (
                        <span className="text-slate-400">รอขั้นตอนที่ 1</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-2.5 bg-slate-50/70">
              <button
                onClick={() => handleOpenEdit(selectedBookingModal)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Edit className="w-4 h-4" />
                แก้ไขข้อมูลการจอง (เปลี่ยนรถ/วัน/สถานที่)
              </button>

              <button
                onClick={() => setSelectedBookingModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      <EditBookingModal
        booking={bookingToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setBookingToEdit(null);
        }}
        onSave={handleSaveBookingEdit}
        onDelete={handleDeleteBooking}
        vehicles={vehicles}
      />
    </div>
  );
};

