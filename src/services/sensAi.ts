export type TestMode = 'quick' | 'standard' | 'pro';

export interface TestModeMeta {
  id: TestMode;
  label: string;
  stageDurationSec: number;
  totalDurationSec: number;
  description: string;
  badge: string;
}

export const TEST_MODES: Record<TestMode, TestModeMeta> = {
  quick: {
    id: 'quick',
    label: 'Quick (45 วิ)',
    stageDurationSec: 15,
    totalDurationSec: 45,
    description: 'ด่านละ 15 วินาที · เช็กด่วนระหว่างรอคิว',
    badge: 'เช็กด่วน',
  },
  standard: {
    id: 'standard',
    label: 'Standard (90 วิ)',
    stageDurationSec: 30,
    totalDurationSec: 90,
    description: 'ด่านละ 30 วินาที · ค่าเริ่มต้น — แนะนำ',
    badge: 'แนะนำ',
  },
  pro: {
    id: 'pro',
    label: 'Pro (135 วิ)',
    stageDurationSec: 45,
    totalDurationSec: 135,
    description: 'ด่านละ 45 วินาที · วิเคราะห์ละเอียด วัดความนิ่งระยะยาว',
    badge: 'แม่นยำสูงสุด',
  },
};

export interface SensTestStats {
  dpi: number;
  currentSens: number;
  testMode: TestMode;
  testDurationSeconds: number;

  // Stage 1: Flick & Micro-Adjust
  flickAccuracyPct: number;
  overshootPct: number;
  undershootPct: number;
  avgMicroAdjustMs: number;
  flickHits: number;
  flickTotalShots: number;

  // Stage 2: Smooth Tracking
  trackingPct: number; // Time on Target (%)
  stabilityScore: number; // Hand stability (0-100)

  // Stage 3: Multi-Target Switch
  sweepSpeedPxPerSec: number; // Sweep speed (px/s)
  switchAccuracyPct: number;
  switchTargetsHit: number;
  switchTotalShots: number;
}

export interface SensAiResult {
  recommendedSens: string;
  recommendedEdpi: string;
  sensAt800: string;
  sensAt1600: string;
  cm360: string;
  confidenceScore: number; // ระดับความแม่นยำ % (เช่น 92-98%)
  headline: string;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
}

const SENS_TIMEOUT_MS = 20_000;
const GEMINI_MODEL = 'gemini-3.8-flash';

export function calcEdpi(dpi: number, sens: number): number {
  return Math.round(dpi * sens * 100) / 100;
}

export function calcCm360(dpi: number, sens: number): number {
  if (sens <= 0 || dpi <= 0) return 0;
  return Math.round((13062.86 / (sens * dpi)) * 10) / 10;
}

/**
 * คำนวณค่า Sens, eDPI และทางเลือกสำหรับ 800 / 1600 DPI
 * อิงตามสถิติจริงจากทั้ง 3 ด่าน (Flick, Tracking, Switch) + ระดับเวลาที่เลือก
 */
