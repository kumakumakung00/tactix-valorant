import { useMemo, useState } from 'react';
import { Check, Copy, Crosshair, Moon, Sun } from 'lucide-react';
import {
  CROSSHAIR_CATEGORIES,
  CROSSHAIR_PRESETS,
  CrosshairCategory,
  CrosshairPreset,
} from '../data/crosshairCodes';
import { CrosshairPreview } from './CrosshairPreview';

type SceneMode = 'light' | 'dark';

const CATEGORY_BADGE: Record<CrosshairCategory, { label: string; className: string }> = {
  pro: { label: 'PRO', className: 'border-[#FF4655]/40 bg-[#FF4655]/10 text-[#FF8A94]' },
  colorful: { label: 'COLORFUL', className: 'border-[#A855F7]/40 bg-[#A855F7]/10 text-[#D8B4FE]' },
  fun: { label: 'FUN', className: 'border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FDE68A]' },
};

const SCENE_IMAGE: Record<SceneMode, string> = {
  light: '/crosshair/scene-light.png',
  dark: '/crosshair/scene-dark.png',
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  }
}

export function CrosshairsView() {
  const [category, setCategory] = useState<'all' | CrosshairCategory>('all');
  const [scene, setScene] = useState<SceneMode>('dark');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const presets = useMemo(
    () =>
      category === 'all'
        ? CROSSHAIR_PRESETS
        : CROSSHAIR_PRESETS.filter((preset) => preset.category === category),
    [category]
  );

  const handleCopy = async (preset: CrosshairPreset) => {
    const ok = await copyText(preset.code);
    if (!ok) return;
    setCopiedId(preset.id);
    window.setTimeout(() => {
      setCopiedId((current) => (current === preset.id ? null : current));
    }, 1800);
  };

  return (
    <div className="scrollbar-thin flex h-full w-full flex-col overflow-y-auto bg-[#0B0E14] text-[#F1F5F9]">
      <div className="border-b border-[#263145] bg-[#111620] px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#FF4655]">
              <Crosshair className="h-3.5 w-3.5" />
              <span>CROSSHAIR CODE LIBRARY</span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-[#F1F5F9]">
              โค้ดเป้าเล็งพร้อมใช้งาน
            </h1>
            <p className="mt-1 text-sm text-[#94A3B8]">
              คัดโค้ดเป้าเล็งจากโปรเพลเยอร์และคอมมูนิตี้ กดคัดลอกแล้วนำไปวางใน Settings → Crosshair → Import
              Profile Code ได้ทันที
            </p>
          </div>
          <div className="border border-[#263145] bg-[#171E2B] px-3.5 py-2 text-xs text-[#CBD5E1]">
            <span className="text-[#94A3B8]">แสดงผล: </span>
            <span className="font-mono-tabular font-semibold text-[#F1F5F9]">{presets.length}</span>
            <span className="text-[#94A3B8]"> / {CROSSHAIR_PRESETS.length} โค้ด</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="กรองหมวดหมู่เป้าเล็ง" className="flex flex-wrap gap-2">
            {CROSSHAIR_CATEGORIES.map((item) => {
              const isActive = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={isActive}
                  className={`border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4655] ${
                    isActive
                      ? 'border-[#FF4655] bg-[#FF4655]/15 text-[#F1F5F9]'
                      : 'border-[#263145] bg-[#171E2B] text-[#94A3B8] hover:border-[#475569] hover:text-[#F1F5F9]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="สลับฉากพื้นหลังจำลอง"
            className="flex border border-[#263145] bg-[#171E2B] p-0.5"
          >
            {(
              [
                { id: 'light', label: 'ฉากสว่าง', Icon: Sun },
                { id: 'dark', label: 'ฉากมืด', Icon: Moon },
              ] as const
            ).map(({ id, label, Icon }) => {
              const isActive = scene === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScene(id)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4655] ${
                    isActive ? 'bg-[#FF4655] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => {
            const badge = CATEGORY_BADGE[preset.category];
            const isCopied = copiedId === preset.id;
            return (
              <li
                key={preset.id}
                className="flex flex-col border border-[#263145] bg-[#111620] transition-colors hover:border-[#FF4655]/50"
              >
                <div
                  className="relative aspect-[16/9] overflow-hidden bg-cover bg-center"
                  style={{ backgroundImage: `url(${SCENE_IMAGE[scene]})` }}
                  role="img"
                  aria-label={`ตัวอย่างเป้าเล็ง ${preset.name} บน${scene === 'light' ? 'ฉากสว่าง' : 'ฉากมืด'}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-32 w-32">
                      <CrosshairPreview code={preset.code} />
                    </div>
                  </div>
                  <span
                    className={`absolute left-2 top-2 border px-1.5 py-0.5 text-[10px] font-semibold tracking-widest ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-display text-base font-bold tracking-wide text-[#F1F5F9]">
                        {preset.name}
                      </h2>
                      <span className="truncate text-xs text-[#94A3B8]">{preset.subtitle}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">{preset.description}</p>
                  </div>

                  <code className="block break-all border border-[#263145] bg-[#0B0E14] px-2.5 py-2 font-mono text-[11px] leading-relaxed text-[#CBD5E1]">
                    {preset.code}
                  </code>

                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-[#64748B]">ที่มา: {preset.source}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(preset)}
                      aria-label={`คัดลอกโค้ดเป้าเล็ง ${preset.name}`}
                      className={`clip-angle-sm flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        isCopied
                          ? 'bg-[#22C55E] text-white'
                          : 'bg-[#FF4655] text-white hover:bg-[#E03545]'
                      }`}
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {isCopied ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-center text-[11px] text-[#64748B]">
          ภาพตัวอย่างจำลองจากค่าเป้าหลัก (Primary) ของโค้ด สีและขนาดในเกมอาจต่างเล็กน้อยตามความละเอียดหน้าจอ
          โค้ดของโปรอาจเปลี่ยนไปตามช่วงเวลา
        </p>
      </div>
    </div>
  );
}
