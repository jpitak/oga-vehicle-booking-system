import React, { useState } from 'react';
import { Booking, User, Vehicle } from '../types';
import { SignaturePad } from './SignaturePad';
import { EditBookingModal } from './EditBookingModal';
import { apiService } from '../services/apiService';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  FileCheck,
  UserCheck,
  Calendar,
  MapPin,
  Car,
  AlertCircle,
  X,
  MessageSquare,
  Edit,
} from 'lucide-react';

interface ApprovalViewProps {
  currentUser: User;
  bookings: Booking[];
  vehicles?: Vehicle[];
  onUpdateBooking: (updated: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  currentUser,
  bookings,
  vehicles = [],
  onUpdateBooking,
  onDeleteBooking,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending_dept' | 'pending_dir' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Edit Modal State
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Approval Form State
  const [approverNote, setApproverNote] = useState('');
  const [approverSignature, setApproverSignature] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter !== 'all' && b.status !== activeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        b.bookingCode.toLowerCase().includes(term) ||
        b.userName.toLowerCase().includes(term) ||
        b.vehicleName.toLowerCase().includes(term) ||
        b.destination.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleApprove = async () => {
    if (!selectedBooking) return;
    setIsProcessing(true);

    const nowStr = new Date().toLocaleString('th-TH');
    let updatedBooking: Booking;

    if (selectedBooking.status === 'pending_dept') {
      // Approver 1 (หัวหน้างาน) approved -> Next step is pending_dir
      updatedBooking = {
        ...selectedBooking,
        status: 'pending_dir',
        statusLabel: 'รออนุมัติ ผอ.',
        approver1Name: currentUser.name,
        approver1Date: nowStr,
        approver1Note: approverNote || 'อนุมัติคำขอจองรถตามระเบียบ',
        approver1Signature: approverSignature,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Approver 2 (ผอ.) approved -> Final approval
      updatedBooking = {
        ...selectedBooking,
        status: 'approved',
        statusLabel: 'อนุมัติแล้ว',
        approver2Name: currentUser.name,
        approver2Date: nowStr,
        approver2Note: approverNote || 'อนุมัติคำขอจองรถ อนุญาตให้เดินทางได้',
        approver2Signature: approverSignature,
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      await apiService.saveBooking(updatedBooking);
      onUpdateBooking(updatedBooking);

      apiService.addNotification({
        title: `การจอง ${updatedBooking.bookingCode} ได้รับการอนุมัติ`,
        message: `โดย ${currentUser.name} (${currentUser.roleLabel}) - สถานะ: ${updatedBooking.statusLabel}`,
        type: 'approval',
        bookingCode: updatedBooking.bookingCode,
      });

      // Line Notify
      apiService.sendLineNotify({
        bookingCode: updatedBooking.bookingCode,
        userName: updatedBooking.userName,
        vehicleName: updatedBooking.vehicleName,
        destination: updatedBooking.destination,
        departureDate: updatedBooking.departureDate,
        status: `อนุมัติแล้วโดย ${currentUser.name} (${currentUser.roleLabel})`,
        note: approverNote,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
      });

      setSelectedBooking(null);
      setApproverNote('');
      setApproverSignature('');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !rejectionReason.trim()) {
      alert('กรุณาระบุเหตุผลการปฏิเสธคำขอ');
      return;
    }
    setIsProcessing(true);

    const updatedBooking: Booking = {
      ...selectedBooking,
      status: 'rejected',
      statusLabel: 'ไม่อนุมัติ',
      rejectionReason,
      rejectedBy: `${currentUser.name} (${currentUser.roleLabel})`,
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiService.saveBooking(updatedBooking);
      onUpdateBooking(updatedBooking);

      apiService.addNotification({
        title: `การจอง ${updatedBooking.bookingCode} ถูกปฏิเสธ`,
        message: `เหตุผล: ${rejectionReason}`,
        type: 'approval',
        bookingCode: updatedBooking.bookingCode,
      });

      apiService.sendLineNotify({
        bookingCode: updatedBooking.bookingCode,
        userName: updatedBooking.userName,
        vehicleName: updatedBooking.vehicleName,
        destination: updatedBooking.destination,
        departureDate: updatedBooking.departureDate,
        status: `ไม่อนุมัติ โดย ${currentUser.name}`,
        note: rejectionReason,
      });

      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectionReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-500" />
            ระบบอนุมัติการจองรถ (2-Tier Workflow)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ขั้นตอนการอนุมัติ: 1. หัวหน้าฝ่าย ➔ 2. ผู้อำนวยการ ➔ อนุมัติสมบูรณ์
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่จอง, ชื่อผู้ขอ, รถ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'ทั้งหมด', count: bookings.length },
          {
            id: 'pending_dept',
            label: 'รออนุมัติหัวหน้า',
            count: bookings.filter((b) => b.status === 'pending_dept').length,
          },
          {
            id: 'pending_dir',
            label: 'รออนุมัติ ผอ.',
            count: bookings.filter((b) => b.status === 'pending_dir').length,
          },
          {
            id: 'approved',
            label: 'อนุมัติแล้ว',
            count: bookings.filter((b) => b.status === 'approved' || b.status === 'in_progress' || b.status === 'returned').length,
          },
          {
            id: 'rejected',
            label: 'ไม่อนุมัติ',
            count: bookings.filter((b) => b.status === 'rejected').length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeFilter === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === tab.id
                  ? 'bg-slate-950 text-amber-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings Table Panel */}
      <div className="panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="py-3.5 px-4">เลขที่จอง</th>
                <th className="py-3.5 px-4">ผู้ขอใช้รถ</th>
                <th className="py-3.5 px-4">ยานพาหนะ</th>
                <th className="py-3.5 px-4">ปลายทาง & ภารกิจ</th>
                <th className="py-3.5 px-4">วัน-เวลาเดินทาง</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ไม่พบรายการจองในหมวดนี้
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isPending = b.status === 'pending_dept' || b.status === 'pending_dir';
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {b.bookingCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {b.userName}
                        </div>
                        <div className="text-[10px] text-slate-400">{b.userDepartment}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {b.vehicleName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{b.vehiclePlate}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px] truncate">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {b.destination}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{b.purpose}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <div>{b.departureDate}</div>
                        <div className="text-[10px] text-slate-400">{b.departureTime} น.</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                            b.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : b.status === 'pending_dept'
                              ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                              : b.status === 'pending_dir'
                              ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                              : b.status === 'in_progress'
                              ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300'
                              : b.status === 'returned'
                              ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {b.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBookingToEdit(b);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 transition text-xs font-semibold flex items-center gap-1 border border-amber-200 dark:border-amber-800/40"
                              title="แก้ไขข้อมูลก่อนอนุมัติ"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">แก้ไข</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setApproverNote('');
                              setApproverSignature('');
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1 ${
                              isPending
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isPending ? 'พิจารณาอนุมัติ' : 'ดูรายละเอียด'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED APPROVAL MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    พิจารณาคำขอจองยานพาหนะ
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      {selectedBooking.bookingCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    สถานะปัจจุบัน: <b className="text-slate-800 dark:text-slate-200">{selectedBooking.statusLabel}</b>
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

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Trip Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">ผู้ขอใช้รถ:</span>{' '}
                  <b className="text-slate-800 dark:text-slate-200">
                    {selectedBooking.userName} ({selectedBooking.userDepartment})
                  </b>
                </div>
                <div>
                  <span className="text-slate-400">ยานพาหนะ:</span>{' '}
                  <b className="text-slate-800 dark:text-slate-200">
                    {selectedBooking.vehicleName} ({selectedBooking.vehiclePlate})
                  </b>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-400">สถานที่ปลายทาง:</span>{' '}
                  <b className="text-slate-800 dark:text-slate-200">{selectedBooking.destination}</b>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-400">วัตถุประสงค์:</span>{' '}
                  <b className="text-slate-800 dark:text-slate-200">{selectedBooking.purpose}</b>
                </div>
                <div>
                  <span className="text-slate-400">วันเดินทาง:</span>{' '}
                  <b className="text-slate-800 dark:text-slate-200">
                    {selectedBooking.departureDate} {selectedBooking.departureTime} - {selectedBooking.returnDate} {selectedBooking.returnTime}
                  </b>
                </div>
                <div>
                  <span className="text-slate-400">พนักงานขับรถ:</span>{' '}
                  <b className="text-slate-800 dark:text-slate-200">
                    {selectedBooking.driverName} ({selectedBooking.passengersCount} คน)
                  </b>
                </div>
              </div>

              {/* Edit Request Button Bar (Before Approval) */}
              {(selectedBooking.status === 'pending_dept' || selectedBooking.status === 'pending_dir') && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <span className="text-amber-800 dark:text-amber-300 font-medium">
                    ⚠️ ต้องการปรับเปลี่ยนทะเบียนรถ, คนขับ, วันที่ หรือสถานที่ก่อนลงนามอนุมัติ?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingToEdit(selectedBooking);
                      setIsEditModalOpen(true);
                      setSelectedBooking(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    แก้ไขข้อมูลคำขอ
                  </button>
                </div>
              )}

              {/* Applicant Signature Preview */}
              {selectedBooking.userSignature && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    ลายเซ็นดิจิทัลของผู้ขอจอง:
                  </span>
                  <div className="h-16 flex items-center bg-slate-50 dark:bg-slate-800/40 rounded-lg px-4 border border-dashed border-slate-200 dark:border-slate-700">
                    <img
                      src={selectedBooking.userSignature}
                      alt="User Signature"
                      className="max-h-12 max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* 2-Tier Approvals Progression Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: หัวหน้างาน */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      1. ความเห็นหัวหน้าฝ่าย
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedBooking.approver1Name
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {selectedBooking.approver1Name ? 'อนุมัติแล้ว' : 'รอการพิจารณา'}
                    </span>
                  </div>
                  {selectedBooking.approver1Name ? (
                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      <div>ผู้อนุมัติ: <b className="text-slate-800 dark:text-slate-200">{selectedBooking.approver1Name}</b></div>
                      <div>วันที่: {selectedBooking.approver1Date}</div>
                      <div>ความเห็น: {selectedBooking.approver1Note || 'อนุมัติ'}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">ยังไม่มีการบันทึกการอนุมัติ</p>
                  )}
                </div>

                {/* Step 2: ผู้อำนวยการ */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      2. ความเห็นผู้อำนวยการ
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedBooking.approver2Name
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {selectedBooking.approver2Name ? 'อนุมัติแล้ว' : 'รอการพิจารณา'}
                    </span>
                  </div>
                  {selectedBooking.approver2Name ? (
                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      <div>ผู้อนุมัติ: <b className="text-slate-800 dark:text-slate-200">{selectedBooking.approver2Name}</b></div>
                      <div>วันที่: {selectedBooking.approver2Date}</div>
                      <div>ความเห็น: {selectedBooking.approver2Note || 'อนุมัติ'}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">ยังไม่มีการบันทึกการอนุมัติ</p>
                  )}
                </div>
              </div>

              {/* Action Decision Form (If pending) */}
              {(selectedBooking.status === 'pending_dept' || selectedBooking.status === 'pending_dir') && (
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    การพิจารณาอนุมัติในนาม: {currentUser.name} ({currentUser.roleLabel})
                  </h4>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      ความเห็น / ข้อเสนอแนะ:
                    </label>
                    <textarea
                      rows={2}
                      value={approverNote}
                      onChange={(e) => setApproverNote(e.target.value)}
                      placeholder="เช่น อนุมัติตามระเบียบการใช้ยานพาหนะ, ขอให้เดินทางด้วยความปลอดภัย..."
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      ลงนามผู้อนุมัติ:
                    </label>
                    <SignaturePad
                      height={120}
                      label="วาดลายเซ็นผู้อนุมัติที่นี่"
                      onSave={(dataUrl) => setApproverSignature(dataUrl)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                ปิด
              </button>

              {(selectedBooking.status === 'pending_dept' || selectedBooking.status === 'pending_dir') ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl transition flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>ไม่อนุมัติ</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleApprove}
                    className="btn-3d px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {selectedBooking.status === 'pending_dept'
                        ? 'อนุมัติ (ส่งต่อให้ ผอ.)'
                        : 'อนุมัติคำขอสมบูรณ์'}
                    </span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-400">
                  รายการนี้ดำเนินการเสร็จสิ้นแล้ว
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                ระบุเหตุผลที่ไม่อนุมัติคำขอ
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              คำขอรหัส {selectedBooking.bookingCode} จะถูกปฏิเสธและแจ้งเตือนไปยังผู้ขอผ่าน Line Notify
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น รถติดภารกิจด่วนอื่น, เอกสารไม่ครบถ้วน..."
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReject}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition cursor-pointer"
              >
                ยืนยันการปฏิเสธ
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
        onSave={(updated) => {
          onUpdateBooking(updated);
          if (selectedBooking && selectedBooking.id === updated.id) {
            setSelectedBooking(updated);
          }
        }}
        onDelete={(bookingId) => {
          if (onDeleteBooking) {
            onDeleteBooking(bookingId);
          }
          if (selectedBooking && selectedBooking.id === bookingId) {
            setSelectedBooking(null);
          }
        }}
        vehicles={vehicles}
      />
    </div>
  );
};