export function calculateRecommendedSens(stats: SensTestStats): {
  recommendedSens: string;
  recommendedEdpi: string;
  sensAt800: string;
  sensAt1600: string;
  cm360: string;
  confidenceScore: number;
} {
  const currentEdpi = calcEdpi(stats.dpi, stats.currentSens);
  let targetEdpi = currentEdpi > 0 ? currentEdpi : 280;

  // 1. ชดเชยค่า Overshoot vs Undershoot จากด่าน 1
  const netShootDiff = stats.overshootPct - stats.undershootPct;
  if (netShootDiff > 12) {
    // ลากเลยเป้าบ่อย (Overshoot) -> Sens ไวเกินการหยุดยิง -> ปรับลดลง 5% ถึง 18%
    const reduction = Math.min(0.18, (netShootDiff / 100) * 0.28);
    targetEdpi *= 1 - reduction;
  } else if (netShootDiff < -12) {
    // ลากไม่ถึงเป้าบ่อย (Undershoot) -> Sens หน่วงไป -> ปรับเพิ่มขึ้น 5% ถึง 18%
    const increase = Math.min(0.18, (Math.abs(netShootDiff) / 100) * 0.28);
    targetEdpi *= 1 + increase;
  }

  // 2. ปรับตามความนิ่งของมือและการเลี้ยงเป้า (Tracking & Stability) จากด่าน 2
  if (stats.stabilityScore < 60 && targetEdpi > 240) {
    targetEdpi *= 0.93; // มือสั่นหรือเป้ากระตุก ลด Sens เพื่อความเสถียร
  } else if (stats.stabilityScore >= 85 && stats.trackingPct >= 75) {
    if (stats.undershootPct > 35) targetEdpi *= 1.05; // ควบคุมได้นิ่งมาก เพิ่มความคล่องตัวได้
  }

  // 3. ปรับตาม Sweep Speed จากด่าน 3
  if (stats.sweepSpeedPxPerSec < 750 && targetEdpi < 260) {
    targetEdpi *= 1.06;
  } else if (stats.sweepSpeedPxPerSec > 1600 && stats.switchAccuracyPct < 60) {
    targetEdpi *= 0.94; // กวาดไวเกินไปจนสะบัดหลุด ลด Sens เพื่อเพิ่มความแม่นยำ
  }

  // 4. บีบให้อยู่ในกรอบมาตรฐานการแข่งขัน Valorant Pro (180 - 320 eDPI)
  targetEdpi = Math.max(180, Math.min(320, Math.round(targetEdpi)));

  const safeDpi = stats.dpi > 0 ? stats.dpi : 800;
  const recommendedSensNum = Math.round((targetEdpi / safeDpi) * 1000) / 1000;
  const sensAt800Num = Math.round((targetEdpi / 800) * 1000) / 1000;
  const sensAt1600Num = Math.round((targetEdpi / 1600) * 1000) / 1000;
  const cm360Str = String(calcCm360(safeDpi, recommendedSensNum));

  // 5. คำนวณ Confidence Score (ระดับความแม่นยำตามระยะเวลาการเทสและปริมาณข้อมูล)
  let baseConfidence = 90; // Standard mode default
  if (stats.testMode === 'pro') baseConfidence = 96;
  else if (stats.testMode === 'quick') baseConfidence = 84;

  const totalShots = stats.flickTotalShots + stats.switchTotalShots;
  if (totalShots >= 35) baseConfidence += 2;
  if (stats.stabilityScore >= 75) baseConfidence += 1;
  const confidenceScore = Math.min(99, Math.max(78, baseConfidence));

  return {
    recommendedSens: recommendedSensNum.toFixed(3),
    recommendedEdpi: String(targetEdpi),
    sensAt800: sensAt800Num.toFixed(3),
    sensAt1600: sensAt1600Num.toFixed(3),
    cm360: cm360Str,
    confidenceScore,
  };
}

/**
 * สร้างผลวิเคราะห์ทางคณิตศาสตร์ทันที (Fallback กรณีไม่มีคีย์หรือเน็ตมีปัญหา)
 */
