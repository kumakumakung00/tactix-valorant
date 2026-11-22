import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
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

interface RawAgentOrder {
  slot?: number;
  agentName?: string;
  callout?: string;
  command?: string;
  x?: number;
  y?: number;
  roleTone?: string;
  moveToX?: number;
  moveToY?: number;
}

interface RawUtilityPlacement {
  kind?: string;
  label?: string;
  x?: number;
  y?: number;
}

interface RawCoachResponse {
  strategyName?: string;
  headline?: string;
  agentOrders?: RawAgentOrder[];
  utilityPlacements?: RawUtilityPlacement[];
}

const VALID_TONES = new Set(['attack', 'defense', 'lurk', 'warning']);
const VALID_UTILITY_KINDS = new Set([
  'smoke',
  'flash',
  'recon',
  'molly',
  'wall',
  'spike',
  'pin',
]);

function clampCoord(val: unknown, fallback = 50): number {
  const num = typeof val === 'number' && Number.isFinite(val) ? val : fallback;
  return Number(Math.min(95, Math.max(5, num)).toFixed(1));
}

function getClientAi(): GoogleGenAI {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
  if (!apiKey) {
    throw new Error('MISSING_VITE_API_KEY');
  }
  return new GoogleGenAI({ apiKey });
}

async function callGeminiWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  maxAttempts = 3
) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastErr = err;
      const status =
        typeof (err as { status?: unknown })?.status === 'number'
          ? (err as { status: number }).status
          : 0;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        status === 503 ||
        status === 502 ||
        status === 500 ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand');

      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

