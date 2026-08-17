import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  File,
  Upload,
  FolderPlus,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileArchive,
  ChevronRight,
  Database,
  ArrowUpRight,
  ShieldCheck,
  LogOut,
  Car,
  Wrench,
  CalendarCheck,
  X,
  FileCode,
} from 'lucide-react';
import {
  initDriveAuth,
  signInWithGoogleDrive,
  logoutGoogleDrive,
  getDriveAccessToken,
  setDriveAccessToken,
  getDriveUser,
} from '../services/googleDriveAuth';
import {
  DriveFileItem,
  DriveAboutInfo,
  getDriveAbout,
  listDriveFiles,
  createDriveFolder,
  uploadFileToDrive,
  uploadJsonToDrive,
  uploadTextToDrive,
  deleteDriveFile,
  getOrCreateOgaFleetFolderHierarchy,
} from '../services/googleDriveApi';
import { Booking, Vehicle, RepairOrder, User as AppUser } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface GoogleDriveViewProps {
  currentUser: AppUser;
  bookings: Booking[];
  vehicles: Vehicle[];
  repairOrders: RepairOrder[];
  onNotify?: (title: string, message: string, type: 'booking' | 'approval' | 'return' | 'maintenance') => void;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export const GoogleDriveView: React.FC<GoogleDriveViewProps> = ({
  currentUser,
  bookings,
  vehicles,
  repairOrders,
  onNotify,
}) => {
  const [token, setToken] = useState<string | null>(getDriveAccessToken());
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(getDriveUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [aboutInfo, setAboutInfo] = useState<DriveAboutInfo | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'My Drive' },
  ]);

  // Modals & Actions
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Sync / Backup states
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Mandatory Delete Confirmation Modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup Auth Listener
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user, cachedToken) => {
        setGoogleUser(user);
        setToken(cachedToken);
        setAuthError(null);
      },
      () => {
        // If not logged in or token empty
        setToken(null);
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch about info and files whenever token or currentFolder changes
  useEffect(() => {
    if (token) {
      loadAboutAndFiles();
    }
  }, [token, currentFolder]);

  const loadAboutAndFiles = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Load user quota
      getDriveAbout(token)
        .then((about) => setAboutInfo(about))
        .catch((err) => console.warn('Could not fetch drive about info:', err));

      // Load files in current folder
      const result = await listDriveFiles(token, {
        folderId: currentFolder,
        search: searchQuery.trim() || undefined,
      });
      setFiles(result.files || []);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      if (err?.message?.includes('401') || err?.message?.includes('Invalid Credentials')) {
        setToken(null);
        setDriveAccessToken(null);
        setAuthError('เซสชัน Google Drive หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAboutAndFiles();
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogleDrive();
      if (result) {
        setGoogleUser(result.user);
        setToken(result.accessToken);
        if (onNotify) {
          onNotify(
            'Google Drive เชื่อมต่อสำเร็จ',
            `เข้าสู่ระบบด้วย ${result.user.email} พร้อมใช้งาน Google Drive แล้ว`,
            'booking'
          );
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err?.message || 'ไม่สามารถเข้าสู่ระบบ Google Drive ได้');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogleDrive();
    setToken(null);
    setGoogleUser(null);
    setAboutInfo(null);
    setFiles([]);
  };

  const handleNavigateFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolder(folderId);
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'My Drive' }]);
    } else {
      // Find if folder exists in breadcrumbs
      const existingIdx = breadcrumbs.findIndex((b) => b.id === folderId);
      if (existingIdx !== -1) {
        setBreadcrumbs(breadcrumbs.slice(0, existingIdx + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;

    try {
      await createDriveFolder(token, newFolderName.trim(), currentFolder || undefined);
      setShowNewFolderModal(false);
      setNewFolderName('');
      await loadAboutAndFiles();
      setSyncSuccessMsg(`สร้างโฟลเดอร์ "${newFolderName}" สำเร็จ`);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`ไม่สามารถสร้างโฟลเดอร์ได้: ${err.message}`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !uploadFile) return;

    setIsUploading(true);
    setUploadProgress('กำลังอัปโหลดไฟล์ขึ้น Google Drive...');
    try {
      await uploadFileToDrive(
        token,
        uploadFile,
        uploadFile.name,
        uploadFile.type || 'application/octet-stream',
        currentFolder || undefined,
        uploadDescription
      );
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDescription('');
      await loadAboutAndFiles();
      setSyncSuccessMsg(`อัปโหลดไฟล์ "${uploadFile.name}" สำเร็จเรียบร้อย`);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`อัปโหลดไฟล์ไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Setup Standard OGA Fleet Folders in Drive
  const handleAutoOrganizeFolders = async () => {
    if (!token) return;
    setIsBackingUp(true);
    try {
      const hierarchy = await getOrCreateOgaFleetFolderHierarchy(token);
      setSyncSuccessMsg('สร้างโครงสร้างโฟลเดอร์ OGA Fleet ใน Google Drive เรียบร้อยแล้ว');
      handleNavigateFolder(hierarchy.rootFolder.id, hierarchy.rootFolder.name);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // One-click Backup Bookings & Fleet Data to Google Drive
  const handleBackupToDrive = async () => {
    if (!token) return;
    setIsBackingUp(true);
    try {
      const hierarchy = await getOrCreateOgaFleetFolderHierarchy(token);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const thaiDateStr = new Date().toLocaleDateString('th-TH');

      // 1. JSON Full Fleet Backup
      const fullBackupPayload = {
        system: 'OGA Fleet Vehicle Management System',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.name,
        totalBookings: bookings.length,
        totalVehicles: vehicles.length,
        totalWorkOrders: repairOrders.length,
        vehicles,
        bookings,
        repairOrders,
      };

      await uploadJsonToDrive(
        token,
        fullBackupPayload,
        `OGA_Fleet_Full_Backup_${timestamp}.json`,
        hierarchy.backupsFolder.id,
        `สำรองข้อมูลระบบ OGA Fleet ทั้งหมด ณ วันที่ ${thaiDateStr}`
      );

      // 2. CSV Summary of Bookings
      const csvHeader = 'รหัสการจอง,ทะเบียนรถ,ชื่อรถ,ผู้ขอใช้รถ,แผนก,คนขับ,วันเดินทาง,เวลา,วันคืน,เวลา,จุดหมาย,วัตถุประสงค์,สถานะ\n';
      const csvRows = bookings
        .map(
          (b) =>
            `"${b.bookingCode}","${b.vehiclePlate}","${b.vehicleName}","${b.userName}","${b.userDepartment}","${b.driverName || '-'}","${b.departureDate}","${b.departureTime}","${b.returnDate}","${b.returnTime}","${b.destination}","${b.purpose}","${b.statusLabel}"`
        )
        .join('\n');

      await uploadTextToDrive(
        token,
        csvHeader + csvRows,
        `รายการจองรถ_OGA_Fleet_${timestamp}.csv`,
        'text/csv;charset=utf-8;',
        hierarchy.backupsFolder.id
      );

      setSyncSuccessMsg('สำรองข้อมูลการจองและรายงานขึ้น Google Drive สำเร็จแล้ว (บันทึกในโฟลเดอร์ OGA Fleet Management)');
      handleNavigateFolder(hierarchy.backupsFolder.id, hierarchy.backupsFolder.name);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`สำรองข้อมูลไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Delete Action with Mandatory Confirmation
  const handleDeleteConfirm = async () => {
    if (!token || !deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(token, deleteConfirmItem.id);
      setDeleteConfirmItem(null);
      await loadAboutAndFiles();
      setSyncSuccessMsg(`ลบรายการ "${deleteConfirmItem.name}" จาก Google Drive เรียบร้อย`);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`ลบไฟล์ไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '-';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-purple-600" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) {
      return <FileArchive className="w-5 h-5 text-amber-600" />;
    }
    if (mimeType.includes('json') || mimeType.includes('javascript')) {
      return <FileCode className="w-5 h-5 text-indigo-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Google Drive Cloud Storage
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  Workspace Integrated
                </span>
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                เชื่อมต่อและจัดเก็บไฟล์เอกสารรถยนต์, ใบสั่งซ่อมบำรุง, ใบเสร็จ และสำรองข้อมูลระบบ OGA Fleet บน Google Drive
              </p>
            </div>
          </div>
        </div>

        {/* Quick Auth Info / Sign In */}
        {token && googleUser ? (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs overflow-hidden border border-indigo-200">
              {googleUser.photoURL ? (
                <img src={googleUser.photoURL} alt={googleUser.displayName || 'Google'} className="w-full h-full object-cover" />
              ) : (
                googleUser.displayName?.charAt(0) || 'G'
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                {googleUser.displayName || 'Google User'}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                {googleUser.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="ออกจากระบบ Google Drive"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            {/* Standard GSI Button */}
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="gsi-material-button flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <span>{isLoggingIn ? 'กำลังเข้าสู่ระบบ Google...' : 'เข้าสู่ระบบด้วย Google Drive'}</span>
            </button>
          </div>
        )}
      </div>

      {authError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
          <button onClick={handleSignIn} className="font-bold underline text-rose-900">
            ลองใหม่
          </button>
        </div>
      )}

      {syncSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {!token ? (
        /* Not Logged In Promo Card */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <HardDrive className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">เชื่อมต่อ Google Drive กับระบบ OGA Fleet</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              เมื่อเข้าสู่ระบบด้วย Google Workspace / Google Account คุณจะสามารถจัดการไฟล์เอกสารประจำรถ (พ.ร.บ., กรมธรรม์, ตรวจสภาพ), แนบรูปภาพใบเสร็จงานซ่อมบำรุง และสำรองข้อมูลประวัติการจองทั้งหมดได้อย่างปลอดภัยบน Google Drive
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <Car className="w-4 h-4 text-indigo-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">เอกสารรถยนต์</div>
              <div className="text-[10px] text-slate-500">เก็บสำเนาทะเบียน & ประกันภัย</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <Wrench className="w-4 h-4 text-amber-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">ใบสั่งซ่อม & ใบเสร็จ</div>
              <div className="text-[10px] text-slate-500">แนบรูปอะไหล่ & ค่าใช้จ่าย</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <CalendarCheck className="w-4 h-4 text-emerald-600 mb-1.5" />
              <div className="font-bold text-xs text-slate-900">สำรองข้อมูลอัตโนมัติ</div>
              <div className="text-[10px] text-slate-500">Export รายการจองเป็น CSV/JSON</div>
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google เพื่อเปิดใช้งาน'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Connected Google Drive Explorer Interface */
        <div className="space-y-4">
          {/* Quick Action Toolbars */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Left Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                อัปโหลดไฟล์
              </button>

              <button
                onClick={() => setShowNewFolderModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer border border-slate-200"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                สร้างโฟลเดอร์
              </button>

              <button
                onClick={handleAutoOrganizeFolders}
                disabled={isBackingUp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold text-xs transition cursor-pointer"
                title="สร้างโครงสร้างโฟลเดอร์มาตรฐาน OGA Fleet บน Google Drive"
              >
                <Folder className="w-3.5 h-3.5 text-indigo-600" />
                สร้างโฟลเดอร์ OGA Fleet
              </button>

              <button
                onClick={handleBackupToDrive}
                disabled={isBackingUp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs transition cursor-pointer"
                title="สำรองข้อมูลการจองรถทั้งหมด และรายการรถยนต์ลงใน Google Drive เป็น JSON & CSV"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                {isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สำรองข้อมูล Fleet ลง Drive'}
              </button>
            </div>

            {/* Right: Search & Refresh */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาไฟล์ใน Drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44 sm:w-56"
                />
              </form>

              <button
                onClick={loadAboutAndFiles}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="รีเฟรช"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Breadcrumbs Navigation */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-2.5 flex items-center gap-1 text-xs text-slate-600 overflow-x-auto shadow-xs">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={b.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <button
                  onClick={() => handleNavigateFolder(b.id, b.name)}
                  className={`font-bold transition hover:text-amber-600 flex items-center gap-1 shrink-0 ${
                    idx === breadcrumbs.length - 1 ? 'text-slate-900 font-black' : 'text-slate-500'
                  }`}
                >
                  {idx === 0 ? <HardDrive className="w-3.5 h-3.5 text-amber-500" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{b.name}</span>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Files / Folders List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">กำลังโหลดข้อมูลจาก Google Drive...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Folder className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">โฟลเดอร์นี้ว่างเปล่า</p>
                <p className="text-xs text-slate-400">คลิก "อัปโหลดไฟล์" หรือ "สำรองข้อมูล Fleet" เพื่อเริ่มต้นบันทึกไฟล์</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <div className="col-span-6 sm:col-span-6">ชื่อไฟล์ / โฟลเดอร์</div>
                  <div className="col-span-3 sm:col-span-2 text-right sm:text-left">ขนาด</div>
                  <div className="hidden sm:block sm:col-span-2">แก้ไขล่าสุด</div>
                  <div className="col-span-3 sm:col-span-2 text-right">การจัดการ</div>
                </div>

                {files.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const modifiedDate = file.modifiedTime
                    ? new Date(file.modifiedTime).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-';

                  return (
                    <div
                      key={file.id}
                      className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50/80 transition text-xs"
                    >
                      {/* Name & Icon */}
                      <div className="col-span-6 sm:col-span-6 flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0">{getFileIcon(file.mimeType)}</div>
                        {isFolder ? (
                          <button
                            onClick={() => handleNavigateFolder(file.id, file.name)}
                            className="font-bold text-slate-900 hover:text-amber-600 text-left truncate cursor-pointer"
                          >
                            {file.name}
                          </button>
                        ) : (
                          <span className="font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </span>
                        )}
                      </div>

                      {/* Size */}
                      <div className="col-span-3 sm:col-span-2 text-right sm:text-left text-slate-600 text-[11px]">
                        {isFolder ? 'โฟลเดอร์' : formatFileSize(file.size)}
                      </div>

                      {/* Modified Date */}
                      <div className="hidden sm:block sm:col-span-2 text-slate-500 text-[11px]">
                        {modifiedDate}
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="เปิดดูใน Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {file.webContentLink && !isFolder && (
                          <a
                            href={file.webContentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="ดาวน์โหลดไฟล์"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => setDeleteConfirmItem(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="ลบไฟล์"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NEW FOLDER MODAL                                         */}
      {/* ========================================================= */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-500" />
                สร้างโฟลเดอร์ใหม่ใน Drive
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ชื่อโฟลเดอร์:
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เอกสาร พ.ร.บ. รถตู้ ขค-5678"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
                >
                  สร้างโฟลเดอร์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* UPLOAD FILE MODAL                                        */}
      {/* ========================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                อัปโหลดไฟล์ขึ้น Google Drive
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  เลือกไฟล์จากเครื่อง:
                </label>
                <input
                  type="file"
                  required
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 border border-slate-200 rounded-xl p-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  คำอธิบายไฟล์ (ถ้ามี):
                </label>
                <input
                  type="text"
                  placeholder="เช่น กรมธรรม์ประกันภัยชั้น 1 รถ กข-1234 ปี 2569"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {uploadProgress && (
                <div className="text-xs text-amber-600 font-bold animate-pulse">
                  {uploadProgress}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  {isUploading ? 'กำลังอัปโหลด...' : 'เริ่มอัปโหลด'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MANDATORY USER CONFIRMATION DIALOG FOR DELETE OPERATIONS  */}
      {/* ========================================================= */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">
                  ยืนยันการลบไฟล์จาก Google Drive
                </h3>
                <p className="text-xs text-slate-500">
                  การกระทำนี้จะลบไฟล์ออกจาก Google Drive ของคุณอย่างถาวร
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <div className="font-bold text-slate-900 truncate">
                📄 {deleteConfirmItem.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ประเภท: {deleteConfirmItem.mimeType}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition disabled:opacity-50"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
