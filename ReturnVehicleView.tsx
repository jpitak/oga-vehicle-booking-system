import React, { useState } from 'react';
import { Booking, Vehicle, User } from '../types';
import { SignaturePad } from './SignaturePad';
import { apiService } from '../services/apiService';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Car,
  Gauge,
  Fuel,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Calendar,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';

interface ReturnVehicleViewProps {
  currentUser: User;
  bookings: Booking[];
  vehicles: Vehicle[];
  onReturnSuccess: (updatedBooking: Booking, updatedVehicle: Vehicle) => void;
}

export const ReturnVehicleView: React.FC<ReturnVehicleViewProps> = ({
  currentUser,
  bookings,
  vehicles,
  onReturnSuccess,
}) => {
  // Trips eligible for return (status: 'in_progress' or 'approved')
  const activeTrips = bookings.filter((b) => b.status === 'in_progress' || b.status === 'approved');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Return Form State
  const [returnMileage, setReturnMileage] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  const [gasCost, setGasCost] = useState<number>(0);
  const [returnCondition, setReturnCondition] = useState('ปกติ เรียบร้อยดี');
  const [returnNote, setReturnNote] = useState('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenReturnModal = (booking: Booking) => {
    setSelectedBooking(booking);
    const v = vehicles.find((veh) => veh.id === booking.vehicleId);
    const currentM = v ? v.mileage : (booking.startMileage || 0);
    setReturnMileage(currentM + 120); // Suggested end mileage
    setFuelCost(0);
    setGasCost(0);
    setReturnCondition('ปกติ เรียบร้อยดี');
    setReturnNote('');
    setSignature('');
  };

  const handleConfirmReturn = async () => {
    if (!selectedBooking) return;
    const v = vehicles.find((veh) => veh.id === selectedBooking.vehicleId);
    const startM = selectedBooking.startMileage || (v ? v.mileage : 0);

    if (returnMileage < startM) {
      alert(`เลขไมล์คืนรถ (${returnMileage}) ต้องไม่น้อยกว่าเลขไมล์เริ่มต้น (${startM})`);
      return;
    }

    setIsSubmitting(true);
    const returnDateActual = new Date().toLocaleString('th-TH');

    const updatedBooking: Booking = {
      ...selectedBooking,
      status: 'returned',
      statusLabel: 'คืนรถแล้ว',
      returnMileage,
      fuelCost,
      gasCost,
      returnCondition,
      returnNote,
      returnSignature: signature,
      returnDateActual,
      updatedAt: new Date().toISOString(),
    };

    // Update vehicle mileage and set status back to available
    const updatedVehicle: Vehicle = v
      ? {
          ...v,
          status: 'available',
          mileage: returnMileage,
          currentLocation: 'ลานจอด OGA สำนักงานใหญ่',
        }
      : {
          id: selectedBooking.vehicleId,
          name: selectedBooking.vehicleName,
          type: 'รถเก๋ง',
          plate: selectedBooking.vehiclePlate,
          seats: 5,
          fuelType: 'เบนซิน',
          mileage: returnMileage,
          color: 'ขาว',
          image: selectedBooking.vehicleImage || '',
          insuranceExpiry: '31 ธ.ค. 2569',
          taxExpiry: '31 ธ.ค. 2569',
          inspectionExpiry: '31 ธ.ค. 2569',
          status: 'available',
          currentLocation: 'ลานจอด OGA สำนักงานใหญ่',
        };

    try {
      await apiService.saveBooking(updatedBooking);
      apiService.saveVehicle(updatedVehicle);

      apiService.addNotification({
        title: `คืนยานพาหนะสำเร็จ`,
        message: `รหัส ${updatedBooking.bookingCode} (${updatedBooking.vehicleName}) คืนรถเข้าสู่ระบบเรียบร้อย`,
        type: 'return',
        bookingCode: updatedBooking.bookingCode,
      });

      // Line Notify
      apiService.sendLineNotify({
        bookingCode: updatedBooking.bookingCode,
        userName: updatedBooking.userName,
        vehicleName: `${updatedBooking.vehicleName} (${updatedBooking.vehiclePlate})`,
        destination: updatedBooking.destination,
        departureDate: updatedBooking.departureDate,
        status: `คืนรถเรียบร้อย (ระยะทาง ${returnMileage - startM} กม.)`,
        note: `ค่าน้ำมัน: ${fuelCost + gasCost} บาท • สภาพ: ${returnCondition}`,
      });

      confetti({
        particleCount: 70,
        spread: 60,
      });

      onReturnSuccess(updatedBooking, updatedVehicle);
      setSelectedBooking(null);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-500" />
          ระบบบันทึกการคืนยานพาหนะ (Vehicle Return)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          บันทึกเลขไมล์ ค่าน้ำมัน สภาพตัวรถ และลงนามส่งมอบยานพาหนะคืน OGA Fleet
        </p>
      </div>

      {/* Active Trips Cards */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
          รายการที่กำลังเดินทาง / พร้อมคืนรถ ({activeTrips.length} รายการ)
        </h3>

        {activeTrips.length === 0 ? (
          <div className="panel p-12 text-center rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              ไม่มียานพาหนะที่อยู่ระหว่างการเดินทางในขณะนี้
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ยานพาหนะทุกคันจอดประจำการพร้อมใช้งาน
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTrips.map((b) => (
              <div
                key={b.id}
                className="panel p-5 rounded-2xl border hover:border-amber-500/60 transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                      {b.bookingCode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {b.statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {b.vehicleImage && (
                      <img
                        src={b.vehicleImage}
                        alt={b.vehicleName}
                        className="w-14 h-11 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {b.vehicleName}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">{b.vehiclePlate}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ผู้ขอจอง:</span>
                      <b className="text-slate-800 dark:text-slate-200">{b.userName}</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ปลายทาง:</span>
                      <span className="text-slate-800 dark:text-slate-200">{b.destination}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">คนขับ:</span>
                      <span className="text-slate-800 dark:text-slate-200">{b.driverName}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenReturnModal(b)}
                  className="btn-3d w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>บันทึกส่งคืนรถคันนี้</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RETURN VEHICLE MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    แบบฟอร์มส่งมอบคืนยานพาหนะ
                    <span className="font-mono text-amber-600">{selectedBooking.bookingCode}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedBooking.vehicleName} ({selectedBooking.vehiclePlate})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Start & End Mileage */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">เลขไมล์ก่อนเดินทาง</span>
                  <b className="text-base font-mono text-slate-800 dark:text-slate-200">
                    {(selectedBooking.startMileage || 78540).toLocaleString()} กม.
                  </b>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    เลขไมล์เมื่อคืนรถ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={returnMileage}
                    onChange={(e) => setReturnMileage(Number(e.target.value))}
                    className="w-full text-sm font-mono px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">ระยะทางที่ใช้จริง</span>
                  <b className="text-base font-mono text-emerald-600 dark:text-emerald-400">
                    +{Math.max(0, returnMileage - (selectedBooking.startMileage || 78540))} กม.
                  </b>
                </div>
              </div>

              {/* Fuel & Gas Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ค่าน้ำมัน (บาท)
                  </label>
                  <div className="relative">
                    <Fuel className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min={0}
                      value={fuelCost}
                      onChange={(e) => setFuelCost(Number(e.target.value))}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ค่าทางด่วน / อื่นๆ (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={gasCost}
                    onChange={(e) => setGasCost(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  สภาพตัวรถเมื่อส่งมอบคืน
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="ปกติ เรียบร้อยดี">ปกติ เรียบร้อยดี ไม่มีรอยเฉี่ยวชน</option>
                  <option value="มีรอยขีดข่วนเล็กน้อย">มีรอยขีดข่วนเล็กน้อย (แจ้งหัวหน้างานแล้ว)</option>
                  <option value="ล้างทำความสะอาดเรียบร้อย">ล้างทำความสะอาดเรียบร้อย</option>
                  <option value="พบปัญหาเครื่องยนต์/อุปกรณ์">พบปัญหาเครื่องยนต์/อุปกรณ์ (แจ้งศูนย์ตรวจ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  หมายเหตุเพิ่มเติม:
                </label>
                <textarea
                  rows={2}
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="เช่น เติมน้ำมันเต็มถังเรียบร้อย, คืนกุญแจที่ป้อม รปภ..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Signature */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-500" />
                  ลายเซ็นผู้ส่งมอบคืนรถ:
                </label>
                <SignaturePad
                  height={130}
                  label="วาดลายเซ็นส่งมอบรถที่นี่"
                  onSave={(dataUrl) => setSignature(dataUrl)}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReturn}
                className="btn-3d px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันการคืนรถเข้าสู่ระบบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
