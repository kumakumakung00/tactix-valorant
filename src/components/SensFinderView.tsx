import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Crosshair,
  Gauge,
  MousePointer2,
  ShieldCheck,
  Timer,
  TrendingUp,
  Wand2,
  Zap,
} from 'lucide-react';
import {
  SensAiResult,
  SensTestStats,
  TEST_MODES,
  TestMode,
  calcCm360,
  calcEdpi,
  calculateRecommendedSens,
  generateAlgorithmicAnalysis,
  requestSensAnalysis,
} from '../services/sensAi';

type Phase = 'setup' | 'test' | 'result';
type TestStage = 'flick' | 'tracking' | 'switching';

interface FlickTarget {
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  hit: boolean;
  passedCenter: boolean;
  minDistToCenter: number;
  firstProximityTime?: number;
}

interface SwitchTarget {
  id: number;
  x: number;
  y: number;
  radius: number;
  label: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

const CANVAS_W = 800;
const CANVAS_H = 450;

export function SensFinderView() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [dpiInput, setDpiInput] = useState('800');
  const [sensInput, setSensInput] = useState('0.35');
  const [selectedMode, setSelectedMode] = useState<TestMode>('standard'); // Default Standard (90s)

  const [stage, setStage] = useState<TestStage>('flick');
  const [timeLeft, setTimeLeft] = useState(TEST_MODES.standard.stageDurationSec);
  const [running, setRunning] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // สถิติด่าน 1: Flick & Micro-Adjust
  const [flickHits, setFlickHits] = useState(0);
  const [flickTotalShots, setFlickTotalShots] = useState(0);
  const [overshoot, setOvershoot] = useState(0);
  const [undershoot, setUndershoot] = useState(0);
  const [microAdjustTimes, setMicroAdjustTimes] = useState<number[]>([]);

  // สถิติด่าน 2: Smooth Tracking
  const [trackingPct, setTrackingPct] = useState(0);
  const [stabilityScore, setStabilityScore] = useState(0);

  // สถิติด่าน 3: Multi-Target Switch
  const [sweepSpeeds, setSweepSpeeds] = useState<number[]>([]);
  const [switchHits, setSwitchHits] = useState(0);
  const [switchTotalShots, setSwitchTotalShots] = useState(0);

  // ผลการวิเคราะห์ AI
  const [aiResult, setAiResult] = useState<SensAiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const crosshairRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const prevCrosshairRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const rafRef = useRef<number>(0);
  const stageRef = useRef<TestStage>('flick');
  const stageStartTimeRef = useRef(0);

  // Ref ด่าน 1
  const flickTargetRef = useRef<FlickTarget | null>(null);

