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

const COACH_TIMEOUT_MS = 60_000;

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

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('REQUEST_TIMEOUT'));
      }, COACH_TIMEOUT_MS);
    });

    const fetchPromise = fetch('/api/live-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        mapName,
        sites: input.sites,
        side: input.side,
        economy: input.economy,
        ourTeam: input.ourTeam.slice(0, 5),
        enemyTeam: input.enemyTeam.slice(0, 5),
        callouts: input.callouts.slice(0, 20),
        situation,
        tags,
      }),
    });

    const res = await Promise.race([fetchPromise, timeoutPromise]);
    const rawBody = await res.text();

    let data: (Partial<AiCoachResponse> & { error?: string }) | null = null;
    try {
      data = JSON.parse(rawBody) as Partial<AiCoachResponse> & { error?: string };
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(
        data?.error ||
          `เซิร์ฟเวอร์ตอบกลับผิดพลาด (${res.status}): ${rawBody.slice(0, 160) || res.statusText}`
      );
    }

    if (!data) {
      throw new Error('รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
    }

    return {
      strategyName: data.strategyName || 'แผนแก้เกม AI Coach',
      headline: data.headline || 'ปรับตำแหน่งตามคำสั่งโค้ชด้านล่างทันที',
      agentOrders: Array.isArray(data.agentOrders) ? data.agentOrders : [],
      utilityPlacements: Array.isArray(data.utilityPlacements) ? data.utilityPlacements : [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message === 'REQUEST_TIMEOUT' ||
      (err instanceof Error && err.name === 'AbortError')
    ) {
      throw new Error(
        'หมดเวลาการเชื่อมต่อ Gemini API (เกิน 60 วินาที) — กรุณากดขอคำสั่งใหม่อีกครั้ง'
      );
    }
    throw err instanceof Error ? err : new Error(message);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
