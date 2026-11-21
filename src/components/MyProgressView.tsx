import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckSquare,
  Flame,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Square,
  Timer,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { DAILY_TRAINING_MISSIONS } from '../data/proTrainingData';
import {
  CustomWarmupItem,
  MyProgressPersistedState,
  WarmupProgramId,
} from '../types/tactix';

const PROGRESS_STORAGE_KEY = 'tactix:progress:v1';

interface WarmupProgramDef {
  id: WarmupProgramId;
  label: string;
  defaultMinutes: number;
  items: CustomWarmupItem[];
}

const WARMUP_PROGRAMS: WarmupProgramDef[] = [
  {
    id: 'standard',
    label: 'สูตรมาตรฐาน (10 นาที)',
    defaultMinutes: 10,
    items: [
      {
        id: 'bots',
        label: 'ซ้อมยิงบอท',
        hint: 'The Range: วอร์มข้อมือ ยิงหัวบอท 50–100 ตัวพร้อมเดินสลับ A-D',
      },
      {
        id: 'deathmatch',
        label: 'ลง Deathmatch',
        hint: 'ฝึกจังหวะปะทะจริง เน้นยิง Burst 1–2 นัด ไม่โฟกัสสกอร์',
      },
      {
        id: 'crosshair',
        label: 'ฝึกวางเป้า',
        hint: 'รักษาระดับ Crosshair ที่ความสูงหัวและเช็กทีละมุมก่อนเปิดปะทะ',
      },
    ],
  },
  {
    id: 'tenz',
    label: 'สูตร TenZ - เน้นรีเฟล็กซ์ (15 นาที)',
    defaultMinutes: 15,
    items: [
      {
        id: 'tenz-1',
        label: '1) The Range: ยิงบอท 100 ตัวให้เร็วที่สุด',
        hint: 'เน้นความไวในการสะบัดเป้าสลับตัวและคุมจังหวะคลิกให้สม่ำเสมอ',
      },
      {
        id: 'tenz-2',
        label: '2) The Range: โหมด Hard Bots ทำคะแนนให้เกิน 15 ตัว',
        hint: 'ฝึกปฏิกิริยาตอบสนองและความแม่นยำภายใต้จังหวะเร่ง',
      },
      {
        id: 'tenz-3',
        label: '3) Deathmatch 2 ตา เน้นขยับยิง Counter-Strafe',
        hint: 'เดินสลับทิศ A-D แล้วหยุดยิงทีละชุดสั้นๆ ห้ามยืนนิ่งสเปรย์',
      },
    ],
  },
  {
    id: 'demon1',
    label: 'สูตร Demon1 - เน้นยิงหัวคมๆ (15 นาที)',
    defaultMinutes: 15,
    items: [
      {
        id: 'demon1-1',
        label: '1) The Range: ยิงหัวบอท 100 ตัวแบบเดินสลับ A-D ห้ามยิงพลาด',
        hint: 'รอให้เป้าหยุดตรงกลางหัวก่อนคลิกยิงทุกตัว ห้ามสาดกระสุน',
      },
      {
        id: 'demon1-2',
        label: '2) Deathmatch 1 ตา ใช้ปืน Sheriff หรือ Guardian เท่านั้น',
        hint: 'บังคับความแม่นยำนัดแรกและฝึกการดึงเป้าเข้าหัว',
      },
      {
        id: 'demon1-3',
        label: '3) Deathmatch 1 ตา เน้นวางเป้า Crosshair Placement',
        hint: 'เกาะเป้าระดับหัวตามขอบมุมและหลีกเลี่ยงการกดนั่งยิง',
      },
    ],
  },
  {
    id: 'custom',
    label: 'กำหนดเอง (Custom)',
    defaultMinutes: 10,
    items: [],
  },
];

const INITIAL_PROGRESS_STATE: MyProgressPersistedState = {
  warmupProgramId: 'standard',
  warmupChecksByProgram: {
    standard: {},
    tenz: {},
    demon1: {},
    custom: {},
  },
  customWarmupItems: [],
  customWarmupMinutes: 10,
  warmupChecks: {
    bots: false,
    deathmatch: false,
    crosshair: false,
  },
  warmupCompletedDates: [],
  dailyMission: DAILY_TRAINING_MISSIONS[0],
  dailyMissionDone: false,
  logs: [],
};

