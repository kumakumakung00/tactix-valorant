import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

interface CoachTeamAgentInput {
  slot: number;
  id: string;
  name: string;
  role: string;
  abilities?: string[];
}

interface CoachEnemyAgentInput {
  name: string;
  role: string;
}

interface CoachCalloutInput {
  key: string;
  group: string;
  x: number;
  y: number;
}

interface LiveCoachRequestBody {
  mapName?: string;
  sites?: string[];
  side?: 'attack' | 'defense';
  economy?: string;
  ourTeam?: CoachTeamAgentInput[];
  enemyTeam?: CoachEnemyAgentInput[];
  callouts?: CoachCalloutInput[];
  situation?: string;
  tags?: string[];
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

function clampCoord(val: unknown, fallback = 50): number {
  const num = typeof val === 'number' && Number.isFinite(val) ? val : fallback;
  return Number(Math.min(95, Math.max(5, num)).toFixed(1));
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
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

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/live-coach', async (req, res) => {
    try {
      const body = (req.body ?? {}) as LiveCoachRequestBody;
      const mapName = typeof body.mapName === 'string' ? body.mapName.trim() : '';
      const side = body.side === 'defense' ? 'defense' : 'attack';
      const economy = typeof body.economy === 'string' ? body.economy.trim() : 'full';
      const situation = typeof body.situation === 'string' ? body.situation.trim() : '';
      const tags = Array.isArray(body.tags)
        ? body.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).slice(0, 12)
        : [];

      if (!mapName) {
        return res.status(400).json({ error: 'กรุณาระบุชื่อแผนที่' });
      }
      if (!situation && tags.length === 0) {
        return res.status(400).json({ error: 'กรุณาพิมพ์สถานการณ์หรือเลือก Tag ปัญหาอย่างน้อย 1 ข้อ' });
      }

      const ourTeam = Array.isArray(body.ourTeam) ? body.ourTeam.slice(0, 5) : [];
      const enemyTeam = Array.isArray(body.enemyTeam) ? body.enemyTeam.slice(0, 5) : [];
      const callouts = Array.isArray(body.callouts) ? body.callouts.slice(0, 60) : [];
      const sites = Array.isArray(body.sites) ? body.sites : ['A', 'B'];

      const ai = getAiClient();

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

      const response = await callGeminiWithRetry(ai, {
        model: 'gemini-3.8-flash',
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
        return res.status(502).json({ error: 'AI ไม่ได้ส่งคำตอบกลับมา กรุณาลองใหม่อีกครั้ง' });
      }

      const parsed = JSON.parse(rawText) as RawCoachResponse;

      const agentOrders = (Array.isArray(parsed.agentOrders) ? parsed.agentOrders : []).map(
        (order, idx) => {
          const matchedAgent =
            ourTeam.find((a) => a.slot === order.slot) ?? ourTeam[idx];
          const toneRaw = typeof order.roleTone === 'string' ? order.roleTone.toLowerCase() : '';
          const roleTone = VALID_TONES.has(toneRaw)
            ? (toneRaw as 'attack' | 'defense' | 'lurk' | 'warning')
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
        }
      );

      const utilityPlacements = (
        Array.isArray(parsed.utilityPlacements) ? parsed.utilityPlacements : []
      )
        .slice(0, 6)
        .map((u) => {
          const kindRaw = typeof u.kind === 'string' ? u.kind.toLowerCase() : 'pin';
          const kind = VALID_UTILITY_KINDS.has(kindRaw)
            ? (kindRaw as 'smoke' | 'flash' | 'recon' | 'molly' | 'wall' | 'spike' | 'pin')
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

      return res.json({
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
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        typeof (err as { status?: unknown })?.status === 'number'
          ? (err as { status: number }).status
          : 500;

      if (message === 'MISSING_API_KEY') {
        return res.status(503).json({
          error:
            'ยังไม่ได้ตั้งค่า GEMINI_API_KEY บนเซิร์ฟเวอร์ — กรุณาเพิ่มคีย์ใน Settings > Secrets',
        });
      }
      if (
        status === 403 ||
        message.includes('API_KEY_INVALID') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('API key not valid')
      ) {
        return res.status(403).json({
          error:
            'GEMINI_API_KEY ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน — กรุณาตรวจสอบใน Settings > Secrets',
          detail: message,
        });
      }
      if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({
          error: 'โควตาการใช้งาน Gemini API เต็มชั่วคราว กรุณารอสักครู่แล้วลองใหม่',
          detail: message,
        });
      }
      if (status === 404 || message.includes('NOT_FOUND')) {
        return res.status(404).json({
          error: 'ไม่พบโมเดล AI ที่ระบุบน Gemini API',
          detail: message,
        });
      }
      if (status === 503 || message.includes('UNAVAILABLE') || message.includes('high demand')) {
        return res.status(503).json({
          error: 'เซิร์ฟเวอร์ Gemini AI มีผู้ใช้งานหนาแน่นชั่วคราว กรุณากดส่งอีกครั้งในอีกสักครู่',
          detail: message,
        });
      }
      console.error('[/api/live-coach] error:', err);
      return res.status(status >= 400 && status < 600 ? status : 500).json({
        error: `เชื่อมต่อ AI Coach ไม่สำเร็จ (${status}): ${message}`,
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        const template = fs.readFileSync(indexPath, 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TACTIX server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp();