  // Ref ด่าน 2
  const trackFrameCountRef = useRef(0);
  const onTargetFramesRef = useRef(0);
  const stabilitySamplesRef = useRef<number[]>([]);
  const prevTargetPosRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H / 2 });

  // Ref ด่าน 3
  const switchTargetsRef = useRef<SwitchTarget[]>([]);
  const activeSwitchIndexRef = useRef(0);
  const lastSwitchTimeRef = useRef(0);
  const lastSwitchPosRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H / 2 });

  // เอฟเฟกต์ภาพ
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const clickFeedbackRef = useRef(0);

  const dpi = Number(dpiInput) || 0;
  const sens = Number(sensInput) || 0;
  const currentModeMeta = TEST_MODES[selectedMode];

  // สรุปสถิติทั้งหมด
  const stats: SensTestStats = useMemo(() => {
    const fHits = flickHits;
    const fTotal = Math.max(fHits, flickTotalShots);
    const flickAccuracyPct = fTotal > 0 ? Math.round((fHits / fTotal) * 100) : 0;
    const overUnderTotal = overshoot + undershoot;
    const overshootPct =
      overUnderTotal > 0
        ? Math.round((overshoot / overUnderTotal) * 100)
        : fHits > 0
        ? 50
        : 0;
    const undershootPct = overUnderTotal > 0 ? 100 - overshootPct : fHits > 0 ? 50 : 0;
    const avgMicroAdjustMs =
      microAdjustTimes.length > 0
        ? Math.round(microAdjustTimes.reduce((a, b) => a + b, 0) / microAdjustTimes.length)
        : 140;

    const swSpeeds = sweepSpeeds.length > 0 ? sweepSpeeds : [1050];
    const avgSweepSpeed = Math.round(swSpeeds.reduce((a, b) => a + b, 0) / swSpeeds.length);
    const swTotal = Math.max(switchHits, switchTotalShots);
    const switchAccuracyPct = swTotal > 0 ? Math.round((switchHits / swTotal) * 100) : 0;

    return {
      dpi,
      currentSens: sens,
      testMode: selectedMode,
      testDurationSeconds: currentModeMeta.totalDurationSec,
      flickAccuracyPct,
      overshootPct,
      undershootPct,
      avgMicroAdjustMs,
      flickHits,
      flickTotalShots: fTotal,
      trackingPct: Math.min(100, Math.max(0, trackingPct)),
      stabilityScore: Math.min(100, Math.max(20, stabilityScore)),
      sweepSpeedPxPerSec: avgSweepSpeed,
      switchAccuracyPct,
      switchTargetsHit: switchHits,
      switchTotalShots: swTotal,
    };
  }, [
    dpi,
    sens,
    selectedMode,
    currentModeMeta.totalDurationSec,
    flickHits,
    flickTotalShots,
    overshoot,
    undershoot,
    microAdjustTimes,
    trackingPct,
    stabilityScore,
    sweepSpeeds,
    switchHits,
    switchTotalShots,
  ]);

  // สร้างเป้าด่าน 1 (Flick & Micro-Adjust)
  const spawnFlickTarget = useCallback(() => {
    const radius = 15 + Math.random() * 6; // เป้าสุ่มขนาดเล็ก 15-21 px
    const margin = radius + 40;
    flickTargetRef.current = {
      x: margin + Math.random() * (CANVAS_W - margin * 2),
      y: margin + Math.random() * (CANVAS_H - margin * 2),
      radius,
      spawnTime: performance.now(),
      hit: false,
      passedCenter: false,
      minDistToCenter: Infinity,
      firstProximityTime: undefined,
    };
  }, []);

  // เริ่มด่าน 3 (Multi-Target Switch)
  const initSwitchTargets = useCallback(() => {
    const targets: SwitchTarget[] = [
      { id: 0, x: 130 + Math.random() * 40, y: 190 + Math.random() * 70, radius: 24, label: 'L' },
      { id: 1, x: 400 + (Math.random() - 0.5) * 40, y: 220 + (Math.random() - 0.5) * 60, radius: 24, label: 'M' },
      { id: 2, x: 670 - Math.random() * 40, y: 190 + Math.random() * 70, radius: 24, label: 'R' },
    ];
    switchTargetsRef.current = targets;
    const startIdx = Math.random() > 0.5 ? 0 : 2;
    activeSwitchIndexRef.current = startIdx;
    lastSwitchTimeRef.current = performance.now();
    lastSwitchPosRef.current = { x: targets[startIdx].x, y: targets[startIdx].y };
  }, []);

  const addParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }, []);

  const addFloatingText = useCallback((x: number, y: number, text: string, color = '#34D399') => {
    floatingTextsRef.current.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -35,
    });
  }, []);

  // สลับไปยังด่านถัดไปอัตโนมัติ
  const transitionToStage = useCallback(
    (nextStage: TestStage) => {
      stageRef.current = nextStage;
      setStage(nextStage);
      stageStartTimeRef.current = performance.now();
      setTimeLeft(currentModeMeta.stageDurationSec);

      if (nextStage === 'tracking') {
        setBannerMessage('⚡ เริ่มด่าน 2: Smooth Tracking (เลี้ยงเป้าตามการเคลื่อนที่)');
        trackFrameCountRef.current = 0;
        onTargetFramesRef.current = 0;
        stabilitySamplesRef.current = [];
        prevTargetPosRef.current = { x: CANVAS_W / 2, y: CANVAS_H / 2 };
      } else if (nextStage === 'switching') {
        const fCount = trackFrameCountRef.current;
        const onTarget = onTargetFramesRef.current;
        const pct = fCount > 0 ? Math.round((onTarget / fCount) * 100) : 50;
        setTrackingPct(pct);

        const stabSamples = stabilitySamplesRef.current;
        const stabAvg =
          stabSamples.length > 0
            ? Math.round(stabSamples.reduce((a, b) => a + b, 0) / stabSamples.length)
            : 75;
        setStabilityScore(stabAvg);

        setBannerMessage('🎯 เริ่มด่าน 3: Multi-Target Switch (กวาดเมาส์สลับเป้าซ้าย-กลาง-ขวา)');
        initSwitchTargets();
      }

      setTimeout(() => setBannerMessage(null), 2500);
    },
    [currentModeMeta.stageDurationSec, initSwitchTargets]
  );

  // จบการทดสอบ 3 ด่านทั้งหมด
  const finishAllStages = useCallback(() => {
    setRunning(false);
    setBannerMessage(null);

    const fCount = trackFrameCountRef.current;
    if (fCount > 0) {
      setTrackingPct(Math.round((onTargetFramesRef.current / fCount) * 100));
    }
    const stabSamples = stabilitySamplesRef.current;
    if (stabSamples.length > 0) {
      setStabilityScore(
        Math.round(stabSamples.reduce((a, b) => a + b, 0) / stabSamples.length)
      );
    }

    setPhase('result');
  }, []);

  // เริ่มต้นการทดสอบ
  const startTest = useCallback(() => {
    if (dpi < 100 || sens <= 0) return;

    setFlickHits(0);
    setFlickTotalShots(0);
    setOvershoot(0);
    setUndershoot(0);
    setMicroAdjustTimes([]);

    setTrackingPct(0);
    setStabilityScore(0);

    setSweepSpeeds([]);
    setSwitchHits(0);
    setSwitchTotalShots(0);

    setAiResult(null);
    setAiError(null);
    particlesRef.current = [];
    floatingTextsRef.current = [];

    crosshairRef.current = { x: CANVAS_W / 2, y: CANVAS_H / 2 };
    prevCrosshairRef.current = { x: CANVAS_W / 2, y: CANVAS_H / 2 };

    setStage('flick');
    stageRef.current = 'flick';
    setTimeLeft(currentModeMeta.stageDurationSec);
    setPhase('test');
    stageStartTimeRef.current = performance.now();
    spawnFlickTarget();
    setRunning(true);
    setBannerMessage('🎯 ด่าน 1/3: Flick & Micro-Adjust (ยิงเป้าสุ่มขนาดเล็ก)');
    setTimeout(() => setBannerMessage(null), 2500);
  }, [dpi, sens, currentModeMeta.stageDurationSec, spawnFlickTarget]);

  // Game Loop
  useEffect(() => {
    if (phase !== 'test' || !running) return;

    let lastFrameTime = performance.now();
    const stageDurationMs = currentModeMeta.stageDurationSec * 1000;

    const tick = () => {
      const now = performance.now();
      const dt = Math.max(0.001, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      const elapsed = now - stageStartTimeRef.current;
      const currentStage = stageRef.current;

      // ตรวจสอบการเปลี่ยนด่านตามเวลาโหมดที่เลือก
      if (elapsed >= stageDurationMs) {
        if (currentStage === 'flick') {
          transitionToStage('tracking');
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        if (currentStage === 'tracking') {
          transitionToStage('switching');
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        if (currentStage === 'switching') {
          finishAllStages();
          return;
        }
      }

      setTimeLeft(Math.max(1, Math.ceil((stageDurationMs - elapsed) / 1000)));

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx.fillStyle = '#0B0E14';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid background
      ctx.strokeStyle = 'rgba(38, 49, 69, 0.35)';
      ctx.lineWidth = 1;
      for (let x = 40; x < CANVAS_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 45; y < CANVAS_H; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }

      const cross = crosshairRef.current;
      const prevCross = prevCrosshairRef.current;

      // ด่าน 1: Flick & Micro-Adjust
      if (currentStage === 'flick') {
        const target = flickTargetRef.current;
        if (target && !target.hit) {
          const dist = Math.hypot(cross.x - target.x, cross.y - target.y);
          if (dist < target.minDistToCenter) target.minDistToCenter = dist;
          if (dist < target.radius * 2.5 && !target.firstProximityTime) {
            target.firstProximityTime = now;
          }
          if (dist < target.radius * 0.4) target.passedCenter = true;

          const pulse = 1 + Math.sin(now * 0.008) * 0.06;
          ctx.beginPath();
          ctx.arc(target.x, target.y, target.radius * 2 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 70, 85, 0.08)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 70, 85, 0.28)';
          ctx.fill();
          ctx.strokeStyle = '#FF4655';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }
      }

      // ด่าน 2: Smooth Tracking
      if (currentStage === 'tracking') {
        const t = (now - stageStartTimeRef.current) / 1000;
        const ttX = CANVAS_W / 2 + Math.sin(t * 1.5) * (CANVAS_W * 0.38) + Math.sin(t * 3.1) * 24;
        const ttY = CANVAS_H / 2 + Math.cos(t * 1.05) * (CANVAS_H * 0.24);
        const radius = 28;

        const dist = Math.hypot(cross.x - ttX, cross.y - ttY);
        const isOnTarget = dist <= radius;

        trackFrameCountRef.current += 1;
        if (isOnTarget) onTargetFramesRef.current += 1;

        const mouseSpeed = Math.hypot(cross.x - prevCross.x, cross.y - prevCross.y) / dt;
        const targetSpeed =
          Math.hypot(ttX - prevTargetPosRef.current.x, ttY - prevTargetPosRef.current.y) / dt;
        prevTargetPosRef.current = { x: ttX, y: ttY };

        if (isOnTarget) {
          const speedDiff = Math.abs(mouseSpeed - targetSpeed);
          const frameStability = Math.max(30, Math.min(100, 100 - speedDiff * 0.08));
          stabilitySamplesRef.current.push(frameStability);
        } else if (dist < radius * 2) {
          stabilitySamplesRef.current.push(55);
        }

        ctx.beginPath();
        ctx.arc(ttX, ttY, radius, 0, Math.PI * 2);
        ctx.fillStyle = isOnTarget ? 'rgba(52, 211, 153, 0.3)' : 'rgba(34, 211, 238, 0.16)';
        ctx.fill();
        ctx.strokeStyle = isOnTarget ? '#34D399' : '#22D3EE';
        ctx.lineWidth = isOnTarget ? 3 : 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ttX, ttY, radius * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = isOnTarget ? 'rgba(52, 211, 153, 0.8)' : 'rgba(34, 211, 238, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (isOnTarget) {
          ctx.fillStyle = '#34D399';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('LOCKED ON', ttX - 30, ttY - radius - 8);
        }
      }

      // ด่าน 3: Multi-Target Switch
      if (currentStage === 'switching') {
        const targets = switchTargetsRef.current;
        const activeIdx = activeSwitchIndexRef.current;

        for (let i = 0; i < targets.length; i += 1) {
          const tgt = targets[i];
          const isActive = i === activeIdx;

          if (isActive) {
            const pulse = 1 + Math.sin(now * 0.012) * 0.1;
            ctx.beginPath();
            ctx.arc(tgt.x, tgt.y, tgt.radius * 1.6 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(tgt.x, tgt.y, tgt.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 3;
            ctx.stroke();

            const bracketSize = tgt.radius + 6;
            ctx.strokeStyle = '#FDE68A';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tgt.x - bracketSize, tgt.y - bracketSize, bracketSize * 2, bracketSize * 2);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SHOOT', tgt.x, tgt.y + 4);
          } else {
            ctx.beginPath();
            ctx.arc(tgt.x, tgt.y, tgt.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(71, 85, 105, 0.18)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(tgt.label, tgt.x, tgt.y + 4);
          }
        }
      }

      // Particles
      const remainingParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 2.2;
        if (p.alpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
          ctx.globalAlpha = 1;
          remainingParticles.push(p);
        }
      }
      particlesRef.current = remainingParticles;

      // Floating Texts
      const remainingTexts: FloatingText[] = [];
      for (const ft of floatingTextsRef.current) {
        ft.y += ft.vy * dt;
        ft.alpha -= dt * 1.5;
        if (ft.alpha > 0) {
          ctx.fillStyle = ft.color;
          ctx.globalAlpha = Math.max(0, ft.alpha);
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.globalAlpha = 1;
          remainingTexts.push(ft);
        }
      }
      floatingTextsRef.current = remainingTexts;

      // HUD: แสดงตัวคูณ Sens จำลอง
      const sensMultiplier = sens > 0 ? (sens / 0.35).toFixed(2) : '1.00';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Sens Factor: ${sensMultiplier}x (0.35 = 1.0x)`, CANVAS_W - 12, CANVAS_H - 12);

      // วาดเป้าเล็ง Crosshair (+) ตามปลายเมาส์จริงทันที
      const isClicked = now - clickFeedbackRef.current < 90;
      const crosshairColor = isClicked ? '#F87171' : '#00FF66';
      const crossSize = isClicked ? 12 : 10;

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cross.x - crossSize, cross.y);
      ctx.lineTo(cross.x + crossSize, cross.y);
      ctx.moveTo(cross.x, cross.y - crossSize);
      ctx.lineTo(cross.x, cross.y + crossSize);
      ctx.stroke();

      ctx.strokeStyle = crosshairColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cross.x - crossSize, cross.y);
      ctx.lineTo(cross.x + crossSize, cross.y);
      ctx.moveTo(cross.x, cross.y - crossSize);
      ctx.lineTo(cross.x, cross.y + crossSize);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cross.x - 1, cross.y - 1, 2, 2);

      prevCrosshairRef.current = { x: cross.x, y: cross.y };
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, running, currentModeMeta.stageDurationSec, transitionToStage, finishAllStages, sens]);

  // ระบบควบคุมเมาส์และจำลองความไวจริงบน Canvas
  // คำนวณเป็นตัวคูณความเร็วของเป้า + เทียบกับศูนย์กลาง Canvas (เทียบมาตรฐาน Sens 0.35 = 1.0x)
  const updateCrosshairPos = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;

      // พิกัดเมาส์จริงบน Canvas
      const rawX = (clientX - rect.left) * scaleX;
      const rawY = (clientY - rect.top) * scaleY;

      // จำลองความเร็วตาม Sens จริงเทียบกับศูนย์กลาง Canvas (Sens 0.35 = 1.0x)
      const centerX = CANVAS_W / 2;
      const centerY = CANVAS_H / 2;
      const sensMultiplier = sens > 0 ? sens / 0.35 : 1.0;

      const simX = centerX + (rawX - centerX) * sensMultiplier;
      const simY = centerY + (rawY - centerY) * sensMultiplier;

      crosshairRef.current = {
        x: Math.max(0, Math.min(CANVAS_W, simX)),
        y: Math.max(0, Math.min(CANVAS_H, simY)),
      };
    },
    [sens]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      updateCrosshairPos(e.clientX, e.clientY);
    },
    [updateCrosshairPos]
  );

  // คลิกยิงเป้าหมาย
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== 'test') return;
      updateCrosshairPos(e.clientX, e.clientY);
      clickFeedbackRef.current = performance.now();
      const cross = crosshairRef.current;
      const currentStage = stageRef.current;
      const now = performance.now();

      // ด่าน 1: Flick
      if (currentStage === 'flick') {
        const target = flickTargetRef.current;
        if (!target) return;

        setFlickTotalShots((prev) => prev + 1);
        const dist = Math.hypot(cross.x - target.x, cross.y - target.y);

        if (dist <= target.radius) {
          target.hit = true;
          setFlickHits((prev) => prev + 1);

          const microTime = target.firstProximityTime
            ? Math.round(now - target.firstProximityTime)
            : Math.round(now - target.spawnTime);
          setMicroAdjustTimes((prev) => [...prev, Math.max(60, microTime)]);

          if (target.passedCenter && target.minDistToCenter < target.radius * 0.4) {
            setOvershoot((prev) => prev + 1);
            addFloatingText(target.x, target.y - 12, 'OVERSHOOT', '#FBBF24');
          } else {
            setUndershoot((prev) => prev + 1);
            addFloatingText(target.x, target.y - 12, '+HIT', '#34D399');
          }

          addParticles(target.x, target.y, '#FF4655', 16);
          spawnFlickTarget();
        } else {
          addFloatingText(cross.x, cross.y - 10, 'MISS', '#F87171');
        }
      }

      // ด่าน 3: Switch
      if (currentStage === 'switching') {
        const targets = switchTargetsRef.current;
        const activeIdx = activeSwitchIndexRef.current;
        const activeTarget = targets[activeIdx];
        if (!activeTarget) return;

        setSwitchTotalShots((prev) => prev + 1);
        const dist = Math.hypot(cross.x - activeTarget.x, cross.y - activeTarget.y);

        if (dist <= activeTarget.radius * 1.25) {
          setSwitchHits((prev) => prev + 1);
          addParticles(activeTarget.x, activeTarget.y, '#FBBF24', 18);

          const sweepDist = Math.hypot(
            activeTarget.x - lastSwitchPosRef.current.x,
            activeTarget.y - lastSwitchPosRef.current.y
          );
          const timeSec = Math.max(0.12, (now - lastSwitchTimeRef.current) / 1000);
          const speed = Math.round(sweepDist / timeSec);
          setSweepSpeeds((prev) => [...prev, speed]);
          addFloatingText(activeTarget.x, activeTarget.y - 15, `${speed} px/s`, '#FDE68A');

          lastSwitchPosRef.current = { x: activeTarget.x, y: activeTarget.y };
          lastSwitchTimeRef.current = now;

          const remainingIndices = [0, 1, 2].filter((i) => i !== activeIdx);
          const nextIdx =
            activeIdx === 0
              ? remainingIndices[1]
              : activeIdx === 2
              ? remainingIndices[0]
              : remainingIndices[Math.floor(Math.random() * remainingIndices.length)];

          activeSwitchIndexRef.current = nextIdx;
        } else {
          addFloatingText(cross.x, cross.y - 10, 'MISS', '#F87171');
        }
      }
    },
    [phase, updateCrosshairPos, spawnFlickTarget, addParticles, addFloatingText]
  );

  // คำนวณผลและเรียก AI วิเคราะห์อัตโนมัติเมื่อเข้าสู่หน้า result
  useEffect(() => {
    if (phase !== 'result') return;

    const initialAnalysis = generateAlgorithmicAnalysis(stats);
    setAiResult(initialAnalysis);

    let cancelled = false;
    setAiLoading(true);
    setAiError(null);

    requestSensAnalysis(stats)
      .then((res) => {
        if (!cancelled) setAiResult(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setAiError(err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อ AI ได้');
        }
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [phase, stats]);

  const handleReAnalyze = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await requestSensAnalysis(stats);
      setAiResult(res);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการวิเคราะห์');
    } finally {
      setAiLoading(false);
    }
  }, [stats]);

  const copyToClipboard = useCallback((val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const edpiNow = calcEdpi(dpi, sens);
  const cm360Now = dpi > 0 && sens > 0 ? calcCm360(dpi, sens) : 0;
  const calculated = useMemo(() => calculateRecommendedSens(stats), [stats]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin bg-[#0B0E14] p-4 lg:p-6 text-[#F1F5F9]">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-[#F1F5F9]">
              🎯 AI Sens &amp; DPI Finder (3 ด่านต่อเนื่อง)
            </h1>
            <span className="border border-[#FBBF24]/50 bg-[#FBBF24]/10 px-2 py-0.5 text-[10px] font-bold text-[#FBBF24]">
              VCT Pro Aim Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-[#94A3B8]">
            ทดสอบ 3 ด่านต่อเนื่อง (Flick &bull; Tracking &bull; Switch) พร้อมระบบจำลองความไวจริงบน Canvas เพื่อหา Sens ที่เหมาะสมที่สุด
          </p>
        </div>

        {/* ขั้นตอน 1: Setup แบบรวดเร็ว (เฉพาะ DPI, Sens และเลือกระดับเวลา) */}
        <section className="space-y-4 border border-[#263145] bg-[#111620] p-4 lg:p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#FBBF24]">
            <MousePointer2 className="h-4 w-4" />
            ขั้นตอน 1 · ตั้งค่าเริ่มต้น (Setup แบบรวดเร็ว)
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#CBD5E1]">DPI ปัจจุบันของเมาส์</span>
              <input
                type="number"
                min={100}
                max={3200}
                step={50}
                value={dpiInput}
                disabled={phase === 'test'}
                onChange={(e) => setDpiInput(e.target.value)}
                placeholder="เช่น 800 หรือ 1600"
                className="w-full border border-[#263145] bg-[#0B0E14] px-3.5 py-2.5 text-sm font-medium text-[#F1F5F9] focus:border-[#FF4655] focus:outline-none disabled:opacity-50"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#CBD5E1]">Sens ในเกม Valorant ปัจจุบัน</span>
              <input
                type="number"
                min={0.05}
                max={3}
                step={0.01}
                value={sensInput}
                disabled={phase === 'test'}
                onChange={(e) => setSensInput(e.target.value)}
                placeholder="เช่น 0.35"
                className="w-full border border-[#263145] bg-[#0B0E14] px-3.5 py-2.5 text-sm font-medium text-[#F1F5F9] focus:border-[#FF4655] focus:outline-none disabled:opacity-50"
              />
            </label>
          </div>

          {dpi > 0 && sens > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] border-t border-[#263145] pt-2.5">
              <span>
                eDPI ปัจจุบัน: <strong className="text-[#CBD5E1]">{edpiNow}</strong>
              </span>
              <span>
                cm/360: <strong className="text-[#CBD5E1]">{cm360Now} ซม.</strong>
              </span>
              <span>
                ตัวคูณจำลองบน Canvas:{' '}
                <strong className="text-[#34D399]">{(sens / 0.35).toFixed(2)}x</strong> (เทียบเคียง Sens 0.35 = 1.0x)
              </span>
            </div>
          )}

          {/* ปุ่มเลือกระดับเวลาการเทส 3 ระดับ */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-[#CBD5E1]">เลือกระดับเวลาการทดสอบ</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(TEST_MODES) as TestMode[]).map((modeKey) => {
                const meta = TEST_MODES[modeKey];
                const isSelected = selectedMode === modeKey;
                return (
                  <button
                    key={modeKey}
                    type="button"
                    disabled={phase === 'test'}
                    onClick={() => setSelectedMode(modeKey)}
                    className={`flex flex-col items-start p-3 border text-left transition-all disabled:opacity-50 ${
                      isSelected
                        ? 'border-[#FBBF24] bg-[#FBBF24]/10 shadow-sm'
                        : 'border-[#263145] bg-[#0B0E14] hover:border-[#475569]'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#FBBF24]' : 'text-[#F1F5F9]'}`}>
                        {meta.label}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-[#FBBF24]/20 text-[#FBBF24]'
                            : 'bg-[#263145] text-[#94A3B8]'
                        }`}
                      >
                        {meta.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">{meta.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ขั้นตอน 2: มินิเกม 3 ด่านต่อเนื่อง */}
        <section className="space-y-3 border border-[#263145] bg-[#111620] p-4 lg:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#FBBF24]">
              <Timer className="h-4 w-4" />
              ขั้นตอน 2 · มินิเกมทดสอบ 3 ด่านต่อเนื่อง (โหมด {currentModeMeta.label})
            </h2>
            {phase === 'test' && (
              <span className="flex items-center gap-1.5 border border-[#34D399]/40 bg-[#34D399]/10 px-2 py-0.5 text-xs font-bold text-[#34D399]">
                <Activity className="h-3 w-3 animate-pulse" />
                {stage === 'flick' ? 'ด่าน 1 Flick' : stage === 'tracking' ? 'ด่าน 2 Tracking' : 'ด่าน 3 Switch'} ({timeLeft}s)
              </span>
            )}
          </div>

          {phase === 'setup' && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="border border-[#263145] bg-[#0B0E14] p-3">
                  <div className="text-xs font-bold text-[#FF4655]">
                    ด่าน 1 ({currentModeMeta.stageDurationSec}s) · Flick &amp; Micro-Adjust
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                    ยิงเป้าสุ่มขนาดเล็ก วัดค่า Overshoot %, Undershoot % และเวลาแก้เป้า
                  </div>
                </div>
                <div className="border border-[#263145] bg-[#0B0E14] p-3">
                  <div className="text-xs font-bold text-[#22D3EE]">
                    ด่าน 2 ({currentModeMeta.stageDurationSec}s) · Smooth Tracking
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                    เลี้ยงเป้าตามวงกลมเคลื่อนที่ซ้าย-ขวา วัด Time on Target (%) และความนิ่ง
                  </div>
                </div>
                <div className="border border-[#263145] bg-[#0B0E14] p-3">
                  <div className="text-xs font-bold text-[#FBBF24]">
                    ด่าน 3 ({currentModeMeta.stageDurationSec}s) · Multi-Target Switch
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                    ยิงเป้าสลับซ้าย-กลาง-ขวา วัดความเร็วกวาดเมาส์ (Sweep Speed)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={startTest}
                disabled={dpi < 100 || sens <= 0}
                className="flex items-center gap-2 bg-[#FF4655] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#E03545] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Crosshair className="h-4 w-4" />
                เริ่มทดสอบ 3 ด่านต่อเนื่อง ({currentModeMeta.totalDurationSec} วินาที)
              </button>
            </div>
          )}

          {phase === 'test' && (
            <div className="space-y-2">
              {/* แถบสถานะ 3 ด่าน */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div
                  className={`border py-1.5 font-bold transition-all ${
                    stage === 'flick'
                      ? 'border-[#FF4655] bg-[#FF4655]/20 text-[#FF4655]'
                      : 'border-[#263145] bg-[#0B0E14] text-[#64748B]'
                  }`}
                >
                  ด่าน 1: Flick
                </div>
                <div
                  className={`border py-1.5 font-bold transition-all ${
                    stage === 'tracking'
                      ? 'border-[#22D3EE] bg-[#22D3EE]/20 text-[#22D3EE]'
                      : 'border-[#263145] bg-[#0B0E14] text-[#64748B]'
                  }`}
                >
                  ด่าน 2: Tracking
                </div>
                <div
                  className={`border py-1.5 font-bold transition-all ${
                    stage === 'switching'
                      ? 'border-[#FBBF24] bg-[#FBBF24]/20 text-[#FBBF24]'
                      : 'border-[#263145] bg-[#0B0E14] text-[#64748B]'
                  }`}
                >
                  ด่าน 3: Switch
                </div>
              </div>

              {bannerMessage && (
                <div className="border border-[#FBBF24]/60 bg-[#FBBF24]/15 px-3 py-1.5 text-center text-xs font-bold text-[#FBBF24] animate-pulse">
                  {bannerMessage}
                </div>
              )}

              {/* Canvas พร้อม cursor: none และระบบจำลองความไวจริง */}
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseMove}
                onClick={handleCanvasClick}
                className="w-full cursor-none border border-[#263145] bg-[#0B0E14]"
                style={{ cursor: 'none' }}
                aria-label="พื้นที่ทดสอบมินิเกมเล็งเป้า"
              />

              <div className="flex flex-wrap items-center justify-between text-xs text-[#94A3B8]">
                <span>
                  {stage === 'flick' && `ยิงเป้าสุ่มขนาดเล็ก | โดน: ${flickHits} | แม่น: ${stats.flickAccuracyPct}%`}
                  {stage === 'tracking' && `เลี้ยงเป้าตามการเคลื่อนที่ | เกาะเป้า: ${stats.trackingPct}% | ความนิ่ง: ${stats.stabilityScore}%`}
                  {stage === 'switching' && `กวาดเมาส์ยิงเป้า ACTIVE สีส้ม | โดน: ${switchHits} เป้า`}
                </span>
                <span className="font-mono-tabular font-bold text-[#F1F5F9]">
                  เวลาคงเหลือของด่านนี้: <span className="text-[#FBBF24]">{timeLeft}s</span>
                </span>
              </div>
            </div>
          )}

          {phase === 'result' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {/* ด่าน 1 */}
                <div className="border border-[#FF4655]/40 bg-[#0B0E14] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FF4655]">ด่าน 1: Flick</span>
                    <span className="text-[10px] text-[#94A3B8]">Micro-Adjust</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                    <div className="border border-[#263145] bg-[#111620] p-1.5">
                      <div className="font-mono-tabular text-sm font-bold text-[#F1F5F9]">
                        {stats.flickAccuracyPct}%
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">แม่นยำ ({stats.flickHits}/{stats.flickTotalShots})</div>
                    </div>
                    <div className="border border-[#263145] bg-[#111620] p-1.5">
                      <div className="font-mono-tabular text-sm font-bold text-[#F1F5F9]">
                        {stats.avgMicroAdjustMs}ms
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">เวลาแก้เป้า</div>
                    </div>
                    <div className="border border-[#263145] bg-[#111620] p-1.5">
                      <div className="font-mono-tabular text-sm font-bold text-[#F87171]">
                        {stats.overshootPct}%
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">Overshoot (เกิน)</div>
                    </div>
                    <div className="border border-[#263145] bg-[#111620] p-1.5">
                      <div className="font-mono-tabular text-sm font-bold text-[#38BDF8]">
                        {stats.undershootPct}%
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">Undershoot (ไม่ถึง)</div>
                    </div>
                  </div>
                </div>

                {/* ด่าน 2 */}
                <div className="border border-[#22D3EE]/40 bg-[#0B0E14] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#22D3EE]">ด่าน 2: Tracking</span>
                    <span className="text-[10px] text-[#94A3B8]">Smoothness</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                    <div className="border border-[#263145] bg-[#111620] p-1.5">
                      <div className="font-mono-tabular text-sm font-bold text-[#34D399]">
                        {stats.trackingPct}%
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">Time on Target</div>
                    </div>
                    <div className="border border-[#263145] bg-[#111620] p-1.5">
                      <div className="font-mono-tabular text-sm font-bold text-[#22D3EE]">
                        {stats.stabilityScore}%
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">ความนิ่ง (Stability)</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-[#64748B]">
                    วัดจากความเนียนในการเลี้ยงเป้าตามวงกลมเคลื่อนที่
                  </p>
                </div>

                {/* ด่าน 3 */}
                <div className="border border-[#FBBF24]/40 bg-[#0B0E14] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FBBF24]">ด่าน 3: Switch</span>
                    <span className="text-[10px] text-[#94A3B8]">Sweep Speed</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                    <div className="border border-[#263145] bg-[#111620] p-1.5">
                      <div className="font-mono-tabular text-sm font-bold text-[#FBBF24]">
                        {stats.sweepSpeedPxPerSec}
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">Sweep (px/s)</div>
                    </div>
                    <div className="border border-[#263145] bg-[#111620] p-1.5">
                      <div className="font-mono-tabular text-sm font-bold text-[#F1F5F9]">
                        {stats.switchTargetsHit} เป้า
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">เป้าที่กวาดโดน</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-[#64748B]">
                    ความแม่นยำขณะกวาดสลับเป้า: {stats.switchAccuracyPct}%
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startTest}
                className="border border-[#263145] bg-[#171E2B] px-4 py-2 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#FF4655] hover:text-[#F1F5F9]"
              >
                🔄 ทดสอบ 3 ด่านใหม่อีกครั้ง
              </button>
            </div>
          )}
        </section>

        {/* ขั้นตอน 3: สรุปผลลัพธ์และวิเคราะห์โดย AI */}
        {phase === 'result' && (
          <section className="space-y-4 border border-[#FBBF24]/50 bg-[#111620] p-4 lg:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#263145] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#FBBF24] flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    ขั้นตอน 3 · ผลวิเคราะห์ Sens &amp; DPI ที่เหมาะสมที่สุด
                  </h2>
                  <span className="border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-2 py-0.5 text-[10px] font-bold text-[#FBBF24]">
                    โหมด {currentModeMeta.label}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  วิเคราะห์จากสถิติจริงทั้ง 3 ด่าน + เวลาทดสอบ {currentModeMeta.totalDurationSec} วินาที ด้วย Gemini 3.8 Flash
                </p>
              </div>

              {/* Confidence Score Badge */}
              <div className="flex items-center gap-2 border border-[#34D399]/40 bg-[#34D399]/10 px-3 py-1.5">
                <ShieldCheck className="h-4 w-4 text-[#34D399]" />
                <div className="text-left">
                  <div className="text-[10px] font-medium text-[#94A3B8]">Confidence Score</div>
                  <div className="text-xs font-bold text-[#34D399]">
                    ความแม่นยำการประเมิน {aiResult?.confidenceScore ?? calculated.confidenceScore}%
                  </div>
                </div>
              </div>
            </div>

            {/* การ์ดค่าที่แนะนำหลัก */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-[#34D399]/60 bg-[#34D399]/10 p-3.5 text-center">
                <div className="text-[11px] font-semibold text-[#94A3B8]">Sens ที่แนะนำสำหรับ DPI {dpi}</div>
                <div className="font-mono-tabular text-3xl font-bold text-[#34D399]">
                  {aiResult?.recommendedSens ?? calculated.recommendedSens}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(aiResult?.recommendedSens ?? calculated.recommendedSens, 'main')
                  }
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#34D399] hover:underline"
                >
                  {copiedKey === 'main' ? (
                    <>
                      <Check className="h-3 w-3" /> คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> คัดลอกค่านี้
                    </>
                  )}
                </button>
              </div>

              <div className="border border-[#22D3EE]/60 bg-[#22D3EE]/10 p-3.5 text-center">
                <div className="text-[11px] font-semibold text-[#94A3B8]">eDPI ที่แนะนำ</div>
                <div className="font-mono-tabular text-3xl font-bold text-[#22D3EE]">
                  {aiResult?.recommendedEdpi ?? calculated.recommendedEdpi}
                </div>
                <div className="mt-1 text-[11px] text-[#94A3B8]">
                  เดิม: <span className="text-[#F1F5F9]">{edpiNow}</span>
                </div>
              </div>

              <div className="border border-[#FBBF24]/60 bg-[#FBBF24]/10 p-3.5 text-center">
                <div className="text-[11px] font-semibold text-[#94A3B8]">ระยะหมุน 360&deg; (cm/360)</div>
                <div className="font-mono-tabular text-3xl font-bold text-[#FBBF24]">
                  {aiResult?.cm360 ?? calculated.cm360} ซม.
                </div>
                <div className="mt-1 text-[11px] text-[#94A3B8]">ระยะลากเมาส์ 1 รอบตัว</div>
              </div>
            </div>

            {/* ทางเลือก DPI: 800 DPI vs 1600 DPI */}
            <div className="space-y-2 border border-[#263145] bg-[#0B0E14] p-3.5">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                <Gauge className="h-4 w-4 text-[#FBBF24]" />
                ทางเลือกการตั้งค่าตาม DPI มาตรฐาน (800 / 1600 DPI)
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between border border-[#263145] bg-[#111620] p-3">
                  <div>
                    <div className="text-xs font-bold text-[#F1F5F9]">หากใช้เมาส์ 800 DPI</div>
                    <div className="mt-1 text-xs text-[#94A3B8]">
                      ตั้ง Sens ในเกม:{' '}
                      <span className="font-mono-tabular text-sm font-bold text-[#34D399]">
                        {aiResult?.sensAt800 ?? calculated.sensAt800}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(aiResult?.sensAt800 ?? calculated.sensAt800, '800')
                    }
                    className="flex items-center gap-1 border border-[#263145] bg-[#171E2B] px-2.5 py-1.5 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#34D399] hover:text-[#34D399]"
                  >
                    {copiedKey === '800' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    คัดลอก
                  </button>
                </div>

                <div className="flex items-center justify-between border border-[#34D399]/40 bg-[#111620] p-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
                      หากใช้เมาส์ 1600 DPI
                      <span className="bg-[#34D399]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#34D399]">
                        แนะนำ (Sensor Latency ต่ำกว่า)
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-[#94A3B8]">
                      ตั้ง Sens ในเกม:{' '}
                      <span className="font-mono-tabular text-sm font-bold text-[#34D399]">
                        {aiResult?.sensAt1600 ?? calculated.sensAt1600}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(aiResult?.sensAt1600 ?? calculated.sensAt1600, '1600')
                    }
                    className="flex items-center gap-1 border border-[#34D399]/50 bg-[#171E2B] px-2.5 py-1.5 text-xs font-semibold text-[#34D399] transition-colors hover:bg-[#34D399]/20"
                  >
                    {copiedKey === '1600' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    คัดลอก
                  </button>
                </div>
              </div>
            </div>

            {/* การวิเคราะห์จุดเด่น-จุดด้อย และคำแนะนำสไตล์โค้ช */}
            {aiResult && (
              <div className="space-y-3 pt-1">
                <div className="rounded border border-[#263145] bg-[#0B0E14] p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-[#FBBF24]">
                      <Zap className="h-4 w-4" />
                      บทสรุปภาพรวมจากโค้ช AI
                    </span>
                    {aiLoading && (
                      <span className="flex items-center gap-1 text-[11px] text-[#FBBF24] animate-pulse">
                        <Wand2 className="h-3 w-3 animate-spin" />
                        AI กำลังปรับปรุงผลวิเคราะห์...
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#F1F5F9]">{aiResult.headline}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* จุดเด่น */}
                  <div className="space-y-2 border border-[#34D399]/40 bg-[#0B0E14] p-3.5">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#34D399]">
                      <ShieldCheck className="h-4 w-4" />
                      จุดเด่นของคุณ (Strengths)
                    </h4>
                    <ul className="space-y-1.5">
                      {aiResult.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-[#CBD5E1]">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34D399]" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* จุดด้อย */}
                  <div className="space-y-2 border border-[#F87171]/40 bg-[#0B0E14] p-3.5">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F87171]">
                      <AlertCircle className="h-4 w-4" />
                      จุดที่ต้องปรับแก้ (Areas to Improve)
                    </h4>
                    <ul className="space-y-1.5">
                      {aiResult.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-[#CBD5E1]">
                          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F87171]" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* คำแนะนำวิธีปรับตัวแบบโค้ชมืออาชีพ */}
                <div className="space-y-2 border border-[#FBBF24]/40 bg-[#0B0E14] p-3.5">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
                    <TrendingUp className="h-4 w-4" />
                    วิธีปรับตัวและแผนฝึกซ้อมแบบโค้ชมืออาชีพ (Pro Tips)
                  </h4>
                  <ul className="space-y-2">
                    {aiResult.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 border-l-2 border-[#FBBF24] pl-2.5 text-xs leading-relaxed text-[#CBD5E1]"
                      >
                        <span className="font-mono font-bold text-[#FBBF24]">{i + 1}.</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {aiError && (
              <div className="border border-[#F87171]/50 bg-[#F87171]/10 px-3 py-2 text-xs text-[#FCA5A5]">
                {aiError} (แสดงผลด้วยสูตรคำนวณสถิติแม่นยำแทน)
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="border border-[#263145] bg-[#171E2B] px-4 py-2 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#FF4655] hover:text-[#F1F5F9]"
              >
                เริ่มทดสอบใหม่ตั้งแต่ต้น
              </button>
              <button
                type="button"
                onClick={handleReAnalyze}
                disabled={aiLoading}
                className="flex items-center gap-1.5 bg-[#FBBF24] px-4 py-2 text-xs font-bold text-[#0B0E14] transition-colors hover:bg-[#D97706] disabled:opacity-50"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {aiLoading ? 'AI กำลังวิเคราะห์...' : 'ให้ Gemini AI วิเคราะห์ซ้ำ'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
