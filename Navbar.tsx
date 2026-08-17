import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import { Bell, Palette, RefreshCw, LogOut, CheckCheck, Shield, Sparkles, Database, Settings } from 'lucide-react';
import { OgaLogo } from './OgaLogo';

interface NavbarProps {
  currentUser: User;
  onOpenThemeModal: () => void;
  onOpenUserModal: () => void;
  onOpenLineModal: () => void;
  onOpenDbSettingsModal: () => void;
  onOpenDownloadPackageModal: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenThemeModal,
  onOpenUserModal,
  onOpenLineModal,
  onOpenDbSettingsModal,
  onOpenDownloadPackageModal,
  notifications,
  onMarkNotificationsRead,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 md:px-6 shadow-md">
      {/* Brand with 3D OgaLogo */}
      <div className="flex items-center gap-3">
        <OgaLogo size="md" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Download Standalone HTML Package Button */}
        <button
          id="btn-navbar-download-standalone"
          onClick={onOpenDownloadPackageModal}
          title="ศูนย์ดาวน์โหลดระบบ Standalone & ชุดติดตั้ง OGA Fleet (.html, .gs, .md, .json)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
        >
          <i className="fa-solid fa-download text-xs" />
          <span className="hidden sm:inline">โหลด Standalone HTML</span>
        </button>

        {/* Database & Google Apps Script Settings Button */}
        <button
          onClick={onOpenDbSettingsModal}
          title="การเชื่อมต่อ Database & Google Apps Script (เพิ่ม/ลบ/แก้ไข)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-semibold text-emerald-300 shadow-sm transition"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Google Sheet & Script</span>
        </button>

        {/* 3D Theme Switcher Button */}
        <button
          id="theme"
          onClick={onOpenThemeModal}
          title="เลือกธีม 3D & Glass (13 ธีม)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 shadow-sm transition"
        >
          <Palette className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">◐ ธีม 3D / Glass</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              if (unreadCount > 0) onMarkNotificationsRead();
            }}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notif Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 text-slate-900 dark:text-slate-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" /> การแจ้งเตือน
                </h4>
                <button
                  onClick={onMarkNotificationsRead}
                  className="text-xs text-slate-500 hover:text-amber-500 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> อ่านทั้งหมด
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    ไม่มีการแจ้งเตือนใหม่
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 px-2 rounded-xl transition ${
                        n.read ? 'opacity-80' : 'bg-amber-50/50 dark:bg-amber-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card & Switcher */}
        <div
          onClick={onOpenUserModal}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 cursor-pointer transition select-none"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
            {currentUser.avatar}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-200 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              {currentUser.roleLabel}
            </div>
          </div>
          <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-400 ml-1 transition" />
        </div>
      </div>
    </header>
  );
};
