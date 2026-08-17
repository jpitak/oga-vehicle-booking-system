import React, { useState } from 'react';
import {
  X,
  Download,
  FileCode,
  FileText,
  Database,
  Archive,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Layers,
  ShieldCheck
} from 'lucide-react';
import {
  generateStandaloneAppHtml,
  downloadBlobFile,
  downloadAllDeploymentZip,
  README_MANUAL_CONTENT
} from '../data/standalonePackage';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/apiService';
import { Booking, Vehicle, MaintenanceItem, User, Department, Driver, MasterLocationPurpose } from '../types';

interface DownloadPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  bookings: Booking[];
  users: User[];
  departments: Department[];
  drivers: Driver[];
  masters: MasterLocationPurpose[];
  maintenance: MaintenanceItem[];
  currentTheme: string;
}

export const DownloadPackageModal: React.FC<DownloadPackageModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  bookings,
  users,
  departments,
  drivers,
  masters,
  maintenance,
  currentTheme
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'code' | 'guide'>('files');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleDownloadAllZip = async () => {
    try {
      setIsZipping(true);
      await downloadAllDeploymentZip(
        vehicles,
        bookings,
        users,
        departments,
        drivers,
        masters,
        maintenance,
        currentTheme
      );
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadHtmlOnly = () => {
    const html = generateStandaloneAppHtml(
      vehicles,
      bookings,
      users,
      departments,
      drivers,
      masters,
      maintenance,
      currentTheme
    );
    downloadBlobFile('oga-fleet-app.html', html, 'text/html;charset=utf-8');
  };

  const handleDownloadGsOnly = () => {
    downloadBlobFile('Code.gs', GOOGLE_APPS_SCRIPT_CODE, 'text/plain;charset=utf-8');
  };

  const handleDownloadReadmeOnly = () => {
    downloadBlobFile('README_INSTALLATION.md', README_MANUAL_CONTENT, 'text/markdown;charset=utf-8');
  };

  const handleDownloadJsonOnly = () => {
    const db = {
      exportDate: new Date().toISOString(),
      vehicles,
      bookings,
      users,
      departments,
      drivers,
      masterItems: masters,
      maintenance
    };
    downloadBlobFile('oga_database_seed.json', JSON.stringify(db, null, 2), 'application/json;charset=utf-8');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div
      id="modal-download-package"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 text-lg">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  ศูนย์ดาวน์โหลดระบบ Standalone & ชุดติดตั้ง OGA Fleet
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  v2.5 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ดาวน์โหลดไฟล์ระบบเพื่อนำไปเปิดใช้งานบนเครื่องได้ทันที 100% หรือติดตั้งเข้ากับ Google Sheets
              </p>
            </div>
          </div>

          <button
            id="btn-close-download-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/80">
          <button
            id="tab-download-files"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'files'
                ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลดไฟล์ติดตั้ง (4 ไฟล์)
          </button>
          <button
            id="tab-download-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            คู่มือการติดตั้ง (Manual)
          </button>
          <button
            id="tab-download-code"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'code'
                ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            ดูโค้ด Apps Script (Code.gs)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* Main Featured ZIP Download Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-slate-900 border border-amber-500/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    แนะนำสำหรับนำไปติดตั้งใช้งาน
                  </div>
                  <h3 className="text-xl font-black text-white">
                    ดาวน์โหลดชุดติดตั้งทั้งหมด (All-in-One .ZIP)
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    รวมทั้ง 4 ไฟล์สำคัญ: <strong>oga-fleet-app.html</strong> (เปิดใช้งานได้ทันที),{' '}
                    <strong>Code.gs</strong> (โค้ดเชื่อมต่อ Google Sheets),{' '}
                    <strong>README_INSTALLATION.md</strong> (คู่มือภาษาไทย), และ{' '}
                    <strong>oga_database_seed.json</strong> (ฐานข้อมูลเริ่มต้น)
                  </p>
                </div>

                <button
                  id="btn-download-all-zip"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="shrink-0 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-5 h-5" />
                  {isZipping ? 'กำลังสร้างไฟล์ ZIP...' : 'ดาวน์โหลดทุกไฟล์รวม (.ZIP)'}
                </button>
              </div>

              {/* Individual File Download Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  หรือเลือกดาวน์โหลดแยกทีละไฟล์
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File 1: HTML */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <FileCode className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">oga-fleet-app.html</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            หลัก
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          ไฟล์เว็บแอปพลิเคชัน Standalone แบบสมบูรณ์ ดับเบิ้ลคลิกเปิดผ่าน Chrome/Edge ได้ทันที
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-500 font-mono">Single-File Web App</span>
                      <button
                        id="btn-download-html"
                        onClick={handleDownloadHtmlOnly}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        ดาวน์โหลด .html
                      </button>
                    </div>
                  </div>

                  {/* File 2: Code.gs */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">Code.gs</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            Google Apps Script
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          สคริปต์ Web App สำหรับวางใน Google Sheets ทำหน้าที่เป็น Database กลางองค์กร
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-500 font-mono">GAS Backend Code</span>
                      <button
                        id="btn-download-gs"
                        onClick={handleDownloadGsOnly}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        ดาวน์โหลด .gs
                      </button>
                    </div>
                  </div>

                  {/* File 3: README.md */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">README_INSTALLATION.md</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                            คู่มือภาษาไทย
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          คู่มือการติดตั้ง ทีละขั้นตอน วิธีผูก Google Sheets และการตั้งค่า LINE Notify
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-500 font-mono">Documentation</span>
                      <button
                        id="btn-download-readme"
                        onClick={handleDownloadReadmeOnly}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        ดาวน์โหลด .md
                      </button>
                    </div>
                  </div>

                  {/* File 4: JSON Backup */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">oga_database_seed.json</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                            Backup
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          ไฟล์สำรองฐานข้อมูล ประกอบด้วยข้อมูลรถ, ทะเบียน, พนักงาน, แผนก, รายการจอง
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-500 font-mono">Database JSON</span>
                      <button
                        id="btn-download-json"
                        onClick={handleDownloadJsonOnly}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        ดาวน์โหลด .json
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  คู่มือการติดตั้งระบบและเชื่อมต่อ Google Spreadsheet สำหรับองค์กร
                </span>
                <button
                  onClick={handleDownloadReadmeOnly}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> ดาวน์โหลดไฟล์คู่มือ
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap max-h-[450px] overflow-y-auto">
                {README_MANUAL_CONTENT}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  คัดลอกโค้ดนี้ไปวางใน Google Spreadsheet: <strong>ส่วนขยาย &gt; Apps Script</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">คัดลอกสำเร็จ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกโค้ด</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadGsOnly}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> ดาวน์โหลด Code.gs
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400/90 max-h-[450px] overflow-y-auto leading-relaxed">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>OGA Fleet v2.5 • พร้อมใช้งาน 100% ทั้งแบบ Offline & Online Google Sheets</span>
          </div>

          <button
            id="btn-footer-close"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
