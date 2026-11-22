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
  /** true = แผนจากฐานข้อมูลในเครื่อง (Offline Tactical Mode) ไม่ใช่คำตอบจาก AI */
  offline?: boolean;
}

const COACH_TIMEOUT_MS = 8_000;
const GEMINI_MODEL = 'gemini-3.8-flash';

// ยิงตรงเข้า REST API ของ Gemini ด้วย fetch ธรรมดา (ไม่ผ่าน SDK ลดขนาด bundle บนเน็ตมือถือ)
function buildEndpoint(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_GEMINI_API_KEY — กรุณาเพิ่มคีย์ในตัวแปรแวดล้อมของโปรเจกต์');
  }
  return key.trim();
}

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
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }
  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart === -1 || braceEnd === -1) {
    throw new Error('รูปแบบตอบกลับไม่ถูกต้อง');
  }
  jsonStr = jsonStr.slice(braceStart, braceEnd + 1);

  let data: ShortResponse;
  try {
    data = JSON.parse(jsonStr) as ShortResponse;
  } catch {
    throw new Error('แปลงข้อมูลจาก AI ไม่สำเร็จ');
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

// ---------- Smart Fallback: แผนสำรองในเครื่อง (ไม่ใช้เน็ต ตอบทันที) ----------

interface RoleFallback {
  attack: string;
  defense: string;
  tone: AiAgentOrder['roleTone'];
}

const ROLE_FALLBACKS: Record<string, RoleFallback> = {
  duelist: {
    attack: 'บุกนำหน้าเปิดไซท์ เล็งมุมประชิดก่อนเพื่อนโผล่',
    defense: 'ดวลมุมประชิดที่เสาหลัก ยิงได้ 1 แล้วถอยเปลี่ยนมุม',
    tone: 'attack',
  },
  initiator: {
    attack: 'ส่องข่าว/ปาแฟลชเปิดทางก่อนทีมเข้า ห้ามลักไก่',
    defense: 'วิ่งรีคอนมุมอับ รายงานจำนวนศัตรูก่อนตัดสินใจ',
    tone: 'defense',
  },
  controller: {
    attack: 'ปาสโมคคลุมมุมอันตรายที่ลิสต์ แล้วค่อยพาทีมขึ้น',
    defense: 'คุมควันตัดทางเข้าไซท์ รีบปาทันทีที่ได้ข่าว',
    tone: 'defense',
  },
  sentinel: {
    attack: 'เฝ้าหลัง/ปิดทางวิ่งกลับ ห้ามแยกไกลเกินกำลัง',
    defense: 'ล็อกมุมเข้าไซท์ด้วยกับดัก ยืนตำแหน่งเดิมไม่ต้องหมุนเร็ว',
    tone: 'warning',
  },
};

function pickCallouts(input: LiveCoachRequest, count: number): CoachCalloutInput[] {
  const relevant = input.callouts.filter((c) => {
    if (input.side === 'attack') return c.group === 'Atk' || c.group === 'Mid' || c.group === 'Site';
    return c.group === 'Def' || c.group === 'Mid' || c.group === 'Site';
  });
  const pool = relevant.length >= count ? relevant : input.callouts;
  if (pool.length === 0) return [];
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => pool[i % pool.length]);
}

export function buildLocalFallbackPlan(input: LiveCoachRequest): AiCoachResponse {
  const callouts = pickCallouts(input, 5);
  const isAttack = input.side === 'attack';
  const tagsLower = input.tags.join(' ').toLowerCase();
  const isRetake = tagsLower.includes('retake') || tagsLower.includes('รีเทค');
  const isEco = tagsLower.includes('eco') || tagsLower.includes('ประหยัด') || input.economy.toLowerCase().includes('eco');

  const orders: AiAgentOrder[] = input.ourTeam.slice(0, 5).map((agent, idx) => {
    const role = agent.role.toLowerCase();
    const fb = ROLE_FALLBACKS[role] ?? ROLE_FALLBACKS.initiator;
    const pos = callouts[idx];
    const command = isRetake && role === 'controller'
      ? 'ปาสโมคคลุม Spike ก่อนทีมแตะ แล้วเข้าพร้อมกัน 2 ทิศ'
      : isEco
        ? `${fb[isAttack ? 'attack' : 'defense']} (รอบนี้เล่นรวมกลุ่ม ห้ามแยกเดี่ยว)`
        : fb[isAttack ? 'attack' : 'defense'];
    return {
      slot: agent.slot || idx + 1,
      agentId: agent.id,
      agentName: agent.name,
      callout: pos?.key ?? '-',
      command,
      x: pos?.x ?? 50,
      y: pos?.y ?? 50,
      roleTone: isRetake ? 'warning' : fb.tone,
      moveToX: pos ? Math.min(100, Math.max(0, pos.x + (isAttack ? 4 : -4))) : undefined,
      moveToY: pos?.y,
    };
  });

  const siteCallout = callouts[0];
  const utilityPlacements: AiUtilityPlacement[] = [];
  if (siteCallout) {
    utilityPlacements.push({
      kind: 'smoke',
      label: isAttack ? `Smoke ปิดมุม ${siteCallout.key}` : `Smoke ตัดทางเข้า ${siteCallout.key}`,
      x: siteCallout.x,
      y: siteCallout.y,
    });
    utilityPlacements.push({
      kind: 'recon',
      label: 'Recon ส่องข่าวก่อนเปิด',
      x: Math.min(100, Math.max(0, siteCallout.x - 6)),
      y: Math.min(100, Math.max(0, siteCallout.y + 6)),
    });
  }

  const headline = isRetake
    ? `รีเทค ${input.sites.join('/')} แบบพร้อมกัน — รอสกิลครบแล้วเปิดเข้า 2 ทิศ`
    : isEco
      ? 'เล่นรวมกลุ่มเก็บปืน ห้ามแลกเดี่ยว ตัดเงินศัตรูให้ได้ก่อน'
      : isAttack
        ? `Execute เข้า ${input.sites.join('/') || 'ไซท์หลัก'} พร้อมกันตามลำดับคำสั่งด้านล่าง`
        : 'ยืนฐานรับตามบทบาท เช็คข่าวก่อนหมุนทีม';

  return {
    strategyName: isRetake ? 'แผนรีเทค (สำรอง)' : isEco ? 'แผนเก็บเงิน (สำรอง)' : isAttack ? 'แผนบุกพร้อมกัน (สำรอง)' : 'แผนตั้งรับฐาน (สำรอง)',
    headline,
    agentOrders: orders,
    utilityPlacements,
    offline: true,
  };
}

// ---------- Main entry ----------

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

  const normalized: LiveCoachRequest = { ...input, situation, tags };

  try {
    const apiKey = getApiKey();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), COACH_TIMEOUT_MS);

    try {
      const res = await fetch(buildEndpoint(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(normalized) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 350,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`API status ${res.status}`);
      }

      const payload = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const rawText = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (!rawText.trim()) {
        throw new Error('คำตอบว่างเปล่า');
      }
      return parseCoachResponse(rawText);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // Smart Fallback: เน็ตช้า/หลุด/API ล่ม → ไม่ขึ้น Error ใช้แผนในเครื่องทันที
    return buildLocalFallbackPlan(normalized);
  }
}