export async function requestLiveCoachAdvice(
  input: LiveCoachRequest
): Promise<AiCoachResponse> {
  const mapName = input.mapName.trim();
  const side: Side = input.side === 'defense' ? 'defense' : 'attack';
  const economy = input.economy.trim() || 'full';
  const situation = input.situation.trim();
  const tags = input.tags.filter((t) => t.trim().length > 0).slice(0, 12);

  if (!mapName) {
    throw new Error('กรุณาระบุชื่อแผนที่');
  }
  if (!situation && tags.length === 0) {
    throw new Error('กรุณาเลือก Tag ด่วน หรือพิมพ์สถานการณ์สั้นๆ ก่อนขอคำสั่ง');
  }

  const ourTeam = input.ourTeam.slice(0, 5);
  const enemyTeam = input.enemyTeam.slice(0, 5);
  const callouts = input.callouts.slice(0, 60);
  const sites = input.sites.length > 0 ? input.sites : ['A', 'B'];

  const ourTeamText =
    ourTeam.length > 0
      ? ourTeam
          .map(
            (a) =>
              `ช่อง ${a.slot}: ${a.name} (${a.role})${
                a.abilities?.length ? ` [สกิล: ${a.abilities.join(', ')}]` : ''
              }`
          )
          .join('\n')
      : 'ยังไม่ได้ระบุตัวละคร (ให้จัดคำสั่ง 5 บทบาทหลัก: Entry, Initiator, Controller, Sentinel, Flex)';

  const enemyText =
    enemyTeam.length > 0
      ? enemyTeam.map((e) => `${e.name} (${e.role})`).join(', ')
      : 'ไม่ระบุรายชื่อตัวศัตรู';

  const calloutsText =
    callouts.length > 0
      ? callouts.map((c) => `${c.key} (${c.group}): x=${c.x}, y=${c.y}`).join(' | ')
      : 'ใช้พิกัดมาตรฐาน 0-100 โดยจุดเกิดฝั่งบุกอยู่ด้านล่าง (y≈85) จุดเกิดฝั่งรับอยู่ด้านบน (y≈15)';

  const prompt = [
    `แผนที่: ${mapName} (Sites: ${sites.join(', ')})`,
    `ฝั่งของเรา: ${side === 'attack' ? 'ฝั่งบุก (Attack)' : 'ฝั่งรับ (Defense)'}`,
    `สถานะเงินรอบนี้: ${economy}`,
    ``,
    `รายชื่อ Agent ทีมเรา:`,
    ourTeamText,
    ``,
    `รายชื่อ Agent ทีมศัตรู: ${enemyText}`,
    ``,
    `พิกัดจุด Callout จริงบนแผนที่ ${mapName} (ระบบ 0-100%):`,
    calloutsText,
    ``,
    `สถานการณ์ที่ผู้เล่นแจ้งในช่วง Buy Phase:`,
    tags.length > 0 ? `- Tag ปัญหาด่วน: ${tags.join(', ')}` : '',
    situation ? `- รายละเอียดเพิ่มเติม: ${situation}` : '',
    ``,
    `ภารกิจ: ออกคำสั่งแก้เกมสำหรับรอบถัดไปแบบโค้ชทีมแข่ง Valorant ระดับโปร:`,
    `1. ใช้ภาษาไทยสไตล์โค้ชทีมแข่ง/IGL ที่สั้น กระชับ อ่านจบใน 5 วินาทีในช่วง Buy Phase`,
    `2. แยกคำสั่งชัดเจนตามรายชื่อ Agent ในทีมเราทุกคน (อ้างอิงสกิลจริงของตัวนั้นถ้ามี)`,
    `3. กำหนดพิกัด x, y (0-100) อ้างอิงจากพิกัด Callout จริงของแผนที่ด้านบน เพื่อวางไอคอน Agent และจุดเดิน (moveToX, moveToY)`,
    `4. กำหนดจุดวางสกิลสำคัญ 2-4 จุด (utilityPlacements: smoke/flash/recon/molly/wall) ด้วยพิกัด x, y ที่แม่นยำบนแผนที่`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const ai = getClientAi();
    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'คุณคือ Head Coach ทีม Valorant ระดับ VCT (โปรเพลเยอร์) ที่เชี่ยวชาญการแก้เกมสดช่วง Buy Phase 30 วินาที ตอบเป็น JSON ตาม schema อย่างเคร่งครัด คำสั่งต้องสั้น คม ปฏิบัติได้ทันที ใช้ชื่อ Agent และสกิลตรงตามทีมที่ส่งมา และใช้พิกัด X,Y จากตาราง Callout ที่แนบให้เพื่อให้หมุดบนแผนที่ 2D ตรงตำแหน่งจริงของด่าน',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategyName: {
              type: Type.STRING,
              description: 'ชื่อแผนแก้เกมสั้นๆ 3-6 คำ เช่น Split Mid ตัดหลัง',
            },
            headline: {
              type: Type.STRING,
              description: 'สรุปใจความสำคัญของรอบนี้ใน 1 ประโยคสั้นๆ',
            },
            agentOrders: {
              type: Type.ARRAY,
              description: 'คำสั่งรายคนสำหรับทีมเรา',
              items: {
                type: Type.OBJECT,
                properties: {
                  slot: { type: Type.INTEGER, description: 'หมายเลขช่อง 1 ถึง 5' },
                  agentName: { type: Type.STRING, description: 'ชื่อ Agent หรือบทบาท' },
                  callout: { type: Type.STRING, description: 'ชื่อจุดยืน/โซนบนแผนที่' },
                  command: {
                    type: Type.STRING,
                    description: 'คำสั่งสั้นกระชับไม่เกิน 18 คำ ระบุให้ทำอะไร/ใช้สกิลไหน',
                  },
                  x: { type: Type.NUMBER, description: 'พิกัด X เริ่มต้น/จุดยืน (5-95)' },
                  y: { type: Type.NUMBER, description: 'พิกัด Y เริ่มต้น/จุดยืน (5-95)' },
                  roleTone: {
                    type: Type.STRING,
                    description: 'attack | defense | lurk | warning',
                  },
                  moveToX: {
                    type: Type.NUMBER,
                    description: 'พิกัด X ปลายทางสำหรับลูกศรเคลื่อนที่ (5-95)',
                  },
                  moveToY: {
                    type: Type.NUMBER,
                    description: 'พิกัด Y ปลายทางสำหรับลูกศรเคลื่อนที่ (5-95)',
                  },
                },
                required: ['slot', 'agentName', 'callout', 'command', 'x', 'y', 'roleTone'],
              },
            },
            utilityPlacements: {
              type: Type.ARRAY,
              description: 'จุดปาสกิล/ควัน/แฟลชสำคัญ 2-4 จุดบนแผนที่',
              items: {
                type: Type.OBJECT,
                properties: {
                  kind: {
                    type: Type.STRING,
                    description: 'smoke | flash | recon | molly | wall | spike | pin',
                  },
                  label: {
                    type: Type.STRING,
                    description: 'ป้ายกำกับสั้นๆ เช่น Smoke CT, Flash A Main',
                  },
                  x: { type: Type.NUMBER, description: 'พิกัด X (5-95)' },
                  y: { type: Type.NUMBER, description: 'พิกัด Y (5-95)' },
                },
                required: ['kind', 'label', 'x', 'y'],
              },
            },
          },
          required: ['strategyName', 'headline', 'agentOrders', 'utilityPlacements'],
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      throw new Error('AI ไม่ได้ส่งคำตอบกลับมา กรุณาลองใหม่อีกครั้ง');
    }

    const parsed = JSON.parse(rawText) as RawCoachResponse;

    const agentOrders: AiAgentOrder[] = (
      Array.isArray(parsed.agentOrders) ? parsed.agentOrders : []
    ).map((order, idx) => {
      const matchedAgent = ourTeam.find((a) => a.slot === order.slot) ?? ourTeam[idx];
      const toneRaw = typeof order.roleTone === 'string' ? order.roleTone.toLowerCase() : '';
      const roleTone: AiAgentOrder['roleTone'] = VALID_TONES.has(toneRaw)
        ? (toneRaw as AiAgentOrder['roleTone'])
        : side === 'attack'
        ? 'attack'
        : 'defense';

      const x = clampCoord(order.x, 50);
      const y = clampCoord(order.y, 50);
      const hasMove =
        typeof order.moveToX === 'number' &&
        Number.isFinite(order.moveToX) &&
        typeof order.moveToY === 'number' &&
        Number.isFinite(order.moveToY);

      return {
        slot: matchedAgent?.slot ?? order.slot ?? idx + 1,
        agentId: matchedAgent?.id,
        agentName:
          matchedAgent?.name ??
          (typeof order.agentName === 'string' && order.agentName.trim()
            ? order.agentName.trim()
            : `ผู้เล่น ${idx + 1}`),
        callout:
          typeof order.callout === 'string' && order.callout.trim()
            ? order.callout.trim()
            : 'Mid',
        command:
          typeof order.command === 'string' && order.command.trim()
            ? order.command.trim()
            : 'ยึดพื้นที่และรอเช็กข้อมูลร่วมกับทีม',
        x,
        y,
        roleTone,
        moveToX: hasMove ? clampCoord(order.moveToX, x) : undefined,
        moveToY: hasMove ? clampCoord(order.moveToY, y) : undefined,
      };
    });

    const utilityPlacements: AiUtilityPlacement[] = (
      Array.isArray(parsed.utilityPlacements) ? parsed.utilityPlacements : []
    )
      .slice(0, 6)
      .map((u) => {
        const kindRaw = typeof u.kind === 'string' ? u.kind.toLowerCase() : 'pin';
        const kind: AiUtilityPlacement['kind'] = VALID_UTILITY_KINDS.has(kindRaw)
          ? (kindRaw as AiUtilityPlacement['kind'])
          : 'pin';
        return {
          kind,
          label:
            typeof u.label === 'string' && u.label.trim()
              ? u.label.trim()
              : kind.toUpperCase(),
          x: clampCoord(u.x, 50),
          y: clampCoord(u.y, 50),
        };
      });

    return {
      strategyName:
        typeof parsed.strategyName === 'string' && parsed.strategyName.trim()
          ? parsed.strategyName.trim()
          : 'แผนแก้เกม AI Coach',
      headline:
        typeof parsed.headline === 'string' && parsed.headline.trim()
          ? parsed.headline.trim()
          : 'ปรับตำแหน่งตามคำสั่งโค้ชด้านล่างทันที',
      agentOrders,
      utilityPlacements,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      typeof (err as { status?: unknown })?.status === 'number'
        ? (err as { status: number }).status
        : 0;

    if (message === 'MISSING_VITE_API_KEY') {
      throw new Error(
        'ยังไม่ได้ตั้งค่า VITE_GEMINI_API_KEY — กรุณาเพิ่ม Environment Variable ชื่อ VITE_GEMINI_API_KEY ใน Vercel (หรือไฟล์ .env) แล้ว Redeploy'
      );
    }
    if (
      status === 403 ||
      message.includes('API_KEY_INVALID') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('API key not valid')
    ) {
      throw new Error(
        'VITE_GEMINI_API_KEY ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน — กรุณาตรวจสอบคีย์และโดเมนที่อนุญาตใน Google AI Studio / Vercel Environment Variables'
      );
    }
    if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('โควตาการใช้งาน Gemini API เต็มชั่วคราว กรุณารอสักครู่แล้วลองใหม่');
    }
    if (status === 404 || message.includes('NOT_FOUND')) {
      throw new Error('ไม่พบโมเดล AI ที่ระบุบน Gemini API');
    }
    if (status === 503 || message.includes('UNAVAILABLE') || message.includes('high demand')) {
      throw new Error('เซิร์ฟเวอร์ Gemini AI มีผู้ใช้งานหนาแน่นชั่วคราว กรุณากดส่งอีกครั้งในอีกสักครู่');
    }
    throw err instanceof Error ? err : new Error(message);
  }
}