export function generateAlgorithmicAnalysis(stats: SensTestStats): SensAiResult {
  const calc = calculateRecommendedSens(stats);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const tips: string[] = [];

  if (stats.flickAccuracyPct >= 70) {
    strengths.push(`Flick เข้าเป้าแม่นยำ ${stats.flickAccuracyPct}% สแนปเป้าหมายได้เฉียบคม`);
  }
  if (stats.trackingPct >= 65) {
    strengths.push(`เกาะเป้า Tracking ได้เสถียร ${stats.trackingPct}% ควบคุมการเคลื่อนไหวได้ดี`);
  }
  if (stats.stabilityScore >= 75) {
    strengths.push(`ความนิ่งของมือดีเยี่ยม (Stability ${stats.stabilityScore}%) กล้ามเนื้อไม่สั่นกระตุก`);
  }
  if (stats.sweepSpeedPxPerSec >= 1050) {
    strengths.push(`ความเร็วในการกวาดเมาส์สูง (${stats.sweepSpeedPxPerSec} px/s) สลับมุมยิงได้ฉับไว`);
  }
  if (strengths.length === 0) {
    strengths.push('ควบคุมจังหวะการเล็งพื้นฐานได้สม่ำเสมอ พร้อมปรับ Muscle Memory เข้าหา Sens ใหม่');
  }

  if (stats.overshootPct >= 50) {
    weaknesses.push(`มีอาการลากเลยเป้า (Overshoot ${stats.overshootPct}%) บ่งบอกว่า Sens เดิมสูงเกินแรงเบรก`);
  }
  if (stats.undershootPct >= 50) {
    weaknesses.push(`ลากไม่ถึงเป้า (Undershoot ${stats.undershootPct}%) ต้องออกแรงแก้เมาส์ซ้ำสองจังหวะ`);
  }
  if (stats.avgMicroAdjustMs > 175) {
    weaknesses.push(`เวลาแก้เป้า Micro-adjust ช้า (${stats.avgMicroAdjustMs}ms) อาจเสียเปรียบในการดวล First-shot`);
  }
  if (stats.stabilityScore < 65) {
    weaknesses.push(`ความนิ่งของมือแกว่ง (${stats.stabilityScore}%) มีการกระตุกเล็กน้อยระหว่างตามเป้า`);
  }
  if (weaknesses.length === 0) {
    weaknesses.push('การกวาดเมาส์มุมกว้างยังมีพื้นที่ให้เพิ่มสปีดและความแม่นยำได้อีกระดับ');
  }

  tips.push(
    `ปรับมาใช้ Sens แนะนำ ${calc.recommendedSens} (eDPI ${calc.recommendedEdpi}) เพื่อสมดุลการหยุดเป้าและสะบัดยิง`
  );
  tips.push(
    `แนะนำให้เลือกใช้ 1600 DPI (Sens ${calc.sensAt1600}) เพื่อลด Sensor Input Latency ของเมาส์ให้ลื่นไหลสูงสุด`
  );
  tips.push('วอร์มมือใน The Range โหมด 50 เป้าหมาย เน้นความแม่นยำ 100% โดยไม่เร่งสะบัด 10 นาทีก่อนลงแรงก์');
  tips.push('เล่น Deathmatch 2-3 แมตช์ต่อวัน เพื่อให้กล้ามเนื้อจดจำระยะลากของ Sens ใหม่ภายใน 3 วัน');

  const headline =
    stats.overshootPct > stats.undershootPct + 15
      ? `ลด Sens ลงเป็น ${calc.recommendedSens} เพื่อแก้ปัญหาลากเลยเป้า (Overshoot) และเพิ่มพลังหยุดยิง`
      : stats.undershootPct > stats.overshootPct + 15
      ? `เพิ่ม Sens เล็กน้อยเป็น ${calc.recommendedSens} เพื่อให้เข้าเป้าทันท่วงทีและลดอาการเกร็งมือ`
      : `ค่า Sens ${calc.recommendedSens} (eDPI ${calc.recommendedEdpi}) มีสมดุลที่ลงตัวที่สุดกับสไตล์การเล็งของคุณ`;

  return {
    ...calc,
    headline,
    strengths,
    weaknesses,
    tips,
  };
}

