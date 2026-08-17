import React, { useState } from 'react';
import { Booking, Vehicle } from '../types';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  Calendar,
  Fuel,
  Gauge,
  CheckCircle2,
  Users,
  Car,
} from 'lucide-react';

interface ReportsViewProps {
  bookings: Booking[];
  vehicles: Vehicle[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ bookings, vehicles }) => {
  const [timeRange, setTimeRange] = useState('year');

  const totalTrips = bookings.length + 172; // Combined with history
  const totalDistance = 14350;
  const totalFuelCost = 38400;
  const approvalRate = 96.4;

  const departmentData = [
    { name: 'ฝ่ายการเงิน', count: 48, percent: 35, color: 'bg-amber-500' },
    { name: 'ฝ่ายพัฒนาและวิจัย', count: 38, percent: 28, color: 'bg-blue-500' },
    { name: 'ฝ่ายบริหารจัดการ', count: 30, percent: 22, color: 'bg-purple-500' },
    { name: 'ฝ่ายสนับสนุน OGA', count: 21, percent: 15, color: 'bg-emerald-500' },
  ];

  const topVehicles = [
    { name: 'Toyota Camry (กข 1234 กทม.)', trips: 56, dist: '4,230 กม.', rate: '98%' },
    { name: 'Toyota Fortuner (คง 5678 กทม.)', trips: 44, dist: '3,840 กม.', rate: '95%' },
    { name: 'Toyota Hiace (ญฎ 7890 กทม.)', trips: 32, dist: '3,120 กม.', rate: '92%' },
    { name: 'Honda Odyssey (วจ 9012 กทม.)', trips: 28, dist: '2,100 กม.', rate: '90%' },
    { name: 'Isuzu D-Max (ชช 3456 กทม.)', trips: 18, dist: '1,060 กม.', rate: '88%' },
  ];

  const handleExportCSV = () => {
    const headers = ['รหัสการจอง', 'ผู้ขอจอง', 'ฝ่าย', 'ยานพาหนะ', 'ทะเบียน', 'ปลายทาง', 'วัตถุประสงค์', 'วันที่ไป', 'สถานะ'];
    const rows = bookings.map((b) => [
      b.bookingCode,
      `"${b.userName}"`,
      `"${b.userDepartment}"`,
      `"${b.vehicleName}"`,
      `"${b.vehiclePlate}"`,
      `"${b.destination}"`,
      `"${b.purpose}"`,
      b.departureDate,
      b.statusLabel,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `oga_fleet_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            รายงานและสถิติการใช้ยานพาหนะ OGA Fleet
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปข้อมูลการใช้ยานพาหนะ ระยะทาง ค่าน้ำมัน และสัดส่วนการใช้งานแต่ละแผนก
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500">การใช้รถรวม</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalTrips} <span className="text-xs font-normal text-slate-400">ครั้ง</span>
            </div>
          </div>
        </div>

        <div className="panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500">ระยะทางสะสม</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {totalDistance.toLocaleString()} <span className="text-xs font-normal text-slate-400">กม.</span>
            </div>
          </div>
        </div>

        <div className="panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500">ค่าน้ำมันรวม</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              ฿{totalFuelCost.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500">อัตราการอนุมัติ</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {approvalRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Usage Breakdown */}
        <div className="panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" /> สัดส่วนการใช้รถแยกตามฝ่าย
            </h3>
            <span className="text-xs text-slate-400">OGA International</span>
          </div>

          <div className="space-y-4">
            {departmentData.map((d) => (
              <div key={d.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{d.name}</span>
                  <span>{d.count} ครั้ง ({d.percent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${d.color} rounded-full transition-all duration-500`}
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vehicles Ranking */}
        <div className="panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> อันดับรถที่ใช้งานสูงสุด
            </h3>
            <span className="text-xs text-slate-400">5 อันดับแรก</span>
          </div>

          <div className="space-y-2.5">
            {topVehicles.map((v, idx) => (
              <div
                key={v.name}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{v.name}</span>
                </div>

                <div className="flex items-center gap-4 text-slate-500 font-mono">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{v.trips} เที่ยว</span>
                  <span>{v.dist}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
