import { useEffect, useState } from 'react';
import { Check, Copy, Download, FileJson, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Agent, Side, StrategyPlay, ValorantMap } from '../types/tactix';
import { formatStrategyBrief, renderTacticalBoardPng } from '../utils/exportStrategy';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  map: ValorantMap;
  side: Side;
  play: StrategyPlay;
  ourTeam: (string | null)[];
  enemyTeam: (string | null)[];
  agents: Agent[];
  showCallouts: boolean;
  onExportJson: () => string;
  onImportJson: (raw: string) => boolean;
}

export function ExportModal({
  open,
  onClose,
  map,
  side,
  play,
  ourTeam,
  enemyTeam,
  agents,
  showCallouts,
  onExportJson,
  onImportJson,
}: ExportModalProps) {
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRendering(true);
    setPngUrl(null);
    renderTacticalBoardPng(map, side, play, agents, showCallouts)
      .then((url) => {
        if (!cancelled) setPngUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPngUrl(null);
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, map, side, play, agents, showCallouts]);

  if (!open) return null;

  const briefText = formatStrategyBrief(map, side, play, ourTeam, enemyTeam, agents);

  const handleCopyBrief = async () => {
    try {
      await navigator.clipboard.writeText(briefText);
      setCopiedText(true);
      window.setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `tactix-${map.id}-${side}-${play.name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const handleDownloadJson = () => {
    const data = onExportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tactix-playbook-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);
    try {
      const text = await file.text();
      const ok = onImportJson(text);
      if (ok) {
        setImportSuccess(true);
      } else {
        setImportError('ไฟล์ JSON ไม่ถูกต้อง หรือรูปแบบไม่ตรงกับ TACTIX');
      }
    } catch {
      setImportError('ไม่สามารถอ่านไฟล์ที่เลือกได้');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col border border-[#2E3B52] bg-[#111620] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#263145] px-5 py-3.5">
          <div>
            <h2 id="export-modal-title" className="font-display text-base font-bold uppercase tracking-wider text-[#F1F5F9]">
              ส่งออกและแชร์กลยุทธ์
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {map.name} · {side === 'attack' ? 'ฝั่งบุก (Attack)' : 'ฝั่งรับ (Defense)'} · {play.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1 text-[#94A3B8] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-thin grid gap-5 overflow-y-auto p-5 md:grid-cols-2">
          {/* PNG Preview & Download */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase text-[#CBD5E1]">
                <ImageIcon className="h-4 w-4 text-[#FF4655]" />
                ภาพกระดานแผนที่ (PNG)
              </span>
              <button
                type="button"
                disabled={!pngUrl || rendering}
                onClick={handleDownloadPng}
                className="flex items-center gap-1.5 bg-[#FF4655] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#E03545] disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                ดาวน์โหลด PNG
              </button>
            </div>

            <div className="flex aspect-square w-full items-center justify-center border border-[#263145] bg-[#0B0E14] p-2">
              {rendering ? (
                <span className="text-xs text-[#94A3B8]">กำลังสร้างภาพแผนการเล่น...</span>
              ) : pngUrl ? (
                <img
                  src={pngUrl}
                  alt="ตัวอย่างภาพกลยุทธ์ TACTIX"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-[#64748B]">ไม่สามารถเรนเดอร์ภาพตัวอย่างได้</span>
              )}
            </div>
          </div>

          {/* Text Brief & Playbook JSON */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-1 flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-semibold uppercase text-[#CBD5E1]">
                  สรุปแผนสำหรับแชร์ใน Discord / LINE
                </span>
                <button
                  type="button"
                  onClick={handleCopyBrief}
                  className="flex items-center gap-1.5 border border-[#263145] bg-[#171E2B] px-3 py-1 text-xs font-medium text-[#F1F5F9] hover:border-[#22D3EE] hover:text-[#22D3EE]"
                >
                  {copiedText ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#34D399]" />
                      คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      คัดลอกข้อความ
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                value={briefText}
                className="min-h-[210px] flex-1 resize-none border border-[#263145] bg-[#0B0E14] p-3 font-mono-tabular text-xs leading-relaxed text-[#CBD5E1] focus:outline-none"
              />
            </div>

            <div className="space-y-2 border-t border-[#263145] pt-3">
              <div className="font-display text-xs font-semibold uppercase text-[#94A3B8]">
                สำรอง / นำเข้าคลังแผนทั้งหมด (.json)
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5 border border-[#263145] bg-[#171E2B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-[#475569] hover:text-white"
                >
                  <FileJson className="h-3.5 w-3.5 text-[#22D3EE]" />
                  ส่งออก Playbook JSON
                </button>

                <label className="flex cursor-pointer items-center gap-1.5 border border-[#263145] bg-[#171E2B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-[#475569] hover:text-white">
                  <Upload className="h-3.5 w-3.5 text-[#34D399]" />
                  นำเข้า JSON
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              {importError && <p className="text-xs text-[#FB7185]">{importError}</p>}
              {importSuccess && (
                <p className="text-xs text-[#34D399]">นำเข้าคลังแผนการเล่นเรียบร้อยแล้ว</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
