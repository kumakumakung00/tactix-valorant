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

const COACH_TIMEOUT_MS = 25_000;

interface ShortAgentOrder {
  a?: unknown;
  t?: unknown;
  x?: unknown;
  y?: unknown;
  r?: unknown;
  m?: unknown;
}
interface ShortUtility {
  k?: unknown;
  l?: unknown;
  x?: unknown;
  y?: unknown;
}
interface ShortResponse {
  s?: unknown;
  h?: unknown;
  o?: ShortAgentOrder[];
  u?: ShortUtility[];
}

const ROLE_TONES: AiAgentOrder['roleTone'][] = ['attack', 'defense', 'lurk', 'warning'];
const UTILITY_KINDS: AiUtilityPlacement['kind'][] = [
  'smoke',
  'flash',
  'recon',
  'molly',
  'wall',
  'spike',
  'pin',
];

function buildPrompt(input: LiveCoachRequest): string {
  const our = input.ourTeam
    .slice(0, 5)
    .map((a) => `${a.name}(${a.role})`)
    .join(',');
  const enemy = input.enemyTeam
    .slice(0, 5)
    .map((a) => a.name)
    .join(',');
  const problem = [...input.tags, input.situation.trim()].filter(Boolean).join('; ');

  return [
    `โค้ช Valorant ภาษาไทย แผนที่:${input.mapName} ฝั่ง:${input.side === 'attack' ? 'บุก' : 'รับ'} เงิน:${input.economy}`,
    `เรา:${our}`,
    `ศัตรู:${enemy || '-'}`,
    `ปัญหา:${problem || '-'}`,
    'สั่งทีม 5 คน ตอบ JSON ย่อเท่านั้น:',
    '{"s":"ชื่อแผนสั้น","h":"สรุป1ประโยค","o":[{"a":"ชื่อAgent","t":"คำสั่งไม่เกิน12คำ","x":0-100,"y":0-100,"r":"attack|defense|lurk|warning","m":[x,y]}],"u":[{"k":"smoke|flash|recon|molly|wall|spike","l":"ชื่อสกิล","x":0-100,"y":0-100}]}',
    'ทุกคำสั่งสั้นกระชับ x,y เป็นเลขจำนวนเต็ม ห้ามตอบนอก JSON',
  ].join('\n');
}

function clampCoord(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function parseCoachResponse(rawText: string): AiCoachResponse {
  let jsonStr = rawText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\(\S\)]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }
  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart === -1 || braceEnd === -1) {
    throw new Error('รูปแบบตอบกลับจาก AI ไม่ถูกต้อง กรุณากดลองใหม่อีกครั้ง');
  }
  jsonStr = jsonStr.slice(braceStart, braceEnd + 1);

  let data: ShortResponse;
  try {
    data = JSON.parse(jsonStr) as ShortResponse;
  } catch {
    throw new Error('แปลงข้อมูลจาก AI ไม่สำเร็จ กรุณากดลองใหม่อีกครั้ง');
  }

  const orders = Array.isArray(data.o) ? data.o : [];
  const utils = Array.isArray(data.u) ? data.u : [];

  return {
    strategyName: asString(data.s, 'แผนแก้เกม AI Coach'),
    headline: asString(data.h, 'ปรับตำแหน่งตามคำสั่งโค้ชด้านล่างทันที'),
    agentOrders: orders
      .filter((o): o is ShortAgentOrder => !!o && typeof o === 'object')
      .map((o, idx) => {
        let moveToX: number | undefined;
        let moveToY: number | undefined;
        if (Array.isArray(o.m) && o.m.length >= 2) {
          moveToX = clampCoord(o.m[0]);
          moveToY = clampCoord(o.m[1]);
        }
        return {
          slot: idx,
          agentName: asString(o.a, `ช่อง ${idx + 1}`),
          callout: '',
          command: asString(o.t, 'คุมตำแหน่งเดิม'),
          x: clampCoord(o.x),
          y: clampCoord(o.y),
          roleTone: ROLE_TONES.includes(o.r as AiAgentOrder['roleTone'])
            ? (o.r as AiAgentOrder['roleTone'])
            : 'attack',
          moveToX,
          moveToY,
        };
      }),
    utilityPlacements: utils
      .filter((u): u is ShortUtility => !!u && typeof u === 'object')
      .map((u) => ({
        kind: UTILITY_KINDS.includes(u.k as AiUtilityPlacement['kind'])
          ? (u.k as AiUtilityPlacement['kind'])
          : 'pin',
        label: asString(u.l, 'จุดวางสกิล'),
        x: clampCoord(u.x),
        y: clampCoord(u.y),
      })),
  };
}

// ---------- Main entry (Pollinations GET URL — ฟรี ไม่ใช้ API Key ไม่ติด CORS) ----------

export async function requestLiveCoachAdvice(
  input: LiveCoachRequest
): Promise<AiCoachResponse> {
  const mapName = input.mapName.trim();
  const situation = input.situation.trim();
  const tags = input.tags.filter((t) => t.trim().length > 0).slice(0, 10);

  if (!mapName) throw new Error('กรุณาระบุชื่อแผนที่');
  if (!situation && tags.length === 0) {
    throw new Error('กรุณาเลือก Tag ด่วน หรือพิมพ์สถานการณ์สั้นๆ ก่อนขอคำสั่ง');
  }

  const normalized: LiveCoachRequest = { ...input, situation, tags };
  const prompt = buildPrompt(normalized);
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 100_000);
  const url = `https://pollinations.ai{encodedPrompt}?json=true&seed=${seed}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), COACH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`เชื่อมต่อ AI ฟรีไม่สำเร็จ (${res.status}) — กรุณาลองใหม่อีกครั้ง`);
    }

    const rawText = await res.text();
    if (!rawText.trim()) {
      throw new Error('คำตอบจาก AI ว่างเปล่า กรุณากดลองใหม่อีกครั้ง');
    }

    return parseCoachResponse(rawText);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('หมดเวลาการเชื่อมต่อ AI (เกิน 25 วินาที) — กรุณาลองใหม่อีกครั้ง');
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeoutId);
  }
}
