import { GoogleGenAI } from '@google/genai';

export interface SensTestStats {
  dpi: number;
  currentSens: number;
  gripStyle: 'wrist' | 'arm';
  flickAccuracyPct: number;
  overshootPct: number;
  undershootPct: number;
  avgFlickTimeMs: number;
  trackingPct: number;
}

export interface SensAiResult {
  recommendedSens: string;
  recommendedEdpi: string;
  cm360: string;
  headline: string;
  tips: string[];
}

const SENS_TIMEOUT_MS = 60_000;
const GEMINI_MODEL = 'gemini-3.8-flash';

const OFFLINE_MESSAGE =
  'ไม่มีการเชื่อมต่ออินเทอร์เน็ต — ตรวจสอบเครือข่าย (Wi-Fi/มือถือ) แล้วลองอีกครั้ง';

export function calcEdpi(dpi: number, sens: number): number {
  return Math.round(dpi * sens * 100) / 100;
}

export function calcCm360(dpi: number, sens: number): number {
  return Math.round((13062.86 / (sens * dpi)) * 10) / 10;
}

interface ShortSensResponse {
  s?: unknown;
  e?: unknown;
  c?: unknown;
  h?: unknown;
  t?: unknown;
}

function buildPrompt(input: SensTestStats): string {
  const edpi = calcEdpi(input.dpi, input.currentSens);
  const grip = input.gripStyle === 'wrist' ? 'Wrist' : 'Arm';
  return [
    `โค้ช Aim Valorant DPI:${input.dpi} Sens:${input.currentSens} eDPI:${edpi} สไตล์:${grip}`,
    `ทดสอบ 30 วิ: Flick แม่น ${input.flickAccuracyPct}% (เกินเป้า ${input.overshootPct}%, ไม่ถึงเป้า ${input.undershootPct}%) เวลาต่อเป้า ${input.avgFlickTimeMs}ms Tracking ${input.trackingPct}%`,
    'แนะนำ Sens ใหม่ที่เหมาะสุด ตอบ JSON ย่อเท่านั้น:',
    '{"s":"sens ใหม่ เช่น 0.32","e":eDPIใหม่,"c":cm/360,"h":"สรุป1ประโยค","t":["คำแนะนำ1","คำแนะนำ2","คำแนะนำ3","คำแนะนำ4"]}',
    'คำแนะนำสั้นๆ เหมือนโค้ชมืออาชีพ ห้ามตอบนอก JSON',
  ].join('\n');
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function parseSensResponse(rawText: string): SensAiResult {
  let jsonStr = rawText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }
  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart === -1 || braceEnd === -1) {
    throw new Error('AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง กรุณาลองอีกครั้ง');
  }
  jsonStr = jsonStr.slice(braceStart, braceEnd + 1);

  let data: ShortSensResponse;
  try {
    data = JSON.parse(jsonStr) as ShortSensResponse;
  } catch {
    throw new Error('แปลงข้อมูลจาก AI ไม่สำเร็จ กรุณาลองอีกครั้ง');
  }

  const tips = Array.isArray(data.t)
    ? data.t.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).slice(0, 5)
    : [];

  return {
    recommendedSens: asString(data.s, '-'),
    recommendedEdpi: typeof data.e === 'number' ? String(Math.round(data.e * 100) / 100) : '-',
    cm360: typeof data.c === 'number' ? `${Math.round(data.c * 10) / 10}` : '-',
    headline: asString(data.h, 'ค่อยๆ ปรับและฝึกให้มือจำค่าใหม่ภายใน 3-5 วัน'),
    tips: tips.length > 0 ? tips : ['ฝึก Range 10 นาทีทุกวันก่อนลงเกมจริง'],
  };
}

export async function requestSensAnalysis(input: SensTestStats): Promise<SensAiResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error(OFFLINE_MESSAGE);
  }

  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_GEMINI_API_KEY — กรุณาเพิ่มคีย์ในตัวแปรแวดล้อมของโปรเจกต์');
  }
  const ai = new GoogleGenAI({ apiKey: key.trim() });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SENS_TIMEOUT_MS);

  try {
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(input),
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 300,
        abortSignal: controller.signal,
      },
    });

    const rawText = res.text ?? '';
    if (!rawText.trim()) {
      throw new Error('AI ไม่ได้ตอบกลับ กรุณาลองอีกครั้ง');
    }
    return parseSensResponse(rawText);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(OFFLINE_MESSAGE);
    }
    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'ApiError')) {
      throw new Error(
        'หมดเวลาการเชื่อมต่อ Gemini API (เกิน 60 วินาที) — เน็ตช้าหรือหลุด กรุณาลองใหม่อีกครั้ง'
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeoutId);
  }
}
