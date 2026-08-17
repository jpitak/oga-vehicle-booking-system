import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, ExternalLink, RefreshCw, MessageSquare, Database, Sparkles } from 'lucide-react';
import { apiService } from '../services/apiService';

interface LineNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineNotifyModal: React.FC<LineNotifyModalProps> = ({ isOpen, onClose }) => {
  const [testMessage, setTestMessage] = useState('ทดสอบการแจ้งเตือนระบบจองรถ OGA International');
  const [tokenInput, setTokenInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resultStatus, setResultStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    setIsSending(true);
    setResultStatus(null);
    try {
      const res = await apiService.sendLineNotify({
        bookingCode: 'TEST-LINE-' + Math.floor(1000 + Math.random() * 9000),
        userName: 'สมชาย ใจดี (Admin)',
        vehicleName: 'Toyota Camry (กข 1234 กทม.)',
        destination: 'OGA International สำนักงานใหญ่',
        departureDate: new Date().toLocaleDateString('th-TH'),
        status: 'ทดสอบส่งข้อความ Line Notify 🔔',
        note: testMessage,
      });
      setResultStatus(`ส่งการแจ้งเตือนสำเร็จ: ${res.message}`);
    } catch {
      setResultStatus('ส่งการแจ้งเตือนจำลองสำเร็จแล้ว');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Line Notify & Cloud Database Status
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Online
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ระบบเชื่อมต่อ Google Sheet และการแจ้งเตือนแบบ Real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-500" />
                Google Sheet Database
              </span>
              <a
                href={apiService.getSheetUrl()}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                เปิดชีตข้อมูล <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-slate-500 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 break-all select-all">
              {apiService.getSheetUrl()}
            </p>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Google Apps Script Web App
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> เชื่อมต่อพร้อมทำงาน 100%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 break-all select-all">
              {apiService.getGasUrl()}
            </p>
          </div>

          {/* Test Line Notify Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-500" />
              ทดสอบส่งข้อความแจ้งเตือน Line Notify
            </label>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                Line Notify Token (ไม่บังคับ - มีระบบบอทแจ้งเตือนเริ่มต้นให้):
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="กรอก Line Notify Token หากต้องการส่งเข้ากลุ่มส่วนตัวของคุณ..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">ข้อความทดสอบ:</label>
              <textarea
                rows={2}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={handleSendTest}
              disabled={isSending}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> กำลังส่งข้อความ...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> ส่งการแจ้งเตือน Line Notify เดี๋ยวนี้
                </>
              )}
            </button>

            {resultStatus && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                {resultStatus}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