function buildPrompt(input: SensTestStats): string {
  const edpi = calcEdpi(input.dpi, input.currentSens);
  const calc = calculateRecommendedSens(input);
  const modeMeta = TEST_MODES[input.testMode];

  return [
    `คุณคือโค้ช Aim ประจำทีม Valorant VCT วิเคราะห์สถิติจริง 3 ด่านของนักกีฬา:`,
    `- ข้อมูลปัจจุบัน: DPI ${input.dpi}, Sens ${input.currentSens} (eDPI ${edpi})`,
    `- ระดับเวลาทดสอบ: โหมด ${modeMeta.label} (รวม ${modeMeta.totalDurationSec} วินาที)`,
    `- ด่าน 1 (Flick & Micro-Adjust): แม่นยำ ${input.flickAccuracyPct}%, Overshoot ${input.overshootPct}%, Undershoot ${input.undershootPct}%, เวลาแก้เป้า ${input.avgMicroAdjustMs}ms (${input.flickHits}/${input.flickTotalShots} เป้า)`,
    `- ด่าน 2 (Smooth Tracking): เกาะเป้า Time on Target ${input.trackingPct}%, ความนิ่งของมือ Stability ${input.stabilityScore}%`,
    `- ด่าน 3 (Multi-Target Switch): ความเร็วกวาด Sweep Speed ${input.sweepSpeedPxPerSec} px/s, แม่นยำ ${input.switchAccuracyPct}% (${input.switchTargetsHit} เป้า)`,
    `- ผลคำนวณเบื้องต้น: Sens แนะนำ ${calc.recommendedSens} (eDPI ${calc.recommendedEdpi}), ตัวเลือก 800 DPI คือ ${calc.sensAt800}, ตัวเลือก 1600 DPI คือ ${calc.sensAt1600}, cm/360 ${calc.cm360} cm, Confidence Score ${calc.confidenceScore}%`,
    `จงตอบกลับด้วย JSON ภาษาไทยเท่านั้น ตามโครงสร้างนี้:`,
    `{`,
    `  "headline": "สรุปผลลัพธ์และคำแนะนำภาพรวมใน 1 ประโยคชัดเจน",`,
    `  "confidenceScore": ${calc.confidenceScore},`,
    `  "recommendedSens": "${calc.recommendedSens}",`,
    `  "recommendedEdpi": "${calc.recommendedEdpi}",`,
    `  "sensAt800": "${calc.sensAt800}",`,
    `  "sensAt1600": "${calc.sensAt1600}",`,
    `  "cm360": "${calc.cm360}",`,
    `  "strengths": ["จุดเด่นข้อที่ 1 ที่ตรวจพบจาก 3 ด่าน", "จุดเด่นข้อที่ 2"],`,
    `  "weaknesses": ["จุดด้อยที่ต้องปรับแก้", "จุดที่ทำให้เสียเปรียบในการดวล"],`,
    `  "tips": ["คำแนะนำฝึกซ้อมเพื่อปรับตัวเข้าหา Sens ใหม่", "ข้อแนะนำการเลือก DPI", "ทริคการจับเมาส์หรือฝึกใน The Range"]`,
    `}`,
    `ตอบเฉพาะ JSON ล้วน ห้ามมีข้อความอื่นนอก JSON`,
  ].join('\n');
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function parseSensResponse(rawText: string, fallback: SensAiResult): SensAiResult {
  let jsonStr = rawText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }
  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart === -1 || braceEnd === -1) {
    return fallback;
  }
  jsonStr = jsonStr.slice(braceStart, braceEnd + 1);

  try {
    const data = JSON.parse(jsonStr) as Record<string, unknown>;
    const strengths = Array.isArray(data.strengths)
      ? data.strengths.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : fallback.strengths;
    const weaknesses = Array.isArray(data.weaknesses)
      ? data.weaknesses.filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
      : fallback.weaknesses;
    const tips = Array.isArray(data.tips)
      ? data.tips.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : fallback.tips;

    const conf =
      typeof data.confidenceScore === 'number' && Number.isFinite(data.confidenceScore)
        ? Math.min(99, Math.max(70, Math.round(data.confidenceScore)))
        : fallback.confidenceScore;

    return {
      recommendedSens: asString(data.recommendedSens, fallback.recommendedSens),
      recommendedEdpi: asString(data.recommendedEdpi, fallback.recommendedEdpi),
      sensAt800: asString(data.sensAt800, fallback.sensAt800),
      sensAt1600: asString(data.sensAt1600, fallback.sensAt1600),
      cm360: asString(data.cm360, fallback.cm360),
      confidenceScore: conf,
      headline: asString(data.headline, fallback.headline),
      strengths: strengths.length > 0 ? strengths : fallback.strengths,
      weaknesses: weaknesses.length > 0 ? weaknesses : fallback.weaknesses,
      tips: tips.length > 0 ? tips : fallback.tips,
    };
  } catch {
    return fallback;
  }
}

export async function requestSensAnalysis(input: SensTestStats): Promise<SensAiResult> {
  const fallback = generateAlgorithmicAnalysis(input);

  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return fallback;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
    apiKey.trim()
  )}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SENS_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(input) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.35,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!res.ok) {
      return fallback;
    }

    const payload = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const rawText =
      payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (!rawText.trim()) {
      return fallback;
    }

    return parseSensResponse(rawText, fallback);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeoutId);
  }
}
