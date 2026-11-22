export interface SensTestStats {
  dpi: number;
  currentSens: number;
  gripStyle: 'wrist' | 'arm';

  // Stage 1: Flick & Micro-Adjust
  flickAccuracyPct: number;
  overshootPct: number;
  undershootPct: number;
  avgMicroAdjustMs: number;
  flickHits: number;
  flickTotalShots: number;

  // Stage 2: Smooth Tracking
  trackingPct: number; // Time on Target (%)
  stabilityScore: number; // Stability score (0-100)

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
 * จากสถิติจริงทั้ง 3 ด่านตามหลักสรีรศาสตร์และกลไกเกม Valorant
 */
export function calculateRecommendedSens(stats: SensTestStats): {
  recommendedSens: string;
  recommendedEdpi: string;
  sensAt800: string;
  sensAt1600: string;
  cm360: string;
} {
  const currentEdpi = calcEdpi(stats.dpi, stats.currentSens);
  let targetEdpi = currentEdpi > 0 ? currentEdpi : 280;

  // 1. ชดเชยตามค่า Overshoot vs Undershoot จากด่าน 1
  const netShootDiff = stats.overshootPct - stats.undershootPct;
  if (netShootDiff > 12) {
    // ลากเลยเป้าบ่อย แปลว่า Sens ไวเกินการควบคุม -> ลด Sens ลง 5% ถึง 18%
    const reduction = Math.min(0.18, (netShootDiff / 100) * 0.28);
    targetEdpi *= 1 - reduction;
  } else if (netShootDiff < -12) {
    // ลากไม่ถึงเป้าบ่อย แปลว่า Sens ช้าเกินไปจนต้องออกแรงมาก -> เพิ่ม Sens ขึ้น 5% ถึง 18%
    const increase = Math.min(0.18, (Math.abs(netShootDiff) / 100) * 0.28);
    targetEdpi *= 1 + increase;
  }

  // 2. ปรับตามความนิ่งของมือและการเลี้ยงเป้า (Tracking & Stability) จากด่าน 2
  if (stats.stabilityScore < 60 && targetEdpi > 240) {
    // มือสั่นหรือเป้าสะบัดตอนเลี้ยงเป้า -> ลด eDPI ลงเพื่อเพิ่มความเสถียร
    targetEdpi *= 0.93;
  } else if (stats.stabilityScore >= 85 && stats.trackingPct >= 75) {
    // มือมีความนิ่งสูงมาก เลี้ยงเป้าเนียน -> สามารถใช้ Sens ไวขึ้นได้เล็กน้อยหากต้องการ
    if (stats.undershootPct > 35) targetEdpi *= 1.05;
  }

  // 3. ปรับตามความเร็วในการกวาดเมาส์ (Sweep Speed) จากด่าน 3
  if (stats.sweepSpeedPxPerSec < 750 && stats.gripStyle === 'wrist' && targetEdpi < 270) {
    // สไตล์ข้อมือแต่กวาดช้า -> เพิ่ม Sens ขึ้นเล็กน้อยเพื่อลดภาระข้อต่อ
    targetEdpi *= 1.05;
  } else if (stats.sweepSpeedPxPerSec > 1600 && stats.switchAccuracyPct < 60) {
    // กวาดไวเกินไปจนสะบัดหลุดเป้า -> ลด Sens ลงเพื่อให้เกาะเป้าแม่นขึ้น
    targetEdpi *= 0.94;
  }

  // 4. บีบให้อยู่ในกรอบมาตรฐาน Competitive Valorant
  // สไตล์ข้อมือ (Wrist): 210 - 340 eDPI | สไตล์แขน (Arm): 170 - 270 eDPI
  const minEdpi = stats.gripStyle === 'wrist' ? 210 : 170;
  const maxEdpi = stats.gripStyle === 'wrist' ? 340 : 280;
  targetEdpi = Math.max(minEdpi, Math.min(maxEdpi, Math.round(targetEdpi)));

  const safeDpi = stats.dpi > 0 ? stats.dpi : 800;
  const recommendedSensNum = Math.round((targetEdpi / safeDpi) * 1000) / 1000;
  const sensAt800Num = Math.round((targetEdpi / 800) * 1000) / 1000;
  const sensAt1600Num = Math.round((targetEdpi / 1600) * 1000) / 1000;
  const cm360Str = String(calcCm360(safeDpi, recommendedSensNum));

  return {
    recommendedSens: recommendedSensNum.toFixed(3),
    recommendedEdpi: String(targetEdpi),
    sensAt800: sensAt800Num.toFixed(3),
    sensAt1600: sensAt1600Num.toFixed(3),
    cm360: cm360Str,
  };
}

/**
 * สร้างการวิเคราะห์อัตโนมัติด้วยสูตรคำนวณ (ใช้เป็นแผนสำรองหรือแสดงผลทันทีก่อน AI ตอบ)
 */
export function generateAlgorithmicAnalysis(stats: SensTestStats): SensAiResult {
  const calc = calculateRecommendedSens(stats);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const tips: string[] = [];

  // วิเคราะห์จุดเด่น
  if (stats.flickAccuracyPct >= 70) {
    strengths.push(`Flick เข้าเป้าแม่นยำสูง (${stats.flickAccuracyPct}%) จับจังหวะสแนปเป้าได้ดี`);
  }
  if (stats.trackingPct >= 65) {
    strengths.push(`เลี้ยงเป้า Tracking ต่อเนื่อง (${stats.trackingPct}%) เกาะติดเป้าหมายเคลื่อนไหวได้เยี่ยม`);
  }
  if (stats.stabilityScore >= 75) {
    strengths.push(`ความนิ่งของมือยอดเยี่ยม (Stability ${stats.stabilityScore}%) สไตล์การลากเนียนตา`);
  }
  if (stats.sweepSpeedPxPerSec >= 1100) {
    strengths.push(`กวาดเมาส์สลับมุมข้ามจอได้ว่องไว (${stats.sweepSpeedPxPerSec} px/s)`);
  }
  if (strengths.length === 0) {
    strengths.push('มีความมุ่งมั่นและพร้อมปรับกล้ามเนื้อมือเข้าสู่ Sens ที่เหมาะสม');
    strengths.push('สามารถควบคุมจังหวะการเล็งเป้าพื้นฐานได้สม่ำเสมอ');
  }

  // วิเคราะห์จุดด้อย
  if (stats.overshootPct >= 50) {
    weaknesses.push(`มีอาการลากเลยเป้าชัดเจน (Overshoot ${stats.overshootPct}%) เกิดจาก Sens เดิมที่ไวเกินการหยุดกะทันหัน`);
  }
  if (stats.undershootPct >= 50) {
    weaknesses.push(`สะบัดไม่ถึงเป้า (Undershoot ${stats.undershootPct}%) ต้องออกแรงแก้เมาส์สองจังหวะ`);
  }
  if (stats.avgMicroAdjustMs > 180) {
    weaknesses.push(`เวลาในการแก้เป้า Micro-adjust ค่อนข้างช้า (${stats.avgMicroAdjustMs}ms) เสียเปรียบในจังหวะดวลหน้าตัด`);
  }
  if (stats.stabilityScore < 65) {
    weaknesses.push(`ความนิ่งของมือยังแกว่ง (${stats.stabilityScore}%) มีการกระตุกเล็กน้อยระหว่างตามเป้า`);
  }
  if (weaknesses.length === 0) {
    weaknesses.push('ยังสามารถเพิ่มสปีดการเปลี่ยนเป้า (Switching) ในมุมกว้างได้อีกระดับ');
  }

  // คำแนะนำแบบโค้ชมืออาชีพ
  tips.push(
    `ปรับมาใช้ Sens แนะนำ ${calc.recommendedSens} (eDPI ${calc.recommendedEdpi}) เพื่อสมดุลการ Flick และการหยุดเป้า`
  );
  tips.push(
    `แนะนำให้เลือกใช้ 1600 DPI (Sens ${calc.sensAt1600}) เพื่อลด Input Latency ของ Sensor เมาส์และให้เคอร์เซอร์ลื่นไหลที่สุด`
  );
  tips.push(
    'ลงซ้อมใน The Range โหมดยิงเป้า 50 ตัว เน้นความแม่นยำ 100% โดยไม่เร่งสะบัดเป็นเวลา 10-15 นาทีก่อนเริ่มแข่งขัน'
  );
  tips.push('ใช้ Deathmatch วอร์มกล้ามเนื้อแขน/ข้อมืออย่างน้อย 2 แมตช์ติดต่อกัน 3 วัน เพื่อสร้าง Muscle Memory ใหม่');

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
  const grip = input.gripStyle === 'wrist' ? 'Wrist (ข้อมือ)' : 'Arm (แขน)';
  const calc = calculateRecommendedSens(input);

  return [
    `คุณคือโค้ช Aim ประจำทีม Valorant VCT วิเคราะห์สถิติจริง 3 ด่านของนักกีฬา:`,
    `- ข้อมูลปัจจุบัน: DPI ${input.dpi}, Sens ${input.currentSens} (eDPI ${edpi}), สไตล์การจับ: ${grip}`,
    `- ด่าน 1 (Flick & Micro-Adjust 15s): แม่นยำ ${input.flickAccuracyPct}%, Overshoot ${input.overshootPct}%, Undershoot ${input.undershootPct}%, เวลาแก้เป้า ${input.avgMicroAdjustMs}ms (ยิงโดน ${input.flickHits}/${input.flickTotalShots})`,
    `- ด่าน 2 (Smooth Tracking 15s): เกาะเป้า Time on Target ${input.trackingPct}%, ความนิ่งของมือ Stability ${input.stabilityScore}%`,
    `- ด่าน 3 (Multi-Target Switch 15s): ความเร็วกวาด Sweep Speed ${input.sweepSpeedPxPerSec} px/s, แม่นยำ ${input.switchAccuracyPct}% (${input.switchTargetsHit} เป้า)`,
    `- ค่าคำนวณสถิติเบื้องต้น: Sens แนะนำ ${calc.recommendedSens} (eDPI ${calc.recommendedEdpi}), สำหรับ 800 DPI คือ ${calc.sensAt800}, สำหรับ 1600 DPI คือ ${calc.sensAt1600}, cm/360 ${calc.cm360} cm`,
    `จงตอบกลับด้วย JSON ภาษาไทยเท่านั้น ตามโครงสร้างนี้:`,
    `{`,
    `  "headline": "สรุปผลลัพธ์และคำแนะนำภาพรวมใน 1 ประโยคชัดเจน",`,
    `  "recommendedSens": "${calc.recommendedSens}",`,
    `  "recommendedEdpi": "${calc.recommendedEdpi}",`,
    `  "sensAt800": "${calc.sensAt800}",`,
    `  "sensAt1600": "${calc.sensAt1600}",`,
    `  "cm360": "${calc.cm360}",`,
    `  "strengths": ["จุดเด่นข้อที่ 1 ที่ตรวจพบจาก 3 ด่าน", "จุดเด่นข้อที่ 2"],`,
    `  "weaknesses": ["จุดด้อยที่ต้องปรับแก้", "จุดที่เสียเปรียบในการดวล"],`,
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

    return {
      recommendedSens: asString(data.recommendedSens, fallback.recommendedSens),
      recommendedEdpi: asString(data.recommendedEdpi, fallback.recommendedEdpi),
      sensAt800: asString(data.sensAt800, fallback.sensAt800),
      sensAt1600: asString(data.sensAt1600, fallback.sensAt1600),
      cm360: asString(data.cm360, fallback.cm360),
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
    // ถ้าไม่มี API Key ให้ใช้การวิเคราะห์ตามสูตรสรีรศาสตร์ที่แม่นยำได้ทันที
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
