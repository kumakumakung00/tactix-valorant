import { GoogleGenAI } from '@google/genai';
import { Side } from '../types/tactix';

export interface CoachTeamAgentInput {
  slot: number;
  id: string;
  name: string;
  role: string;
  abilities?: string[];
}

export interface CoachEnemyAgentInput {
  name: string;
  role: string;
}

export interface CoachCalloutInput {
  key: string;
  group: string;
  x: number;
  y: number;
}

export interface LiveCoachRequest {
  mapName: string;
  sites: string[];
  side: Side;
  economy: string;
  ourTeam: CoachTeamAgentInput[];
  enemyTeam: CoachEnemyAgentInput[];
  callouts: CoachCalloutInput[];
  situation: string;
  tags: string[];
}

export interface AiAgentOrder {
  slot: number;
  agentId?: string;
  agentName: string;
  callout: string;
  command: string;
  x: number;
  y: number;
  roleTone: 'attack' | 'defense' | 'lurk' | 'warning';
  moveToX?: number;
  moveToY?: number;
}

export interface AiUtilityPlacement {
  kind: 'smoke' | 'flash' | 'recon' | 'molly' | 'wall' | 'spike' | 'pin';
  label: string;
  x: number;
  y: number;
}

export interface AiCoachResponse {
  strategyName: string;
  headline: string;
  agentOrders: AiAgentOrder[];
  utilityPlacements: AiUtilityPlacement[];
}

const COACH_TIMEOUT_MS = 45_000;
const GEMINI_MODEL = 'gemini-3.8-flash';

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_GEMINI_API_KEY — กรุณาเพิ่มคีย์ในตัวแปรแวดล้อมของโปรเจกต์');
  }
  return key.trim();
}

function buildPrompt(input: LiveCoachRequest): string {
  const our = input.ourTeam
    .slice(0, 5)
    .map((a) => `- slot:${a.slot} agent:${a.name} role:${a.role}`)
    .join('\n');
  const enemy = input.enemyTeam
    .slice(0, 5)
    .map((a) => `- ${a.name} (${a.role})`)
    .join('\n');
  const callouts = input.callouts
    .slice(0, 20)
    .map((c) => `- ${c.key} (${c.group}) x:${c.x} y:${c.y}`)
    .join('\n');

  return [
    'คุณคือโค้ช Valorant ระดับมืออาชีพ ตอบเป็นภาษาไทย',
    'ตอบสั้นกระชับที่สุด: แต่ละคำสั่งไม่เกิน 1 ประโยค',
    '',
    `แผนที่: ${input.mapName}`,
    `ไซท์: ${input.sites.join(', ')}`,
    `ฝั่ง: ${input.side === 'attack' ? 'บุก' : 'รับ'}`,
    `สถานะเงิน: ${input.economy}`,
    `สถานการณ์: ${input.situation || '(ไม่ได้พิมพ์)'}`,
    `แท็ก: ${input.tags.join(', ') || '(ไม่มี)'}`,
    '',
    'ทีมเรา:',
    our,
    '',
    'ทีมศัตรู:',
    enemy,
    '',
    'จุดสังเกตบนแผนที่ (พิกัด 0-100):',
    callouts,
    '',
    'ตอบกลับเป็น JSON เท่านั้น ตามรูปแบบนี้:',
    '{"strategyName": string, "headline": string (1 ประโยค), "agentOrders": [{"slot": number, "agentName": string, "callout": string, "command": string (สั้นๆ 1 ประโยค), "x": number, "y": number, "roleTone": "attack"|"defense"|"lurk"|"warning", "moveToX"?: number, "moveToY"?: number}], "utilityPlacements": [{"kind": "smoke"|"flash"|"recon"|"molly"|"wall"|"spike"|"pin", "label": string, "x": number, "y": number}]}',
    'กฎ: agentOrders ต้องมีครบทุกตัวในทีมเรา (ใช้ slot เดิม), x/y ต้องเป็นพิกัด 0-100 จากจุดสังเกตที่ใกล้ที่สุด, ห้ามอธิบายนอกเหนือจาก JSON',
  ].join('\n');
}

function clampCoord(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function parseCoachResponse(rawText: string): AiCoachResponse {
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

  let data: Partial<AiCoachResponse>;
  try {
    data = JSON.parse(jsonStr) as Partial<AiCoachResponse>;
  } catch {
    throw new Error('แปลงข้อมูลจาก AI ไม่สำเร็จ กรุณาลองอีกครั้ง');
  }

  const orders = Array.isArray(data.agentOrders) ? data.agentOrders : [];
  const utils = Array.isArray(data.utilityPlacements) ? data.utilityPlacements : [];

  return {
    strategyName: data.strategyName || 'แผนแก้เกม AI Coach',
    headline: data.headline || 'ปรับตำแหน่งตามคำสั่งโค้ชด้านล่างทันที',
    agentOrders: orders
      .filter((o): o is AiAgentOrder => !!o && typeof o === 'object')
      .map((o) => ({
        ...o,
        x: clampCoord(o.x),
        y: clampCoord(o.y),
        moveToX: o.moveToX !== undefined ? clampCoord(o.moveToX) : undefined,
        moveToY: o.moveToY !== undefined ? clampCoord(o.moveToY) : undefined,
      })),
    utilityPlacements: utils
      .filter((u): u is AiUtilityPlacement => !!u && typeof u === 'object')
      .map((u) => ({
        ...u,
        x: clampCoord(u.x),
        y: clampCoord(u.y),
      })),
  };
}

export async function requestLiveCoachAdvice(
  input: LiveCoachRequest
): Promise<AiCoachResponse> {
  const mapName = input.mapName.trim();
  const situation = input.situation.trim();
  const tags = input.tags.filter((t) => t.trim().length > 0).slice(0, 10);

  if (!mapName) {
    throw new Error('กรุณาระบุชื่อแผนที่');
  }
  if (!situation && tags.length === 0) {
    throw new Error('กรุณาเลือก Tag ด่วน หรือพิมพ์สถานการณ์สั้นๆ ก่อนขอคำสั่ง');
  }

  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), COACH_TIMEOUT_MS);

  try {
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt({ ...input, situation, tags }),
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
        maxOutputTokens: 1200,
        abortSignal: controller.signal,
      },
    });

    const rawText = res.text ?? '';
    if (!rawText.trim()) {
      throw new Error('AI ไม่ได้ตอบกลับ กรุณากดขอคำสั่งใหม่อีกครั้ง');
    }
    return parseCoachResponse(rawText);
  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'ApiError')) {
      throw new Error(
        'หมดเวลาการเชื่อมต่อ Gemini API (เกิน 45 วินาที) — กรุณากดขอคำสั่งใหม่อีกครั้ง'
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeoutId);
  }
}
