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

type ScenarioType =
  | 'anti_op'
  | 'anti_rush'
  | 'anti_flank'
  | 'anti_sentinel'
  | 'clear_corners'
  | 'fast_retake'
  | 'eco_force'
  | 'man_down'
  | 'default_exec';

function detectScenario(tags: string[], situation: string, economy: string, side: Side): ScenarioType {
  const text = `${tags.join(' ')} ${situation}`.toLowerCase();

  if (text.includes('op') || text.includes('สไน') || text.includes('operator') || text.includes('ดักยาว')) {
    return 'anti_op';
  }
  if (text.includes('บุกเร็ว') || text.includes('ดันสวน') || text.includes('rush') || text.includes('วิ่งชาร์จ')) {
    return 'anti_rush';
  }
  if (text.includes('ตุ๋ย') || text.includes('หลัง') || text.includes('flank') || text.includes('lurk')) {
    return 'anti_flank';
  }
  if (text.includes('cypher') || text.includes('kj') || text.includes('กับดัก') || text.includes('sentinel') || text.includes('ป้อม')) {
    return 'anti_sentinel';
  }
  if (text.includes('มุม') || text.includes('ดักยิง') || text.includes('แคมป์') || text.includes('ในไซต์') || text.includes('เคลียร์')) {
    return 'clear_corners';
  }
  if (text.includes('รีเทค') || text.includes('retake') || text.includes('กู้')) {
    return 'fast_retake';
  }
  if (
    text.includes('eco') ||
    text.includes('force') ||
    text.includes('เงินน้อย') ||
    text.includes('ปืนพก') ||
    economy.toLowerCase().includes('eco') ||
    economy.toLowerCase().includes('pistol')
  ) {
    return 'eco_force';
  }
  if (text.includes('เสียคน') || text.includes('4v5') || text.includes('ต้นรอบ') || text.includes('ตายก่อน')) {
    return 'man_down';
  }

  return side === 'attack' ? 'clear_corners' : 'default_exec';
}

function clamp(n: number): number {
  return Math.min(92, Math.max(8, Math.round(n)));
}

function pickCallout(callouts: CoachCalloutInput[], index: number, fallbackX: number, fallbackY: number) {
  if (callouts.length === 0) {
    return { key: 'จุดยุทธศาสตร์', x: fallbackX, y: fallbackY };
  }
  const c = callouts.at(index % callouts.length)!;
  return { key: c.key, x: clamp(c.x), y: clamp(c.y) };
}

