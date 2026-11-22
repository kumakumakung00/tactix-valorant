import { Maximize2, Minimize2, Share2 } from 'lucide-react';
import { AppView } from '../types/tactix';

interface HeaderProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenExport: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'board', label: 'กระดานกลยุทธ์' },
  { id: 'livematch', label: 'แก้เกมเรียลไทม์ (Live Match)' },
  { id: 'training', label: 'การฝึกเล่น' },
  { id: 'progress', label: 'พัฒนาฝีมือ (My Progress)' },
  { id: 'crosshairs', label: 'โค้ดเป้าเล็ง (Crosshairs)' },
];

export function Header({
  activeView,
  onViewChange,
  onOpenExport,
  isFullscreen,
  onToggleFullscreen,
}: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b border-[#263145] bg-[#111620] px-5">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={() => onViewChange('board')}
        className="font-display text-lg font-bold tracking-[0.22em] text-[#F1F5F9] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4655] rounded-sm"
      >
        TACTIX
      </button>

      {/* Zone 2: Concise single-line nav links */}
      <nav aria-label="เมนูหลัก" className="no-scrollbar flex items-center gap-6 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4655] ${
                isActive ? 'text-[#F1F5F9]' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FF4655]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Fullscreen & Export CTA */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'ออกจากโหมดฟลูสกรีน' : 'โหมดฟลูสกรีน'}
          aria-label={isFullscreen ? 'ออกจากโหมดฟลูสกรีน' : 'โหมดฟลูสกรีน'}
          aria-pressed={isFullscreen}
          className={`flex items-center gap-1.5 border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
            isFullscreen
              ? 'border-[#22D3EE] bg-[#22D3EE]/15 text-[#22D3EE]'
              : 'border-[#263145] bg-[#171E2B] text-[#CBD5E1] hover:border-[#475569] hover:text-white'
          }`}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{isFullscreen ? 'ย่อหน้าจอ' : 'ฟลูสกรีน'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="clip-angle-sm flex items-center gap-2 bg-[#FF4655] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E03545] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Share2 className="h-3.5 w-3.5" />
          ส่งออกแผน
        </button>
      </div>
    </header>
  );
}
