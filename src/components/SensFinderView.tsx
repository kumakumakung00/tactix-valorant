import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MousePointer2, Timer, TrendingUp, Wand2 } from 'lucide-react';
import {
  SensAiResult,
  SensTestStats,
  calcCm360,
  calcEdpi,
  requestSensAnalysis,
} from '../services/sensAi';

type Phase = 'setup' | 'test' | 'result';
type TestStage = 'flick' | 'tracking';

interface FlickTarget {
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  hit: boolean;
  /** ปริมาณการลากเกินจุดกึ่งกลางเป้า (px) — ใช้ตรวจ Overshoot */
  passedCenter: boolean;
  minDistToCenter: number;
}

const FLICK_DURATION_MS = 30_000;
const TRACKING_DURATION_MS = 15_000;
const MAX_TARGETS = 12;

const CANVAS_W = 800;
const CANVAS_H = 450;

export function SensFinderView() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [dpiInput, setDpiInput] = useState('800');
  const [sensInput, setSensInput] = useState('0.35');
  const [grip, setGrip] = useState<'wrist' | 'arm'>('wrist');

  const [stage, setStage] = useState<TestStage>('flick');
  const [timeLeft, setTimeLeft] = useState(FLICK_DURATION_MS / 1000);
  const [running, setRunning] = useState(false);

  // สถิติจริงจากมินิเกม
  const [flickShots, setFlickShots] = useState({ hits: 0, total: 0 });
  const [overshoot, setOvershoot] = useState(0);
  const [undershoot, setUndershoot] = useState(0);
  const [flickTimes, setFlickTimes] = useState<number[]>([]);
  const [trackingPct, setTrackingPct] = useState(0);

  const [aiResult, setAiResult] = useState<SensAiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetsRef = useRef<FlickTarget[]>([]);
  const crosshairRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const trackTargetRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H / 2, vx: 140, vy: 90 });
  const onTargetTimeRef = useRef(0);
  const trackFrameCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const stageRef = useRef<TestStage>('flick');

  const dpi = Number(dpiInput) || 0;
  const sens = Number(sensInput) || 0;

  const stats: SensTestStats = useMemo(
    () => ({
      dpi,
      currentSens: sens,
      gripStyle: grip,
      flickAccuracyPct:
        flickShots.total > 0 ? Math.round((flickShots.hits / flickShots.total) * 100) : 0,
      overshootPct:
        flickShots.hits > 0 ? Math.round((overshoot / flickShots.hits) * 100) : 0,
      undershootPct:
        flickShots.hits > 0 ? Math.round((undershoot / flickShots.hits) * 100) : 0,
      avgFlickTimeMs:
        flickTimes.length > 0
          ? Math.round(flickTimes.reduce((a, b) => a + b, 0) / flickTimes.length)
          : 0,
      trackingPct,
    }),
    [dpi, sens, grip, flickShots, overshoot, undershoot, flickTimes, trackingPct]
  );

  const spawnTarget = useCallback(() => {
    const radius = 26 + Math.random() * 14;
    const margin = radius + 20;
    targetsRef.current.push({
      x: margin + Math.random() * (CANVAS_W - margin * 2),
      y: margin + Math.random() * (CANVAS_H - margin * 2),
      radius,
      spawnTime: performance.now(),
      hit: false,
      passedCenter: false,
      minDistToCenter: Infinity,
    });
  }, []);

  const finishTracking = useCallback(() => {
    setRunning(false);
    const frames = trackFrameCountRef.current;
    if (frames > 0) {
      setTrackingPct(Math.round((onTargetTimeRef.current / frames) * 100));
    }
    setPhase('result');
  }, []);

  const finishFlick = useCallback(() => {
    stageRef.current = 'tracking';
    setStage('tracking');
    setTimeLeft(TRACKING_DURATION_MS / 1000);
    startTimeRef.current = performance.now();
    onTargetTimeRef.current = 0;
    trackFrameCountRef.current = 0;
    targetsRef.current = [];
  }, []);

  const startTest = useCallback(() => {
    if (dpi < 100 || sens <= 0) return;
    setFlickShots({ hits: 0, total: 0 });
    setOvershoot(0);
    setUndershoot(0);
    setFlickTimes([]);
    setTrackingPct(0);
    setAiResult(null);
    setAiError(null);
    targetsRef.current = [];
    crosshairRef.current = { x: CANVAS_W / 2, y: CANVAS_H / 2 };
    setStage('flick');
    stageRef.current = 'flick';
    setTimeLeft(FLICK_DURATION_MS / 1000);
    setPhase('test');
    startTimeRef.current = performance.now();
    spawnTarget();
    setRunning(true);
  }, [dpi, sens, spawnTarget]);

  // Game loop
  useEffect(() => {
    if (phase !== 'test' || !running) return;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const duration = stageRef.current === 'flick' ? FLICK_DURATION_MS : TRACKING_DURATION_MS;

      if (elapsed >= duration) {
        if (stageRef.current === 'flick') {
          finishFlick();
        } else {
          finishTracking();
        }
        return;
      }

      setTimeLeft(Math.ceil((duration - elapsed) / 1000));
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx.fillStyle = '#0B0E14';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const cross = crosshairRef.current;

      if (stageRef.current === 'flick') {
        if (targetsRef.current.length === 0) spawnTarget();
        if (targetsRef.current.length < MAX_TARGETS && Math.random() < 0.02) spawnTarget();

        const remaining = targetsRef.current.filter((t) => !t.hit);
        for (const t of remaining) {
          const dist = Math.hypot(cross.x - t.x, cross.y - t.y);
          if (dist < t.minDistToCenter) t.minDistToCenter = dist;
          if (dist < t.radius / 3) t.passedCenter = true;

          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 70, 85, 0.16)';
          ctx.fill();
          ctx.strokeStyle = '#FF4655';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius / 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 70, 85, 0.7)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        targetsRef.current = remaining;
      } else {
        const tt = trackTargetRef.current;
        tt.x += tt.vx * 0.016;
        tt.y += tt.vy * 0.016;
        if (tt.x < 40 || tt.x > CANVAS_W - 40) tt.vx *= -1;
        if (tt.y < 40 || tt.y > CANVAS_H - 40) tt.vy *= -1;

        const dist = Math.hypot(cross.x - tt.x, cross.y - tt.y);
        trackFrameCountRef.current += 1;
        if (dist < 34) onTargetTimeRef.current += 1;

        ctx.beginPath();
        ctx.arc(tt.x, tt.y, 34, 0, Math.PI * 2);
        ctx.fillStyle = dist < 34 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(34, 211, 238, 0.16)';
        ctx.fill();
        ctx.strokeStyle = dist < 34 ? '#34D399' : '#22D3EE';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Crosshair
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cross.x - 9, cross.y);
      ctx.lineTo(cross.x + 9, cross.y);
      ctx.moveTo(cross.x, cross.y - 9);
      ctx.lineTo(cross.x, cross.y + 9);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, running, spawnTarget, finishFlick, finishTracking]);

  // Mouse tracking (Pointer Lock)
  useEffect(() => {
    if (phase !== 'test') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      crosshairRef.current.x = Math.min(CANVAS_W, Math.max(0, crosshairRef.current.x + e.movementX));
      crosshairRef.current.y = Math.min(CANVAS_H, Math.max(0, crosshairRef.current.y + e.movementY));
    };
    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, [phase]);

  // Click handling for flick targets
  const handleCanvasClick = useCallback(() => {
    if (phase !== 'test' || stageRef.current !== 'flick') return;
    const cross = crosshairRef.current;
    const remaining = targetsRef.current.filter((t) => !t.hit);
    const hitIdx = remaining.findIndex(
      (t) => Math.hypot(cross.x - t.x, cross.y - t.y) < t.radius
    );

    setFlickShots((prev) => ({ hits: prev.hits + (hitIdx >= 0 ? 1 : 0), total: prev.total + 1 }));

    if (hitIdx >= 0) {
      const target = remaining[hitIdx];
      const reactMs = Math.round(performance.now() - target.spawnTime);
      setFlickTimes((prev) => [...prev, reactMs]);
      if (target.passedCenter && target.minDistToCenter < target.radius / 3) {
        setOvershoot((prev) => prev + 1);
      } else {
        setUndershoot((prev) => prev + 1);
      }
      targetsRef.current = remaining.filter((_, i) => i !== hitIdx);
      spawnTarget();
    }
  }, [phase, spawnTarget]);

  const handleAnalyze = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await requestSensAnalysis(stats);
      setAiResult(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    } finally {
      setAiLoading(false);
    }
  }, [stats]);

  const requestPointerLock = useCallback(() => {
    canvasRef.current?.requestPointerLock();
  }, []);

  const edpiNow = calcEdpi(dpi, sens);
  const cm360Now = dpi > 0 && sens > 0 ? calcCm360(dpi, sens) : 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin bg-[#0B0E14] p-4 lg:p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h1 className="font-display text-xl font-bold text-[#F1F5F9]">
            🎯 AI Sens &amp; DPI Finder
          </h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            กรอกค่าปัจจุบัน ทดสอบมินิเกม 30 วินาที แล้วให้ AI คำนวณ Sens ที่เหมาะกับมือคุณ
          </p>
        </div>

        {/* Step 1: Setup */}
        <section className="space-y-3 border border-[#263145] bg-[#111620] p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#FBBF24]">
            <MousePointer2 className="h-4 w-4" />
            ขั้นตอน 1 · ค่าปัจจุบันของคุณ
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-xs text-[#94A3B8]">DPI ของเมาส์</span>
              <input
                type="number"
                min={100}
                max={3200}
                step={50}
                value={dpiInput}
                onChange={(e) => setDpiInput(e.target.value)}
                className="w-full border border-[#263145] bg-[#0B0E14] px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#FF4655] focus:outline-none"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-[#94A3B8]">Sens ในเกม Valorant</span>
              <input
                type="number"
                min={0.05}
                max={3}
                step={0.01}
                value={sensInput}
                onChange={(e) => setSensInput(e.target.value)}
                className="w-full border border-[#263145] bg-[#0B0E14] px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#FF4655] focus:outline-none"
              />
            </label>
            <div className="space-y-1.5">
              <span className="text-xs text-[#94A3B8]">สไตล์การลากเมาส์</span>
              <div className="flex">
                {(['wrist', 'arm'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrip(g)}
                    className={`flex-1 border px-3 py-2 text-xs font-semibold transition-colors ${
                      grip === g
                        ? 'border-[#FF4655] bg-[#FF4655]/15 text-[#F1F5F9]'
                        : 'border-[#263145] bg-[#0B0E14] text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    {g === 'wrist' ? 'Wrist (ข้อมือ)' : 'Arm (แขน)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {dpi > 0 && sens > 0 && (
            <p className="text-xs text-[#64748B]">
              eDPI ปัจจุบัน: <span className="font-semibold text-[#CBD5E1]">{edpiNow}</span> ·
              cm/360: <span className="font-semibold text-[#CBD5E1]">{cm360Now} ซม.</span>
            </p>
          )}
        </section>

        {/* Step 2: Mini-game */}
        <section className="space-y-3 border border-[#263145] bg-[#111620] p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#FBBF24]">
            <Timer className="h-4 w-4" />
            ขั้นตอน 2 · มินิเกมทดสอบ 30 วินาที (Flick) + 15 วินาที (Tracking)
          </h2>
          {phase === 'setup' && (
            <button
              type="button"
              onClick={startTest}
              disabled={dpi < 100 || sens <= 0}
              className="bg-[#FF4655] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E03545] disabled:cursor-not-allowed disabled:opacity-40"
            >
              เริ่มทดสอบ (เมาส์จะถูกล็อกบนพื้นที่ทดสอบ)
            </button>
          )}
          {phase === 'test' && (
            <div className="space-y-2">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                onClick={handleCanvasClick}
                className="w-full cursor-none border border-[#263145]"
                aria-label="พื้นที่ทดสอบการเล็ง"
              />
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>
                  {stage === 'flick'
                    ? 'ยิงเป้าแดงให้ได้มากที่สุดใน 30 วิ'
                    : 'เล็งตามเป้าน้ำเงินให้ติดค้างไว้ 15 วิ'}
                </span>
                <span className="font-mono-tabular font-semibold text-[#F1F5F9]">
                  {timeLeft}s
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                กด Esc เพื่อปลดล็อกเมาส์ชั่วคราว (การทดสอบจะยังเดินต่อ)
              </p>
            </div>
          )}
          {phase === 'result' && (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'แม่นยำ Flick', value: `${stats.flickAccuracyPct}%` },
                { label: 'ลากเกิน (Overshoot)', value: `${stats.overshootPct}%` },
                { label: 'ลากไม่ถึง (Undershoot)', value: `${stats.undershootPct}%` },
                { label: 'เวลาต่อเป้า', value: `${stats.avgFlickTimeMs}ms` },
                { label: 'Tracking', value: `${stats.trackingPct}%` },
                { label: 'ยิงทั้งหมด', value: `${flickShots.total}` },
              ].map((s) => (
                <div key={s.label} className="border border-[#263145] bg-[#0B0E14] p-2.5 text-center">
                  <div className="font-mono-tabular text-lg font-bold text-[#F1F5F9]">{s.value}</div>
                  <div className="mt-0.5 text-[10px] text-[#94A3B8]">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step 3: AI Analysis */}
        {phase === 'result' && (
          <section className="space-y-3 border border-[#FBBF24]/40 bg-[#111620] p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#FBBF24]">
              <Wand2 className="h-4 w-4" />
              ขั้นตอน 3 · ให้ AI วิเคราะห์
            </h2>
            {aiResult ? (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="border border-[#34D399]/50 bg-[#34D399]/10 p-3 text-center">
                    <div className="font-mono-tabular text-2xl font-bold text-[#34D399]">
                      {aiResult.recommendedSens}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">Sens ที่แนะนำ</div>
                  </div>
                  <div className="border border-[#22D3EE]/50 bg-[#22D3EE]/10 p-3 text-center">
                    <div className="font-mono-tabular text-2xl font-bold text-[#22D3EE]">
                      {aiResult.recommendedEdpi}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">eDPI ที่แนะนำ</div>
                  </div>
                  <div className="border border-[#FBBF24]/50 bg-[#FBBF24]/10 p-3 text-center">
                    <div className="font-mono-tabular text-2xl font-bold text-[#FBBF24]">
                      {aiResult.cm360}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">cm/360 โดยประมาณ</div>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#F1F5F9]">{aiResult.headline}</p>
                <ul className="space-y-1.5">
                  {aiResult.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 border-l-2 border-[#FBBF24] pl-2.5 text-xs leading-relaxed text-[#CBD5E1]"
                    >
                      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FBBF24]" />
                      {tip}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setPhase('setup')}
                  className="border border-[#263145] bg-[#171E2B] px-4 py-2 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#FF4655] hover:text-[#F1F5F9]"
                >
                  ทดสอบอีกครั้ง
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={aiLoading}
                  className="bg-[#FBBF24] px-5 py-2.5 text-sm font-semibold text-[#0B0E14] transition-colors hover:bg-[#D97706] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {aiLoading ? 'AI กำลังวิเคราะห์...' : 'ขอค่า Sens ที่แนะนำจาก AI'}
                </button>
                {aiError && (
                  <div className="border border-[#FF4655]/50 bg-[#FF4655]/10 px-3 py-2.5 text-xs text-[#FCA5A5]">
                    {aiError}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