function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeWarmupStreak(completedDates: string[]): {
  streakDays: number;
  completedToday: boolean;
} {
  const dateSet = new Set(completedDates);
  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const completedToday = dateSet.has(todayKey);

  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!completedToday) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streakDays = 0;
  while (dateSet.has(getLocalDateKey(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streakDays, completedToday };
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function MyProgressView() {
  const [progress, setProgress] = useState<MyProgressPersistedState>(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MyProgressPersistedState>;
        const validPrograms: WarmupProgramId[] = ['standard', 'tenz', 'demon1', 'custom'];
        const warmupProgramId: WarmupProgramId = validPrograms.includes(
          parsed.warmupProgramId as WarmupProgramId
        )
          ? (parsed.warmupProgramId as WarmupProgramId)
          : 'standard';

        const checks = {
          bots: !!parsed.warmupChecks?.bots,
          deathmatch: !!parsed.warmupChecks?.deathmatch,
          crosshair: !!parsed.warmupChecks?.crosshair,
        };

        const parsedByProgram = parsed.warmupChecksByProgram ?? {};
        const warmupChecksByProgram: Record<string, Record<string, boolean>> = {
          standard: parsedByProgram.standard ?? {
            bots: checks.bots,
            deathmatch: checks.deathmatch,
            crosshair: checks.crosshair,
          },
          tenz: parsedByProgram.tenz ?? {},
          demon1: parsedByProgram.demon1 ?? {},
          custom: parsedByProgram.custom ?? {},
        };

        const customWarmupItems: CustomWarmupItem[] = Array.isArray(parsed.customWarmupItems)
          ? parsed.customWarmupItems.filter(
              (item): item is CustomWarmupItem =>
                !!item &&
                typeof item.id === 'string' &&
                typeof item.label === 'string' &&
                typeof item.hint === 'string'
            )
          : [];

        const rawMinutes = Number(parsed.customWarmupMinutes);
        const customWarmupMinutes =
          Number.isFinite(rawMinutes) && rawMinutes >= 1 && rawMinutes <= 120
            ? Math.round(rawMinutes)
            : 10;

        const storedDates = Array.isArray(parsed.warmupCompletedDates)
          ? parsed.warmupCompletedDates.filter((d): d is string => typeof d === 'string')
          : [];
        const todayKey = getLocalDateKey();
        const allStandardChecked = checks.bots && checks.deathmatch && checks.crosshair;
        const warmupCompletedDates =
          allStandardChecked && !storedDates.includes(todayKey)
            ? [...storedDates, todayKey]
            : storedDates;

        return {
          warmupProgramId,
          warmupChecksByProgram,
          customWarmupItems,
          customWarmupMinutes,
          warmupChecks: checks,
          warmupCompletedDates,
          dailyMission:
            typeof parsed.dailyMission === 'string' && parsed.dailyMission.length > 0
              ? parsed.dailyMission
              : DAILY_TRAINING_MISSIONS[0],
          dailyMissionDone: !!parsed.dailyMissionDone,
          logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        };
      }
    } catch {
      // Ignore invalid localStorage payload
    }
    return INITIAL_PROGRESS_STATE;
  });

  const getProgramMinutes = (state: MyProgressPersistedState): number => {
    if (state.warmupProgramId === 'custom') return state.customWarmupMinutes;
    return (
      WARMUP_PROGRAMS.find((p) => p.id === state.warmupProgramId)?.defaultMinutes ?? 10
    );
  };

  // Dynamic countdown timer state based on selected warmup program
  const [secondsLeft, setSecondsLeft] = useState<number>(() => getProgramMinutes(progress) * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Custom warmup item form state
  const [addingCustomItem, setAddingCustomItem] = useState<boolean>(false);
  const [customTitleDraft, setCustomTitleDraft] = useState<string>('');
  const [customHintDraft, setCustomHintDraft] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const activeProgram = useMemo(
    () =>
      WARMUP_PROGRAMS.find((p) => p.id === progress.warmupProgramId) ?? WARMUP_PROGRAMS[0],
    [progress.warmupProgramId]
  );

  const activeWarmupItems = useMemo(
    () => (activeProgram.id === 'custom' ? progress.customWarmupItems : activeProgram.items),
    [activeProgram, progress.customWarmupItems]
  );

  const activeProgramChecks = useMemo(
    () => progress.warmupChecksByProgram[activeProgram.id] ?? {},
    [progress.warmupChecksByProgram, activeProgram.id]
  );

  const targetMinutes =
    activeProgram.id === 'custom' ? progress.customWarmupMinutes : activeProgram.defaultMinutes;
  const targetSeconds = Math.max(60, targetMinutes * 60);

  const warmupDoneCount = activeWarmupItems.filter((item) => !!activeProgramChecks[item.id]).length;
  const timerProgressPct = Math.min(
    100,
    Math.max(0, Math.round(((targetSeconds - secondsLeft) / targetSeconds) * 100))
  );

  const { streakDays, completedToday } = useMemo(
    () => computeWarmupStreak(progress.warmupCompletedDates),
    [progress.warmupCompletedDates]
  );

  const handleSelectProgram = (programId: WarmupProgramId) => {
    const nextMins =
      programId === 'custom'
        ? progress.customWarmupMinutes
        : WARMUP_PROGRAMS.find((p) => p.id === programId)?.defaultMinutes ?? 10;

    setProgress((prev) => ({
      ...prev,
      warmupProgramId: programId,
    }));
    setTimerRunning(false);
    setSecondsLeft(nextMins * 60);
    if (programId !== 'custom') {
      setAddingCustomItem(false);
    }
  };

  const toggleWarmupItem = (itemId: string) => {
    setProgress((prev) => {
      const progId = prev.warmupProgramId;
      const currentProgChecks = prev.warmupChecksByProgram[progId] ?? {};
      const nextProgChecks = {
        ...currentProgChecks,
        [itemId]: !currentProgChecks[itemId],
      };

      const items =
        progId === 'custom'
          ? prev.customWarmupItems
          : WARMUP_PROGRAMS.find((p) => p.id === progId)?.items ?? [];

      const allDone = items.length > 0 && items.every((item) => !!nextProgChecks[item.id]);
      const todayKey = getLocalDateKey();
      const nextDates =
        allDone && !prev.warmupCompletedDates.includes(todayKey)
          ? [...prev.warmupCompletedDates, todayKey]
          : prev.warmupCompletedDates;

      const nextStandardChecks =
        progId === 'standard'
          ? {
              bots: !!nextProgChecks.bots,
              deathmatch: !!nextProgChecks.deathmatch,
              crosshair: !!nextProgChecks.crosshair,
            }
          : prev.warmupChecks;

      return {
        ...prev,
        warmupChecks: nextStandardChecks,
        warmupChecksByProgram: {
          ...prev.warmupChecksByProgram,
          [progId]: nextProgChecks,
        },
        warmupCompletedDates: nextDates,
      };
    });
  };

  const resetWarmup = () => {
    setProgress((prev) => ({
      ...prev,
      warmupChecks:
        prev.warmupProgramId === 'standard'
          ? { bots: false, deathmatch: false, crosshair: false }
          : prev.warmupChecks,
      warmupChecksByProgram: {
        ...prev.warmupChecksByProgram,
        [prev.warmupProgramId]: {},
      },
    }));
  };

  const handleAddCustomWarmupItem = (e: React.FormEvent) => {
    e.preventDefault();
    const label = customTitleDraft.trim();
    if (!label) return;
    const hint = customHintDraft.trim() || 'หัวข้อฝึกซ้อมกำหนดเอง';
    const newItem: CustomWarmupItem = {
      id: `custom-drill-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      label,
      hint,
    };

    setProgress((prev) => ({
      ...prev,
      customWarmupItems: [...prev.customWarmupItems, newItem],
    }));
    setCustomTitleDraft('');
    setCustomHintDraft('');
    setAddingCustomItem(false);
  };

  const handleDeleteCustomWarmupItem = (itemId: string) => {
    setProgress((prev) => {
      const nextCustomChecks = { ...(prev.warmupChecksByProgram.custom ?? {}) };
      delete nextCustomChecks[itemId];
      return {
        ...prev,
        customWarmupItems: prev.customWarmupItems.filter((item) => item.id !== itemId),
        warmupChecksByProgram: {
          ...prev.warmupChecksByProgram,
          custom: nextCustomChecks,
        },
      };
    });
  };

  const handleChangeCustomMinutes = (rawValue: string) => {
    const parsed = Number(rawValue);
    const clamped = Number.isFinite(parsed) ? Math.min(120, Math.max(1, Math.round(parsed))) : 1;
    setProgress((prev) => ({
      ...prev,
      customWarmupMinutes: clamped,
    }));
    setTimerRunning(false);
    setSecondsLeft(clamped * 60);
  };

  const randomizeDailyMission = () => {
    const candidates = DAILY_TRAINING_MISSIONS.filter((m) => m !== progress.dailyMission);
    const pool = candidates.length > 0 ? candidates : DAILY_TRAINING_MISSIONS;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setProgress((prev) => ({
      ...prev,
      dailyMission: picked,
      dailyMissionDone: false,
    }));
  };

  return (
    <div className="scrollbar-thin flex h-full w-full flex-col overflow-y-auto bg-[#0B0E14] text-[#F1F5F9]">
      {/* Page Title Bar */}
      <div className="border-b border-[#263145] bg-[#111620] px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#22D3EE]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>MY PROGRESS TRACKER</span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-[#F1F5F9]">
              พัฒนาฝีมือ (My Progress)
            </h1>
            <p className="mt-1 text-sm text-[#94A3B8]">
              เลือกสูตรวอร์มอัพก่อนลงสนาม จับเวลาฝึกซ้อม และพิชิตภารกิจฝึกฝีมือประจำวันอย่างสม่ำเสมอ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-[#263145] bg-[#171E2B] px-3.5 py-2 text-xs">
              <Flame className={`h-4 w-4 ${streakDays > 0 ? 'text-[#FBBF24]' : 'text-[#475569]'}`} />
              <span className="text-[#94A3B8]">Streak ต่อเนื่อง:</span>
              <span className="font-mono-tabular font-bold text-[#F1F5F9]">{streakDays} วัน</span>
            </div>
            <div className="hidden items-center gap-2 border border-[#263145] bg-[#171E2B] px-3.5 py-2 text-xs sm:flex">
              <CalendarCheck className="h-4 w-4 text-[#34D399]" />
              <span className="text-[#94A3B8]">สะสมทั้งหมด:</span>
              <span className="font-mono-tabular font-bold text-[#F1F5F9]">
                {progress.warmupCompletedDates.length} วัน
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Balanced Workspace */}
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
        {/* PART 1 (Left): วอร์มอัพก่อนเล่น — เลือกโปรแกรม & เช็กลิสต์ */}
        <section
          aria-label="ส่วนที่ 1 วอร์มอัพก่อนเล่น"
          className="flex flex-col gap-4 border border-[#263145] bg-[#111620] p-5"
        >
          <div className="flex items-center justify-between border-b border-[#263145] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center bg-[#FF4655] font-mono-tabular text-xs font-bold text-white">
                1
              </span>
              <h2 className="font-display text-lg font-bold tracking-wide text-[#F1F5F9]">
                วอร์มอัพก่อนเล่น
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tabular text-xs font-semibold text-[#34D399]">
                {warmupDoneCount}/{activeWarmupItems.length} ข้อ
              </span>
              {warmupDoneCount > 0 && (
                <button
                  type="button"
                  onClick={resetWarmup}
                  title="ล้างเช็กลิสต์วอร์มอัพ"
                  className="border border-[#263145] bg-[#171E2B] p-1 text-[#94A3B8] hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Program Selector (4 Modes) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#CBD5E1]">เลือกโปรแกรมฝึก</span>
              <span className="font-mono-tabular text-[11px] text-[#22D3EE]">
                เวลา {targetMinutes} นาที
              </span>
            </div>
            <div
              className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
              role="group"
              aria-label="เลือกโปรแกรมฝึก"
            >
              {WARMUP_PROGRAMS.map((prog) => {
                const isSelected = prog.id === activeProgram.id;
                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => handleSelectProgram(prog.id)}
                    aria-pressed={isSelected}
                    className={`border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-[#FF4655] bg-[#FF4655]/15 text-[#F1F5F9]'
                        : 'border-[#263145] bg-[#0B0E14]/80 text-[#94A3B8] hover:border-[#475569] hover:text-[#F1F5F9]'
                    }`}
                  >
                    {prog.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warmup Checklist */}
          <div className="flex flex-1 flex-col gap-2.5">
            {activeWarmupItems.length === 0 ? (
              <div className="border border-dashed border-[#263145] bg-[#0B0E14]/60 p-5 text-center text-xs text-[#94A3B8]">
                ยังไม่มีหัวข้อฝึกในสูตรกำหนดเอง — กดปุ่ม &ldquo;+ เพิ่มหัวข้อฝึก&rdquo; ด้านล่างเพื่อสร้างรายการของคุณ
              </div>
            ) : (
              activeWarmupItems.map((item) => {
                const checked = !!activeProgramChecks[item.id];
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2 border p-3.5 transition-colors ${
                      checked
                        ? 'border-[#34D399]/50 bg-[#171E2B]'
                        : 'border-[#263145] bg-[#0B0E14]/70 hover:border-[#475569] hover:bg-[#171E2B]/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleWarmupItem(item.id)}
                      aria-pressed={checked}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      {checked ? (
                        <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#34D399]" />
                      ) : (
                        <Square className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-semibold ${
                            checked ? 'text-[#94A3B8] line-through' : 'text-[#F1F5F9]'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-xs text-[#94A3B8]">{item.hint}</div>
                      </div>
                    </button>

                    {activeProgram.id === 'custom' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomWarmupItem(item.id)}
                        title="ลบหัวข้อฝึกนี้"
                        aria-label={`ลบ ${item.label}`}
                        className="shrink-0 border border-[#263145] bg-[#111620] p-1 text-[#94A3B8] transition-colors hover:border-[#FF4655] hover:text-[#FF4655]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {/* Custom Program: "+ เพิ่มหัวข้อฝึก" Button & Inline Form */}
            {activeProgram.id === 'custom' && (
              <>
                {!addingCustomItem ? (
                  <button
                    type="button"
                    onClick={() => setAddingCustomItem(true)}
                    className="flex items-center justify-center gap-1.5 border border-dashed border-[#475569] bg-[#0B0E14]/50 px-3 py-2.5 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#22D3EE] hover:text-[#22D3EE]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    + เพิ่มหัวข้อฝึก
                  </button>
                ) : (
                  <form
                    onSubmit={handleAddCustomWarmupItem}
                    className="flex flex-col gap-2.5 border border-[#22D3EE]/50 bg-[#171E2B] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#22D3EE]">
                        เพิ่มหัวข้อฝึกกำหนดเอง
                      </span>
                      <button
                        type="button"
                        onClick={() => setAddingCustomItem(false)}
                        aria-label="ปิดฟอร์มเพิ่มหัวข้อฝึก"
                        className="text-[#94A3B8] hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={customTitleDraft}
                      onChange={(e) => setCustomTitleDraft(e.target.value)}
                      placeholder="ชื่อหัวข้อฝึก เช่น ยิงบอท Medium 3 รอบ"
                      className="border border-[#263145] bg-[#0B0E14] px-2.5 py-1.5 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={customHintDraft}
                      onChange={(e) => setCustomHintDraft(e.target.value)}
                      placeholder="คำอธิบายสั้นๆ (ไม่บังคับ)"
                      className="border border-[#263145] bg-[#0B0E14] px-2.5 py-1.5 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingCustomItem(false)}
                        className="border border-[#263145] bg-[#111620] px-3 py-1 text-xs text-[#94A3B8] hover:text-white"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="bg-[#22D3EE] px-3 py-1 text-xs font-semibold text-[#0B0E14] hover:bg-[#06B6D4]"
                      >
                        เพิ่มรายการ
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </section>

        {/* PART 2 (Right): จับเวลาฝึกซ้อม & ภารกิจฝึกฝีมือประจำวัน */}
        <section
          aria-label="ส่วนที่ 2 ตัวจับเวลาและภารกิจฝึกฝีมือประจำวัน"
          className="flex flex-col justify-between gap-5 border border-[#263145] bg-[#111620] p-5"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#263145] pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center bg-[#22D3EE] font-mono-tabular text-xs font-bold text-[#0B0E14]">
                  2
                </span>
                <h2 className="font-display text-lg font-bold tracking-wide text-[#F1F5F9]">
                  จับเวลาและภารกิจประจำวัน
                </h2>
              </div>
              <span className="text-xs text-[#94A3B8]">
                {completedToday ? 'วันนี้วอร์มครบแล้ว' : 'ติ๊กครบทุกข้อเพื่อต่อ Streak'}
              </span>
            </div>

            {/* Dynamic Countdown Timer */}
            <div className="border border-[#263145] bg-[#171E2B] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
                  <Timer className="h-4 w-4" />
                  <span>จับเวลาวอร์มอัพ {targetMinutes} นาที</span>
                </div>

                <div className="flex items-center gap-2">
                  {activeProgram.id === 'custom' && (
                    <label className="flex items-center gap-1.5 border border-[#263145] bg-[#0B0E14] px-2 py-0.5 text-[11px] text-[#CBD5E1]">
                      <span>ตั้งเวลา:</span>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={progress.customWarmupMinutes}
                        onChange={(e) => handleChangeCustomMinutes(e.target.value)}
                        aria-label="แก้ไขจำนวนนาทีจับเวลา"
                        className="w-11 bg-transparent text-center font-mono-tabular font-bold text-[#22D3EE] focus:outline-none"
                      />
                      <span className="text-[#94A3B8]">นาที</span>
                    </label>
                  )}
                  {secondsLeft === 0 && (
                    <span className="border border-[#34D399]/50 bg-[#34D399]/15 px-2 py-0.5 text-[11px] font-semibold text-[#34D399]">
                      ครบเวลาแล้ว!
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono-tabular text-4xl font-bold tracking-wider text-[#F1F5F9]">
                  {formatCountdown(secondsLeft)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (secondsLeft === 0) setSecondsLeft(targetSeconds);
                      setTimerRunning((r) => !r);
                    }}
                    className={`clip-angle-sm flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors ${
                      timerRunning
                        ? 'bg-[#FBBF24] text-[#0B0E14] hover:bg-[#F59E0B]'
                        : 'bg-[#22D3EE] text-[#0B0E14] hover:bg-[#06B6D4]'
                    }`}
                  >
                    {timerRunning ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        หยุดชั่วคราว
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        {secondsLeft < targetSeconds && secondsLeft > 0
                          ? 'นับต่อ'
                          : `เริ่มจับเวลา ${targetMinutes} นาที`}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setSecondsLeft(targetSeconds);
                    }}
                    title={`รีเซ็ตเวลา ${targetMinutes}:00`}
                    className="flex items-center gap-1 border border-[#263145] bg-[#111620] px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:border-[#475569] hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    รีเซ็ต
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 w-full overflow-hidden bg-[#0B0E14]">
                <div
                  className="h-full bg-[#22D3EE] transition-all duration-300"
                  style={{ width: `${timerProgressPct}%` }}
                />
              </div>
            </div>

            {/* Daily Training Mission Randomizer */}
            <div className="border border-[#263145] bg-[#171E2B] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FBBF24]">
                  ภารกิจฝึกฝีมือประจำวัน
                </span>
                <button
                  type="button"
                  onClick={randomizeDailyMission}
                  className="flex items-center gap-1.5 border border-[#FF4655]/60 bg-[#FF4655]/15 px-3 py-1.5 text-xs font-semibold text-[#F1F5F9] transition-colors hover:bg-[#FF4655] hover:text-white"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  สุ่มภารกิจฝึกฝีมือประจำวัน
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setProgress((prev) => ({
                    ...prev,
                    dailyMissionDone: !prev.dailyMissionDone,
                  }))
                }
                className="mt-3 flex w-full items-start gap-3 border border-[#263145] bg-[#0B0E14]/80 p-3.5 text-left transition-colors hover:border-[#475569]"
              >
                {progress.dailyMissionDone ? (
                  <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#34D399]" />
                ) : (
                  <Square className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" />
                )}
                <span
                  className={`text-sm leading-relaxed ${
                    progress.dailyMissionDone
                      ? 'text-[#94A3B8] line-through'
                      : 'text-[#F1F5F9]'
                  }`}
                >
                  {progress.dailyMission}
                </span>
              </button>
            </div>
          </div>

          {/* Warmup Consistency Footer Summary */}
          <div className="grid grid-cols-2 gap-3 border-t border-[#263145] pt-4">
            <div className="border border-[#263145] bg-[#0B0E14]/70 p-3">
              <div className="text-[11px] text-[#94A3B8]">วอร์มอัพต่อเนื่อง</div>
              <div className="mt-1 font-mono-tabular text-xl font-bold text-[#FBBF24]">
                {streakDays} วัน
              </div>
            </div>
            <div className="border border-[#263145] bg-[#0B0E14]/70 p-3">
              <div className="text-[11px] text-[#94A3B8]">ความคืบหน้าโปรแกรมนี้</div>
              <div className="mt-1 font-mono-tabular text-xl font-bold text-[#34D399]">
                {activeWarmupItems.length > 0
                  ? `${Math.round((warmupDoneCount / activeWarmupItems.length) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
