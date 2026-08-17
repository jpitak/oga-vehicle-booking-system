import React from 'react';
import { THEMES_LIST } from '../data/mockData';
import { ThemeOption } from '../types';
import { X, Palette, Sparkles, Check } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                ◐ เลือกธีมระบบ (3D Themes Engine)
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                  13 Themes
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เลือกรูปแบบดีไซน์ 3D และโทนสีที่ต้องการสำหรับ OGA International (จดจำธีมอัตโนมัติ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="theme-grid">
            {THEMES_LIST.map((t: ThemeOption) => {
              const isActive = currentTheme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTheme(t.id)}
                  className={`theme-card relative group transition-all duration-200 ${
                    isActive ? 'active ring-2 ring-rose-500 shadow-lg' : 'hover:border-slate-400'
                  }`}
                  style={{
                    backgroundColor: t.colors[1] === '#ffffff' ? '#ffffff' : t.colors[1],
                  }}
                >
                  {/* Top Preview Bar */}
                  <div
                    className="theme-preview relative overflow-hidden"
                    style={{ background: t.colors[1] }}
                  >
                    <span
                      className="theme-dot transform group-hover:scale-110 transition-transform"
                      style={{ background: t.colors[0] }}
                    />
                    <span
                      className="theme-dot transform group-hover:scale-125 transition-transform"
                      style={{ background: t.colors[2] }}
                    />
                    {isActive && (
                      <span className="absolute right-2 top-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Name & Desc */}
                  <div className="mt-2 text-center">
                    <b className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1">
                      {t.name}
                      {t.name.includes('⭐') && <Sparkles className="w-3 h-3 text-amber-500" />}
                    </b>
                    <small className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {t.desc}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <span className="text-xs text-slate-500">
            ธีมปัจจุบัน: <span className="font-semibold text-slate-800 dark:text-slate-200">{THEMES_LIST.find(t => t.id === currentTheme)?.name || currentTheme}</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
