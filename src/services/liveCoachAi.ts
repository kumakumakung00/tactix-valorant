import { GoogleGenAI, Type } from '@google/genai';
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

const COACH_TIMEOUT_MS = 15_000;
const COACH_MODEL = 'gemini-2.5-flash';

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

function getClientApiKey(): string {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
  if (!apiKey) {
    throw new Error('MISSING_VITE_API_KEY');
  }
  return apiKey;
}

function formatErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (typeof err === 'string' && err) {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export async function requestLiveCoachAdvice(
  input: LiveCoachRequest
): Promise<AiCoachResponse> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const mapName = input.mapName.trim();
    const side: Side = input.side === 'defense' ? 'defense' : 'attack';
    const economy = input.economy.trim() || 'full';
    const situation = input.situation.trim();
    const tags = input.tags.filter((t) => t.trim().length > 0).slice(0, 10);

    if (!mapName) {
      throw new Error('กรุณาระบุชื่อแผนที่');
    }
    if (!situation && tags.length === 0) {
      throw new Error('กรุณาเลือก Tag ด่วน หรือพิมพ์สถานการณ์สั้นๆ ก่อนขอคำสั่ง');
    }

    const apiKey = getClientApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const ourTeam = input.ourTeam.slice(0, 5);
    const enemyTeam = input.enemyTeam.slice(0, 5);
    const callouts = input.callouts.slice(0, 28);
    const sites = input.sites.length > 0 ? input.sites : ['A', 'B'];

    const teamLine =
      ourTeam.length > 0
        ? ourTeam
            .map(
              (a) =>
                `${a.slot}:${a.name}(${a.role})${
                  a.abilities?.length ? `[${a.abilities.slice(0, 3).join(',')}]` : ''
                }`
            )
            .join(' | ')
        : '1:Entry | 2:Initiator | 3:Controller | 4:Sentinel | 5:Flex';

    const enemyLine =
      enemyTeam.length > 0 ? enemyTeam.map((e) => e.name).join(',') : '-';

    const calloutLine =
      callouts.length > 0
        ? callouts.map((c) => `${c.key}@${Math.round(c.x)},${Math.round(c.y)}`).join('; ')
        : 'AtkSpawn@50,85; Mid@50,50; DefSpawn@50,15';

    const prompt = [
      `Map:${mapName}(${sites.join('/')}) Side:${side} Eco:${economy}`,
      `Team:${teamLine}`,
      enemyLine !== '-' ? `Enemy:${enemyLine}` : '',
      `Callouts(0-100):${calloutLine}`,
      tags.length > 0 ? `Tags:${tags.join(',')}` : '',
      situation ? `Note:${situation}` : '',
      `Output concise Thai Buy-Phase orders per our agent + 2-4 key utilities using Callouts X,Y.`,
    ]
      .filter(Boolean)
      .join('\n');

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('REQUEST_TIMEOUT'));
      }, COACH_TIMEOUT_MS);
    });

    const generatePromise = ai.models.generateContent({
      model: COACH_MODEL,
      contents: prompt,
      config: {
        abortSignal: controller.signal,
        systemInstruction:
          'Valorant VCT Coach. Reply strict JSON in concise Thai for a 30s Buy Phase. Give 1 short command (<15 words) per team slot using real abilities and map Callout X,Y (5-95) plus moveToX/Y and 2-4 utilities.',
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategyName: { type: Type.STRING },
            headline: { type: Type.STRING },
            agentOrders: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slot: { type: Type.INTEGER },
                  agentName: { type: Type.STRING },
                  callout: { type: Type.STRING },
                  command: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  roleTone: { type: Type.STRING },
                  moveToX: { type: Type.NUMBER },
                  moveToY: { type: Type.NUMBER },
                },
                required: ['slot', 'agentName', 'callout', 'command', 'x', 'y', 'roleTone'],
              },
            },
            utilityPlacements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  kind: { type: Type.STRING },
                  label: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                },
                required: ['kind', 'label', 'x', 'y'],
              },
            },
          },
          required: ['strategyName', 'headline', 'agentOrders', 'utilityPlacements'],
        },
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      throw new Error('Gemini API ไม่ได้ส่งข้อความตอบกลับมา (empty response)');
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
    const rawMessage = formatErrorMessage(err);
    const status =
      typeof (err as { status?: unknown })?.status === 'number'
        ? (err as { status: number }).status
        : 0;

    if (rawMessage === 'MISSING_VITE_API_KEY') {
      throw new Error(
        'ไม่พบ API Key (VITE_GEMINI_API_KEY ว่างหรือเป็น undefined) — กรุณาตั้งค่า Environment Variable ชื่อ VITE_GEMINI_API_KEY บน Vercel หรือ .env แล้ว Redeploy'
      );
    }
    if (
      rawMessage === 'REQUEST_TIMEOUT' ||
      (err instanceof Error && err.name === 'AbortError')
    ) {
      throw new Error(
        'หมดเวลาการเชื่อมต่อ Gemini API (เกิน 15 วินาที) — กรุณากดขอคำสั่งใหม่อีกครั้ง'
      );
    }
    if (
      status === 403 ||
      rawMessage.includes('API_KEY_INVALID') ||
      rawMessage.includes('PERMISSION_DENIED') ||
      rawMessage.includes('API key not valid')
    ) {
      throw new Error(
        `API Key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน (${rawMessage})`
      );
    }
    if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error(`โควตา Gemini API เต็มชั่วคราว (${rawMessage})`);
    }
    if (status === 404 || rawMessage.includes('NOT_FOUND')) {
      throw new Error(`ไม่พบโมเดล ${COACH_MODEL} (${rawMessage})`);
    }
    throw new Error(`เกิดข้อผิดพลาดจาก Gemini API: ${rawMessage}`);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