function normalizeRole(role: string): 'duelist' | 'controller' | 'initiator' | 'sentinel' {
  const r = role.toLowerCase();
  if (r.includes('duel')) return 'duelist';
  if (r.includes('control') || r.includes('smoke')) return 'controller';
  if (r.includes('init')) return 'initiator';
  return 'sentinel';
}
export async function requestLiveCoachAdvice(
  input: LiveCoachRequest
): Promise<AiCoachResponse> {
  const mapName = input.mapName.trim();
  const situation = input.situation.trim();
  const tags = input.tags.filter((t) => t.trim().length > 0);

  if (!mapName) throw new Error('กรุณาระบุชื่อแผนที่');
  if (!situation && tags.length === 0) {
    throw new Error('กรุณาเลือก Tag ด่วน หรือพิมพ์สถานการณ์สั้นๆ ก่อนขอคำสั่ง');
  }

  await new Promise((r) => setTimeout(r, 250));

  const scenario = detectScenario(tags, situation, input.economy, input.side);
  const targetSite = input.sites?.at(0) || 'A';
  const altSite = input.sites?.at(1) || 'B';
  const isAttack = input.side === 'attack';

  const siteCallouts = input.callouts.filter((c) => c.group.toUpperCase().includes(targetSite.toUpperCase()));
  const midCallouts = input.callouts.filter((c) => c.group.toLowerCase().includes('mid'));
  const altCallouts = input.callouts.filter((c) => c.group.toUpperCase().includes(altSite.toUpperCase()));

  const basePool = siteCallouts.length >= 3 ? siteCallouts : input.callouts;

  const scenarioConfig: Record<
    ScenarioType,
    {
      name: string;
      headline: string;
      orders: Record<'duelist' | 'controller' | 'initiator' | 'sentinel', { cmd: string; tone: AiAgentOrder['roleTone'] }>;
      utils: { kind: AiUtilityPlacement['kind']; label: string }[];
    }
  > = {
    anti_op: {
      name: `แผนปิดมุมสไนเปอร์ (Anti-Operator ${targetSite})`,
      headline: `ห้ามเดินเช็กมุมยาวตัวเปล่า ให้ปา Smoke ปิดเส้นเล็ง Operator ก่อนเข้ายึดพื้นที่ ${targetSite}`,
      orders: {
        controller: { cmd: `ปา Smoke ปิดมุมสไนยาวหน้าไซต์ ${targetSite} ทันที`, tone: 'attack' },
        initiator: { cmd: `ยิงแฟลชหรือสกิลเช็กมุม Operator ก่อนเพื่อนเดินออก`, tone: 'attack' },
        duelist: { cmd: `ใช้สกิลพุ่งตัดหน้าเข้าประชิดหลัง Smoke ขึ้น`, tone: 'attack' },
        sentinel: { cmd: `วางกับดักกันหลังแล้วตามเทรดเพื่อนจังหวะเข้าไซต์`, tone: 'defense' },
      },
      utils: [
        { kind: 'smoke', label: 'Smoke ปิดมุม Op' },
        { kind: 'flash', label: 'Flash เปิดทาง' },
      ],
    },
    anti_rush: {
      name: `แผนตั้งรับชะลอเกมบุกเร็ว (Anti-Rush Setup)`,
      headline: `ถอยตั้งหลักลึกในไซต์ ใช้สกิลเผาพื้นและควันตัดจังหวะไม่ให้ศัตรูวิ่งกรูเข้ามาได้`,
      orders: {
        controller: { cmd: `ปา Smoke ปิดปากทางเข้าหลักทันทีที่ได้ยินเสียงวิ่ง`, tone: 'defense' },
        sentinel: { cmd: `ถอยหลังกับดัก รอศัตรูติดสโลว์แล้วค่อยเปิดยิงครอสไฟร์`, tone: 'defense' },
        initiator: { cmd: `ปาสกิลแฟลชสวนควันจังหวะศัตรูกำลังดันทะลุ`, tone: 'warning' },
        duelist: { cmd: `ยืนมุม Off-angle เก็บคิลแรกแล้วรีบถอยเข้าที่กำบัง`, tone: 'defense' },
      },
      utils: [
        { kind: 'smoke', label: 'Smoke ตัดหน้าทางเข้า' },
        { kind: 'molly', label: 'Molly เผาพื้นชะลอ' },
      ],
    },
    anti_flank: {
      name: `แผนล็อกหลังและดักตุ๋ย (Anti-Flank Lockdown)`,
      headline: `วางระบบเตือนภัยด้านหลังให้ครบก่อนเดินหน้า และจัดตัวดักเก็บศัตรูที่แอบอ้อมหลัง`,
      orders: {
        sentinel: { cmd: `วางกับดักปิดทางอ้อมหลังให้ครบ ห้ามปล่อยช่องว่าง`, tone: 'lurk' },
        controller: { cmd: `คุมพื้นที่กลางแผนที่ คอยเช็กเสียงฝีเท้าฝั่งตุ๋ยหลัง`, tone: 'lurk' },
        initiator: { cmd: `เช็กมุมอับด้านหลังด้วยสกิลสแกนก่อนเริ่มบุก`, tone: 'warning' },
        duelist: { cmd: `นำทีมเข้ายึดพื้นที่ด้านหน้าให้ไวก่อนโดนประกบ`, tone: 'attack' },
      },
      utils: [
        { kind: 'pin', label: 'จุดวางกับดักกันตุ๋ย' },
        { kind: 'recon', label: 'เช็กเสียง/สแกนหลัง' },
      ],
    },
    anti_sentinel: {
      name: `แผนทำลายกับดักก่อนเข้าไซต์ (Anti-Sentinel Breach)`,
      headline: `ห้ามวิ่งชนกับดัก Cypher/KJ ให้ใช้สกิลทำลายกับดักหน้าทางเข้าให้หมดก่อนเปิดเกมบุก`,
      orders: {
        initiator: { cmd: `ใช้สกิลทำลายกับดัก/ป้อมปืนหน้าทางเข้า ${targetSite} ก่อน`, tone: 'attack' },
        duelist: { cmd: `รอเสียงกับดักแตกแล้วค่อยพุ่งเปิดพื้นที่เข้าไซต์`, tone: 'attack' },
        controller: { cmd: `ปา Smoke บังมุมยิงของตัว Sentinel ฝั่งตรงข้าม`, tone: 'attack' },
        sentinel: { cmd: `ถือมุมคุมหลังและเตรียมวาง Spike ทันทีที่เคลียร์กับดัก`, tone: 'defense' },
      },
      utils: [
        { kind: 'molly', label: 'ทำลายกับดักหน้าประตู' },
        { kind: 'smoke', label: 'บังมุม Sentinel' },
      ],
    },
    clear_corners: {
      name: `แผนเคลียร์มุมอับเป็นระบบ (Systematic Site Clear)`,
      headline: `แก้ทางศัตรูดักยิงตามมุมด้วยการใช้สกิลบังคับให้ออกจากที่ซ่อน และเดินคู่กันเพื่อเทรดคิล`,
      orders: {
        initiator: { cmd: `ยิงสแกนหรือปาระเบิดไล่ศัตรูออกจากมุมอับในไซต์ ${targetSite}`, tone: 'attack' },
        duelist: { cmd: `เข้าเปิดมุมแรกพร้อมเพื่อนตามติดระยะเทรดคิลทันที`, tone: 'attack' },
        controller: { cmd: `ปา Smoke ปิดทางเสริมของศัตรูไม่ให้ยิงซ้อนได้`, tone: 'attack' },
        sentinel: { cmd: `เคลียร์มุมใกล้ตัวทางซ้าย-ขวาให้ชัวร์ก่อนวาง Spike`, tone: 'defense' },
      },
      utils: [
        { kind: 'recon', label: 'สแกนเช็กมุมอับ' },
        { kind: 'molly', label: 'ไล่ตัวแคมป์มุม' },
      ],
    },
    fast_retake: {
      name: `แผนรวมพลรีเทคพร้อมกัน (5-Man Coordinated Retake)`,
      headline: `ห้ามทยอยเดินเข้าไปตายทีละคน ให้รอรวมตัวหน้าทางเข้า ${targetSite} แล้วยิงสกิลเข้าพร้อมกัน`,
      orders: {
        controller: { cmd: `ปา Smoke ปิดมุมหลังไซต์และบังตัวถือ Spike ทันที`, tone: 'attack' },
        initiator: { cmd: `เปิดแฟลชและสกิลสแกนเข้าไซต์พร้อมสัญญาณบุก`, tone: 'attack' },
        duelist: { cmd: `พุ่งนำเข้าเคลียร์ตัวในไซต์ให้เพื่อนเข้ากู้ Spike`, tone: 'attack' },
        sentinel: { cmd: `คุมหลังทางเข้าและเข้ากดกู้ Spike ทันทีที่เคลียร์มุม`, tone: 'defense' },
      },
      utils: [
        { kind: 'smoke', label: 'Smoke บังจุดกู้ Spike' },
        { kind: 'flash', label: 'Flash รีเทคพร้อมกัน' },
      ],
    },
    eco_force: {
      name: `แผนปืนพก/ประหยัดงบ (Close-Range Stack & Trade)`,
      headline: `งบจำกัดห้ามดวลระยะไกล ให้รวมกลุ่มดักซุ่มมุมแคบ 2-3 คนเพื่อรุมยิงชิงปืนศัตรู`,
      orders: {
        duelist: { cmd: `ดักมุมประชิดระยะเผาขน รอจังหวะศัตรูเดินผ่านค่อยยิง`, tone: 'lurk' },
        controller: { cmd: `ปา Smoke บีบพื้นที่ให้ศัตรูต้องเดินเข้ามาในระยะปืนพก`, tone: 'defense' },
        initiator: { cmd: `ปาแฟลชระยะใกล้ให้เพื่อนโผล่รุมยิงพร้อมกัน 2 คน`, tone: 'attack' },
        sentinel: { cmd: `ซ่อนตัวมุมอับ รอเก็บปืนศัตรูที่ล้มแล้วถอยตั้งหลัก`, tone: 'lurk' },
      },
      utils: [
        { kind: 'smoke', label: 'Smoke บีบระยะประชิด' },
        { kind: 'flash', label: 'Flash เปิดรุมยิง' },
      ],
    },
    man_down: {
      name: `แผนแก้เกมคนน้อยกว่า (4v5 High-Risk Play)`,
      headline: `เสียเปรียบจำนวนคนต้องเล่นเสี่ยงเพื่อดึงสมดุลคืน ให้รวมกลุ่ม 3 คนเจาะจุดเดียวให้ไวที่สุด`,
      orders: {
        duelist: { cmd: `นำกลุ่ม 3 คนเจาะเข้าจุดที่ศัตรูเฝ้าน้อยที่สุดทันที`, tone: 'attack' },
        initiator: { cmd: `ทุ่มสกิลทั้งหมดเปิดทางให้ได้คิลคืน 1 ตัวโดยเร็ว`, tone: 'attack' },
        controller: { cmd: `ปา Smoke หลอกอีกฝั่งแล้วตามสมทบกลุ่มหลักทันที`, tone: 'lurk' },
        sentinel: { cmd: `ดักตัดตัวหมุนเกมของศัตรูตรงกลางแผนที่`, tone: 'lurk' },
      },
      utils: [
        { kind: 'smoke', label: 'Smoke หลอกดึงความสนใจ' },
        { kind: 'flash', label: 'Flash เจาะทะลวง' },
      ],
    },
    default_exec: {
      name: `แผนคุมพื้นที่มาตรฐาน (Balanced ${mapName} Control)`,
      headline: `กระจายตัวคุมข้อมูลต้นรอบให้ครบ อย่าเพิ่งทุ่มสกิลหมดจนกว่าจะรู้ตำแหน่งหลักของศัตรู`,
      orders: {
        initiator: { cmd: `ใช้สกิลเช็กข้อมูลต้นรอบหน้าจุดปะทะหลัก`, tone: 'defense' },
        controller: { cmd: `ยืนตำแหน่งกลางแผนที่ พร้อมปา Smoke ช่วยทั้งสองฝั่ง`, tone: 'defense' },
        duelist: { cmd: `เช็กจังหวะต้นรอบ ถ้าไม่เจอใครให้เตรียมหมุนช่วยเพื่อน`, tone: 'attack' },
        sentinel: { cmd: `เฝ้าไซต์ ${altSite} ด้วยกับดักและถ่วงเวลาหากศัตรูบุก`, tone: 'defense' },
      },
      utils: [
        { kind: 'recon', label: 'สแกนเช็กข้อมูลต้นรอบ' },
        { kind: 'smoke', label: 'Smoke คุมพื้นที่กลาง' },
      ],
    },
  };

  const chosen = scenarioConfig[scenario];

  const activeTeam = input.ourTeam.slice(0, 5);
  const agentOrders: AiAgentOrder[] = activeTeam.map((agent, idx) => {
    const roleKey = normalizeRole(agent.role);
    const template = chosen.orders[roleKey];

    const pool =
      roleKey === 'sentinel' && !isAttack && altCallouts.length > 0
        ? altCallouts
        : roleKey === 'controller' && midCallouts.length > 0
        ? midCallouts
        : basePool;

    const spot = pickCallout(pool, idx, 30 + idx * 10, 45 + (idx % 2) * 15);
    const moveTarget = pickCallout(basePool, idx + 1, clamp(spot.x + 8), clamp(spot.y - 8));

    return {
      slot: agent.slot,
      agentId: agent.id,
      agentName: agent.name,
      callout: spot.key,
      command: template.cmd,
      x: spot.x,
      y: spot.y,
      roleTone: template.tone,
      moveToX: moveTarget.x,
      moveToY: moveTarget.y,
    };
  });

  const utilityPlacements: AiUtilityPlacement[] = chosen.utils.map((u, idx) => {
    const spot = pickCallout(basePool, idx, 45 + idx * 10, 40 + idx * 10);
    return {
      kind: u.kind,
      label: u.label,
      x: clamp(spot.x + 3),
      y: clamp(spot.y - 3),
    };
  });

  if (isAttack && scenario !== 'anti_rush' && scenario !== 'fast_retake') {
    const plantSpot = pickCallout(basePool, 0, 50, 45);
    utilityPlacements.push({
      kind: 'spike',
      label: `จุดวาง Spike (${targetSite})`,
      x: plantSpot.x,
      y: plantSpot.y,
    });
  }

  return {
    strategyName: chosen.name,
    headline: chosen.headline,
    agentOrders,
    utilityPlacements,
  };
}
