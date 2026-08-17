import React, { useState } from 'react';
import { Vehicle } from '../types';
import { apiService } from '../services/apiService';
import {
  Car,
  Plus,
  Edit,
  Wrench,
  CheckCircle2,
  Users,
  Fuel,
  Gauge,
  Calendar,
  X,
  Sparkles,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface VehicleFleetViewProps {
  vehicles: Vehicle[];
  onUpdateVehicles: (updatedList: Vehicle[]) => void;
}

export const VehicleFleetView: React.FC<VehicleFleetViewProps> = ({
  vehicles,
  onUpdateVehicles,
}) => {
  const [filterType, setFilterType] = useState('ทั้งหมด');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // New vehicle form state
  const [name, setName] = useState('');
  const [type, setType] = useState('รถเก๋ง');
  const [plate, setPlate] = useState('');
  const [seats, setSeats] = useState(5);
  const [fuelType, setFuelType] = useState('เบนซิน + แก๊ส LPG (2 เชื้อเพลิง)');
  const [mileage, setMileage] = useState(10000);
  const [color, setColor] = useState('ขาว');
  const [image, setImage] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('31/12/2570');
  const [taxExpiry, setTaxExpiry] = useState('31/12/2570');
  const [inspectionExpiry, setInspectionExpiry] = useState('31/12/2570');
  const [gasCertExpiry, setGasCertExpiry] = useState('31/12/2570');
  const [gasTankExpiry, setGasTankExpiry] = useState('31/12/2575');

  const vehicleTypes = ['ทั้งหมด', 'รถเก๋ง', 'รถตู้', 'รถกระบะ', 'รถ SUV'];

  const filteredVehicles = vehicles.filter((v) => {
    if (filterType === 'ทั้งหมด') return true;
    return v.type === filterType;
  });

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const newV: Vehicle = {
      id: editingVehicle ? editingVehicle.id : `v-${Date.now()}`,
      name,
      type,
      plate,
      seats: Number(seats),
      fuelType,
      mileage: Number(mileage),
      color,
      image: image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
      insuranceExpiry,
      taxExpiry,
      inspectionExpiry,
      gasCertExpiry: fuelType.includes('แก๊ส') || fuelType.includes('2 เชื้อเพลิง') ? gasCertExpiry : undefined,
      gasTankExpiry: fuelType.includes('แก๊ส') || fuelType.includes('2 เชื้อเพลิง') ? gasTankExpiry : undefined,
      status: editingVehicle ? editingVehicle.status : 'available',
      currentLocation: 'ลานจอด OGA สำนักงานใหญ่',
    };

    const updated = apiService.saveVehicle(newV);
    onUpdateVehicles(updated);
    setShowAddModal(false);
    setEditingVehicle(null);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    const updated = apiService.deleteVehicle(vehicleId);
    onUpdateVehicles(updated);
    setShowAddModal(false);
    setEditingVehicle(null);
    setVehicleToDelete(null);
  };

  const handleToggleMaintenance = (v: Vehicle) => {
    const newStatus = v.status === 'maintenance' ? 'available' : 'maintenance';
    const updated = vehicles.map((item) => (item.id === v.id ? { ...item, status: newStatus as any } : item));
    apiService.saveVehicle({ ...v, status: newStatus as any });
    onUpdateVehicles(updated);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setName(v.name);
    setType(v.type);
    setPlate(v.plate);
    setSeats(v.seats);
    setFuelType(v.fuelType || 'เบนซิน + แก๊ส LPG (2 เชื้อเพลิง)');
    setMileage(v.mileage);
    setColor(v.color);
    setImage(v.image);
    setInsuranceExpiry(v.insuranceExpiry);
    setTaxExpiry(v.taxExpiry || '31/12/2570');
    setInspectionExpiry(v.inspectionExpiry);
    setGasCertExpiry(v.gasCertExpiry || '31/12/2570');
    setGasTankExpiry(v.gasTankExpiry || '31/12/2575');
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-500" />
            จัดการยานพาหนะ OGA Fleet ({vehicles.length} คัน)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            รายการรถยนต์ ทะเบียน ประกัน พ.ร.บ. และสถานะความพร้อมใช้งาน
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVehicle(null);
            setName('');
            setPlate('');
            setShowAddModal(true);
          }}
          className="btn-3d flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มยานพาหนะใหม่</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {vehicleTypes.map((t) => {
          const count = t === 'ทั้งหมด' ? vehicles.length : vehicles.filter((v) => v.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterType === t
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>{t}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVehicles.map((v) => (
          <div
            key={v.id}
            className="panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
          >
            <div>
              {/* Image & Status Badge */}
              <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800">
                <img
                  src={v.image}
                  alt={v.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md ${
                      v.status === 'available'
                        ? 'bg-emerald-500 text-white'
                        : v.status === 'in_use'
                        ? 'bg-purple-600 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {v.status === 'available'
                      ? 'พร้อมใช้งาน'
                      : v.status === 'in_use'
                      ? 'กำลังเดินทาง'
                      : 'ส่งซ่อมบำรุง'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-mono text-xs font-bold">
                  {v.plate}
                </div>
              </div>

              {/* Specs */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {v.name}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">{v.type}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.seats} ที่นั่ง</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.fuelType}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.mileage.toLocaleString()} กม.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>สี{v.color}</span>
                  </div>
                </div>

                {/* Expiry Dates Box */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ประกันภัย:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{v.insuranceExpiry}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ภาษี / พ.ร.บ.:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{v.taxExpiry || '31/12/2570'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ตรวจสภาพ:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{v.inspectionExpiry}</span>
                  </div>
                  {(v.fuelType?.includes('แก๊ส') || v.fuelType?.includes('2 เชื้อเพลิง')) && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-blue-600 dark:text-blue-400 font-medium">
                      <span>🛢️ วิศวกรแก๊ส:</span>
                      <span>{v.gasCertExpiry || '31/12/2570'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(v)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> แก้ไข
              </button>

              <button
                type="button"
                onClick={() => handleToggleMaintenance(v)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
                  v.status === 'maintenance'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{v.status === 'maintenance' ? 'พร้อมใช้' : 'ส่งซ่อม'}</span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleToDelete(v)}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-xl transition flex items-center justify-center cursor-pointer"
                title="ลบยานพาหนะนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editingVehicle ? 'แก้ไขข้อมูลยานพาหนะ' : 'เพิ่มยานพาหนะใหม่เข้า OGA Fleet'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 space-y-3.5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ยี่ห้อ & รุ่นรถ
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Toyota Camry"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ประเภทรถ
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="รถเก๋ง">รถเก๋ง</option>
                    <option value="รถตู้">รถตู้</option>
                    <option value="รถกระบะ">รถกระบะ</option>
                    <option value="รถ SUV">รถ SUV</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    หมายเลขทะเบียน
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="กข 1234 กทม."
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    จำนวนที่นั่ง
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ประเภทเชื้อเพลิง
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="เบนซิน + แก๊ส LPG (2 เชื้อเพลิง)">เบนซิน + แก๊ส LPG (2 เชื้อเพลิง)</option>
                    <option value="เบนซิน + แก๊ส NGV (2 เชื้อเพลิง)">เบนซิน + แก๊ส NGV (2 เชื้อเพลิง)</option>
                    <option value="ดีเซล + แก๊ส (2 เชื้อเพลิง)">ดีเซล + แก๊ส (2 เชื้อเพลิง)</option>
                    <option value="เบนซิน">เบนซิน</option>
                    <option value="ดีเซล">ดีเซล</option>
                    <option value="ไฮบริด (Hybrid)">ไฮบริด (Hybrid)</option>
                    <option value="ไฟฟ้า 100% (EV)">ไฟฟ้า 100% (EV)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    เลขไมล์ปัจจุบัน (กม.)
                  </label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  URL รูปภาพรถ
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    วันหมดอายุประกันภัย
                  </label>
                  <input
                    type="text"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    วันชำระภาษี / พ.ร.บ.
                  </label>
                  <input
                    type="text"
                    value={taxExpiry}
                    onChange={(e) => setTaxExpiry(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    วันตรวจสภาพรถ ตรอ.
                  </label>
                  <input
                    type="text"
                    value={inspectionExpiry}
                    onChange={(e) => setInspectionExpiry(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              {(fuelType.includes('แก๊ส') || fuelType.includes('2 เชื้อเพลิง')) && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <Fuel className="w-4 h-4 text-blue-500" />
                    <span>ข้อมูลเฉพาะระบบแก๊ส 2 เชื้อเพลิง (LPG / NGV)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        วันหมดอายุใบรับรองวิศวกรแก๊ส
                      </label>
                      <input
                        type="text"
                        value={gasCertExpiry}
                        onChange={(e) => setGasCertExpiry(e.target.value)}
                        placeholder="เช่น 15/10/2570"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        วันหมดอายุถังแก๊ส (10 ปี)
                      </label>
                      <input
                        type="text"
                        value={gasTankExpiry}
                        onChange={(e) => setGasTankExpiry(e.target.value)}
                        placeholder="เช่น 20/12/2575"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                {editingVehicle ? (
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleToDelete(editingVehicle);
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบยานพาหนะ</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition cursor-pointer"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                ยืนยันการลบข้อมูลยานพาหนะ?
              </h3>
              <p className="text-xs text-slate-500">
                ต้องการลบยานพาหนะคันนี้ออกจากระบบ OGA Fleet หรือไม่
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
              <img
                src={vehicleToDelete.image}
                alt={vehicleToDelete.name}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {vehicleToDelete.name}
                </div>
                <div className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                  {vehicleToDelete.plate}
                </div>
                <div className="text-[11px] text-slate-500">
                  {vehicleToDelete.type} • {vehicleToDelete.seats} ที่นั่ง • {vehicleToDelete.fuelType}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/40">
              ⚠️ หมายเหตุ: การลบนี้จะลบข้อมูลยานพาหนะและซิงค์กับฐานข้อมูล Google Sheet
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeleteVehicle(vehicleToDelete.id)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันการลบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
