import React from 'react';
import { Booking, Vehicle, User, MaintenanceItem } from '../types';
import {
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Plus,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  bookings: Booking[];
  vehicles: Vehicle[];
  maintenanceItems: MaintenanceItem[];
  onStartBooking: () => void;
  onSelectBooking: (booking: Booking) => void;
  onNavigateMaintenance: () => void;
  onNavigateApprovals: () => void;
  onNavigateCalendar?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  bookings,
  vehicles,
  maintenanceItems,
  onStartBooking,
  onSelectBooking,
  onNavigateMaintenance,
  onNavigateApprovals,
  onNavigateCalendar,
}) => {
  // Counts
  const totalBookings = bookings.length;
  const pendingApprovals = bookings.filter((b) => b.status === 'pending_dept' || b.status === 'pending_dir').length;
  const inProgressVehicles = vehicles.filter((v) => v.status === 'in_use').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const totalVehicles = vehicles.length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance').length;
  const criticalMaintenance = maintenanceItems.filter((m) => m.status === 'critical').length;

  const getStatusBadge = (status: Booking['status'], label: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'pending_dept':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300';
      case 'pending_dir':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300';
      case 'returned':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const monthlyStats = [
    { month: 'ต.ค.', count: 24, max: 50 },
    { month: 'พ.ย.', count: 31, max: 50 },
    { month: 'ธ.ค.', count: 28, max: 50 },
    { month: 'ม.ค.', count: 35, max: 50 },
    { month: 'ก.พ.', count: 42, max: 50 },
    { month: 'มี.ค.', count: 18, max: 50 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            สวัสดี, {currentUser.name} <span className="animate-wiggle inline-block">👋</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {currentUser.department} • วันที่ 15 มีนาคม 2569
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateCalendar && (
            <button
              onClick={onNavigateCalendar}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs md:text-sm shadow-sm transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>ปฏิทินการจอง</span>
            </button>
          )}

          <button
            onClick={onStartBooking}
            className="btn-3d flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-amber-500/25 transition cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>จองรถใหม่</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: การจองทั้งหมด */}
        <div
          onClick={onNavigateCalendar}
          className={`kpi-card p-5 rounded-2xl flex items-center gap-4 ${
            onNavigateCalendar ? 'cursor-pointer hover:border-indigo-500/50 transition' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">การจองทั้งหมด</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {totalBookings}
              </span>
              <span className="text-xs text-slate-500">รายการ</span>
            </div>
          </div>
        </div>

        {/* Card 2: รออนุมัติ */}
        <div
          onClick={onNavigateApprovals}
          className="kpi-card p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-amber-500/50 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">รออนุมัติ</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-500">{pendingApprovals}</span>
              <span className="text-xs text-slate-500">รายการ</span>
            </div>
          </div>
        </div>

        {/* Card 3: กำลังเดินทาง */}
        <div className="kpi-card p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">กำลังเดินทาง</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                {inProgressVehicles}
              </span>
              <span className="text-xs text-slate-500">คัน</span>
            </div>
          </div>
        </div>

        {/* Card 4: รถพร้อมใช้ */}
        <div className="kpi-card p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">รถพร้อมใช้</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {availableVehicles}
              </span>
              <span className="text-xs text-slate-500">จาก {totalVehicles} คัน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Usage Statistics & Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart 2/3 */}
        <div className="lg:col-span-2 panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                สถิติการใช้รถ
              </h3>
              <p className="text-xs text-slate-500">6 เดือนล่าสุด</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="w-3.5 h-3.5" /> +12% จากเดือนก่อน
            </span>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-44 flex items-end justify-between gap-4 pt-4 px-2">
            {monthlyStats.map((item, idx) => {
              const heightPercent = (item.count / item.max) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    {item.count}
                  </span>
                  <div className="w-full max-w-[48px] bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden h-28 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-slate-900 to-amber-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Fleet Status Summary 1/3 */}
        <div className="panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4">
              สถานะรถ
            </h3>

            <div className="space-y-3.5">
              {/* Ready */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span>พร้อมใช้งาน</span>
                  <span className="font-bold text-emerald-600">{availableVehicles}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(availableVehicles / totalVehicles) * 100}%` }}
                  />
                </div>
              </div>

              {/* In trip */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span>กำลังเดินทาง</span>
                  <span className="font-bold text-purple-600">{inProgressVehicles}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(inProgressVehicles / totalVehicles) * 100}%` }}
                  />
                </div>
              </div>

              {/* Maintenance */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span>ซ่อมบำรุง</span>
                  <span className="font-bold text-rose-500">{maintenanceVehicles}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(maintenanceVehicles / totalVehicles) * 100}%` }}
                  />
                </div>
              </div>

              {/* Reserved */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span>ถูกจอง</span>
                  <span className="font-bold text-amber-500">{pendingApprovals}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(pendingApprovals / totalVehicles) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Notice */}
          <div
            onClick={onNavigateMaintenance}
            className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition group"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  แจ้งเตือนซ่อมบำรุง
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400">
                  {criticalMaintenance} คัน มีรายการใกล้หมดอายุ
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* Bottom Table: การจองล่าสุด */}
      <div className="panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            การจองล่าสุด
          </h3>
          <button
            onClick={onNavigateApprovals}
            className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1"
          >
            ดูทั้งหมด <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-3">เลขที่จอง</th>
                <th className="py-3 px-3">ผู้จอง</th>
                <th className="py-3 px-3">รถ</th>
                <th className="py-3 px-3">ปลายทาง</th>
                <th className="py-3 px-3">วันที่</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bookings.slice(0, 5).map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => onSelectBooking(booking)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {booking.bookingCode}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {booking.userName}
                    </div>
                    <div className="text-[10px] text-slate-400">{booking.userDepartment}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                    {booking.vehicleName}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {booking.destination}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {booking.departureDate}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        booking.status,
                        booking.statusLabel
                      )}`}
                    >
                      {booking.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
