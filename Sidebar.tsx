import React from 'react';
import {
  LayoutGrid,
  Calendar,
  CalendarDays,
  CheckSquare,
  MapPin,
  RotateCcw,
  Car,
  Wrench,
  BarChart3,
  Users,
  HardDrive,
  Sparkles,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'calendar'
  | 'booking'
  | 'approvals'
  | 'gps'
  | 'return'
  | 'fleet'
  | 'maintenance'
  | 'masters'
  | 'drive'
  | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenDbSettings: () => void;
  pendingApprovalsCount: number;
  criticalMaintenanceCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenDbSettings,
  pendingApprovalsCount,
  criticalMaintenanceCount,
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutGrid },
    { id: 'calendar', label: 'ปฏิทินการจอง', icon: CalendarDays },
    { id: 'booking', label: 'จองรถ', icon: Calendar },
    {
      id: 'approvals',
      label: 'อนุมัติการจอง',
      icon: CheckSquare,
      badge: pendingApprovalsCount,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    { id: 'masters', label: 'Master ผู้จอง & ข้อมูล', icon: Users },
    { id: 'drive', label: 'Google Drive Cloud', icon: HardDrive },
    { id: 'gps', label: 'ติดตาม GPS', icon: MapPin },
    { id: 'return', label: 'คืนรถ', icon: RotateCcw },
    { id: 'fleet', label: 'จัดการรถ', icon: Car },
    {
      id: 'maintenance',
      label: 'ซ่อมบำรุง',
      icon: Wrench,
      badge: criticalMaintenanceCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'reports', label: 'รายงาน & สถิติ', icon: BarChart3 },
  ];

  return (
    <aside className="w-16 md:w-60 shrink-0 bg-slate-950 border-r border-slate-800/80 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-3 select-none">
      <div className="space-y-1.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-center md:justify-between px-3 py-3 rounded-xl transition-all font-medium text-xs md:text-sm group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              }`}
              title={item.label}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                <span className="hidden md:inline">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`hidden md:inline-flex px-2 py-0.5 text-[11px] font-extrabold rounded-full ${
                    isActive ? 'bg-slate-950 text-amber-400' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Database & Google Sheet Settings Trigger */}
      <div className="space-y-2">
        <button
          onClick={onOpenDbSettings}
          className="w-full flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition group"
          title="ตั้งค่าเชื่อมต่อ Google Sheet & Apps Script (CRUD)"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="hidden md:inline truncate">Google Sheet & Apps Script</span>
        </button>

        {/* Footer Info */}
        <div className="hidden md:block p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-400 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span>OGA Fleet v2.0</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-[10px] text-slate-500">OGA International Co., Ltd.</p>
        </div>
      </div>
    </aside>
  );
};
