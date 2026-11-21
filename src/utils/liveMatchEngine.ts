import {
  Agent,
  BoardElements,
  BoardMarker,
  LiveMatchEconomy,
  LiveMatchProblemId,
  MapCallout,
  RouteStroke,
  Side,
  ValorantMap,
} from '../types/tactix';

export interface LiveMatchEconomyMeta {
  id: LiveMatchEconomy;
  label: string;
  th: string;
  warning: string;
  buyTip: string;
}

export const LIVE_MATCH_ECONOMIES: LiveMatchEconomyMeta[] = [
  {
    id: 'pistol',
    label: 'Pistol',
    th: 'รอบปืนพก',
    warning: 'เน้นปืนสั้น + เกราะเล็ก/สกิลสำคัญ ห้ามแยกเดินเดี่ยว',
    buyTip: 'จับคู่ยิงเทรดเป็นกลุ่ม 2–3 คน ลดระยะดวลกับ Ghost/Sheriff',
  },
  {
    id: 'eco',
    label: 'Eco',
    th: 'รอบประหยัด',
    warning: 'รวมกลุ่มซ้อน 2–3 คนในมุมแคบ เพื่อรุมยิงชิงปืน Rifle',
    buyTip: 'ห้ามเปิดหน้าแลกไกลเด็ดขาด — เน้นดักเก็บปืนหรือทำให้ศัตรูเสียเงิน',
  },
  {
    id: 'bonus',
    label: 'Bonus',
    th: 'รอบโบนัส',
    warning: 'ถือ SMG/ปืนเหลือจากรอบก่อน อย่าดวลมุมโล่งระยะไกล',
    buyTip: 'ใช้สกิลย่นระยะเข้าประชิด เพื่อตัดปืน Vandal/Phantom ของอีกฝั่งให้มากที่สุด',
  },
  {
    id: 'full',
    label: 'Full Buy',
    th: 'ซื้อเต็ม',
    warning: 'สกิลและอาวุธครบ — เช็กข้อมูลก่อนเข้าปะทะทุกครั้ง',
    buyTip: 'ประสาน Flash/Smoke/Recon ตามตำแหน่ง ไม่เสียตัวฟรีต้นรอบ',
  },
];

export interface LiveMatchProblemMeta {
  id: LiveMatchProblemId;
  side: Side;
  title: string;
  symptom: string;
  counterName: string;
}

export const LIVE_MATCH_PROBLEMS: LiveMatchProblemMeta[] = [
  // Attack Side Problems
  {
    id: 'atk_stuck_traps',
    side: 'attack',
    title: 'บุกไม่เข้า / ติดกับดักเต็มไซท์',
    symptom: 'โดนสาย Cypher, ป้อม Killjoy หรือม่าน/ไฟขวางหน้าประตูจนเดินต่อไม่ได้',
    counterName: 'ย้ายไซท์ + พังกับดักก่อนเข้า & Split ทาง Mid',
  },
  {
    id: 'atk_op_locked',
    side: 'attack',
    title: 'โดน Operator ดักยิงมุมยาว',
    symptom: 'โผล่มุม Main/Long ทีไรโดนสไนเปอร์สอยร่วงก่อนเพื่อนเข้าถึงไซท์',
    counterName: 'Smoke ตัดเส้น + Flash เบียดมุมใกล้ (ห้าม Dry Peek)',
  },
  {
    id: 'atk_flanked',
    side: 'attack',
    title: 'โดนตุ๋ยหลัง / ถูกล้วง Flank ตลอด',
    symptom: 'กำลังปักหรือเดินเข้าไซท์แล้วโดนศัตรูอ้อมมายิงหลังแตกยกตี้',
    counterName: 'วาง Anti-Flank รอเช็ก 10 วิ + ปักกับดักปิดหลัง',
  },
  {
    id: 'atk_def_aggro',
    side: 'attack',
    title: 'ฝั่งรับดันสวนเร็ว / โดนซ้อนหน้าประตู',
    symptom: 'เริ่มรอบไม่กี่วิฝั่งรับโถมออกมาชิงพื้นที่หน้า Lobby จนเสียคนฟรี',
    counterName: 'หยุดดัก Hold Default 15 วิแรกแล้วเทรดตัวฟีด',
  },
  {
    id: 'atk_rotate_late',
    side: 'attack',
    title: 'ฝั่งรับหมุนซ้อนไว / รีเทคแพ้ตลอด',
    symptom: 'กว่าจะเข้าไซท์ได้อีกฝั่งมารวมครบ 4–5 คนหรือโดนรีเทคตายหมด',
    counterName: 'ปาสกิลหลอกดึงคน + ปิด Smoke ทาง CT/Link แล้วปักไว',
  },

  // Defense Side Problems
  {
    id: 'def_fast_rush',
    side: 'defense',
    title: 'ศัตรูโถมเข้าไซท์เร็ว 5 คน',
    symptom: 'อีกฝั่งบุกกรูเข้ามาทีเดียวพร้อม Flash จนคนเฝ้าไซท์ตายก่อนเพื่อนหมุนทัน',
    counterName: 'ปา Smoke+Molly ขวางหน้าประตูแล้วถอย Crossfire มุมลึก',
  },
  {
    id: 'def_fake_heavy',
    side: 'defense',
    title: 'ศัตรูชอบหลอก Fake แล้วสลับไซท์',
    symptom: 'หลงเสียงสกิลรีบหมุนไปช่วย แล้วโดนอีกฝั่งแอบไปวาง Spike ไซท์ว่าง',
    counterName: 'ห้ามทิ้งไซท์จนกว่าจะเห็น Spike + ส่ง 1 ตัวเช็กข่าวฝั่งเงียบ',
  },
  {
    id: 'def_mid_control',
    side: 'defense',
    title: 'เสียพื้นที่ Mid โดน Split สองทาง',
    symptom: 'อีกฝั่งยึด Mid ได้ทุกรอบแล้วตีโอบเข้าไซท์จากทาง Link ด้านข้างพร้อมกัน',
    counterName: 'นัด 2 คนชิง Mid ต้นรอบด้วย Flash/Recon + Smoke ปิดทางขึ้น',
  },
  {
    id: 'def_postplant_lose',
    side: 'defense',
    title: 'เข้า Retake หลังวาง Spike ไม่ไหว',
    symptom: 'อีกฝั่งปัก Spike แล้วถอยดัก/ยิง Lineup จนทีมเดินเข้าไปตายทีละคน',
    counterName: 'รวมทีมเข้า 2 ทางพร้อม Smoke คลุม Spike + แตะหลอกก่อนเคลียร์มุม',
  },
  {
    id: 'def_man_down',
    side: 'defense',
    title: 'เพื่อนตายต้นรอบบ่อย / เสียเปรียบ 4v5',
    symptom: 'เปิดหน้าดวลต้นรอบแล้วพลาดแพ้ ทำให้ต้องตั้งรับแบบคนน้อยกว่าตลอด',
    counterName: 'ถอยมารวมตัวในไซท์ห้ามดวลเดี่ยว · เน้น Stack หรือ Retake 4 คน',
  },
];

export function getProblemsForSide(side: Side): LiveMatchProblemMeta[] {
  return LIVE_MATCH_PROBLEMS.filter((p) => p.side === side);
}

export interface LiveMatchCommand {
  head: string;
  detail: string;
  actor?: string;
}

export interface LiveMatchCounterOutput {
  problem: LiveMatchProblemMeta;
  headline: string;
  commands: LiveMatchCommand[];
  variation?: 1 | 2 | 3;
  elements: BoardElements;
}

export interface LiveMatchVariationMeta {
  id: 1 | 2 | 3;
  label: string;
  theme: string;
}

export const LIVE_MATCH_VARIATIONS: LiveMatchVariationMeta[] = [
  {
    id: 1,
    label: 'แบบที่ 1 · ตั้งรับซ้อนกัน',
    theme: 'รวมกลุ่มซ้อนกันที่จุดเดียว เล่น Crossfire รุมยิงพร้อมกัน',
  },
  {
    id: 2,
    label: 'แบบที่ 2 · ดันชิงพื้นที่ต้นรอบ',
    theme: 'ดันหน้าเร็วต้นรอบ ชิงพื้นที่กลางและทางเข้าไซท์ก่อนศัตรูตั้งตัว',
  },
  {
    id: 3,
    label: 'แบบที่ 3 · หลอกล่อสลับไซท์',
    theme: 'แยกกำลังหลอกสองฝั่ง ล่อให้ศัตรูหมุนแล้วสลับไปเจาะอีกไซท์',
  },
];

interface Pt {
  x: number;
  y: number;
  label?: string;
}

interface TransformSpec {
  foci: Pt[];
  markerT: number;
  strokeT: number;
}

function getVariationTransform(variation: 1 | 2 | 3, side: Side, a: MapAnchors): TransformSpec {
  if (variation === 1) {
    return side === 'attack'
      ? { foci: [a.bLobby, a.bMain, a.siteB], markerT: 0.6, strokeT: 0.45 }
      : { foci: [a.aBack, a.siteA, a.aLink], markerT: 0.6, strokeT: 0.45 };
  }
  if (variation === 2) {
    return side === 'attack'
      ? { foci: [a.mid, a.aMain, a.bMain], markerT: 0.5, strokeT: 0.4 }
      : { foci: [a.aMain, a.bMain, a.mid], markerT: 0.5, strokeT: 0.4 };
  }
  return side === 'attack'
    ? { foci: [a.aLobby, a.bLobby], markerT: 0.45, strokeT: 0.35 }
    : { foci: [a.siteA, a.siteB], markerT: 0.45, strokeT: 0.35 };
}

function getEconomyTransform(economy: LiveMatchEconomy, side: Side, a: MapAnchors): TransformSpec | null {
  switch (economy) {
    case 'eco':
      // รวมกลุ่มซุ่มมุมแคบ / บุกทางแคบทางเดียว
      return { foci: [a.mid, a.aMain, a.bMain], markerT: 0.38, strokeT: 0.3 };
    case 'bonus':
      // หลบมุมยิงระยะไกล (Off-angle)
      return side === 'attack'
        ? { foci: [a.aMain, a.bMain], markerT: 0.3, strokeT: 0.25 }
        : { foci: [a.aBack, a.bBack], markerT: 0.3, strokeT: 0.25 };
    case 'pistol':
      return side === 'attack'
        ? { foci: [a.atkSpawn], markerT: 0.22, strokeT: 0.15 }
        : { foci: [a.defSpawn], markerT: 0.22, strokeT: 0.15 };
    default:
      return null;
  }
}

function movePointToward(p: Pt, foci: Pt[], t: number): Pt {
  let nearest = foci[0];
  let best = Infinity;
  for (const f of foci) {
    const d = (f.x - p.x) ** 2 + (f.y - p.y) ** 2;
    if (d < best) {
      best = d;
      nearest = f;
    }
  }
  return lerpPt(p, nearest, t);
}

function applyTransforms(el: BoardElements, specs: TransformSpec[]): void {
  for (const m of el.markers) {
    if (m.kind !== 'position') continue;
    let p: Pt = { x: m.x, y: m.y };
    for (const s of specs) p = movePointToward(p, s.foci, s.markerT);
    m.x = p.x;
    m.y = p.y;
  }
  for (const st of el.strokes) {
    st.points = st.points.map((pt) => {
      let p: Pt = { x: pt.x, y: pt.y };
      for (const s of specs) p = movePointToward(p, s.foci, s.strokeT);
      return { x: p.x, y: p.y };
    });
  }
}

function clamp(v: number, min = 6, max = 94): number {
  return Math.min(max, Math.max(min, Number(v.toFixed(1))));
}

function lerpPt(a: Pt, b: Pt, t: number, label?: string): Pt {
  return {
    x: clamp(a.x + (b.x - a.x) * t),
    y: clamp(a.y + (b.y - a.y) * t),
    label,
  };
}

function offsetPt(p: Pt, dx: number, dy: number, label?: string): Pt {
  return {
    x: clamp(p.x + dx),
    y: clamp(p.y + dy),
    label: label ?? p.label,
  };
}

function rectCenterPct(rect: { x: number; y: number; w: number; h: number }): Pt {
  return {
    x: clamp(((rect.x + rect.w / 2) / 600) * 100),
    y: clamp(((rect.y + rect.h / 2) / 600) * 100),
  };
}

function pickCallout(
  callouts: MapCallout[],
  patterns: RegExp[],
  preferredGroup?: string
): Pt | null {
  const pool = preferredGroup
    ? [
        ...callouts.filter((c) => c.group.toLowerCase() === preferredGroup.toLowerCase()),
        ...callouts,
      ]
    : callouts;

  for (const rx of patterns) {
    const found = pool.find((c) => rx.test(c.key) || rx.test(c.name));
    if (found) {
      return { x: clamp(found.x), y: clamp(found.y), label: found.key };
    }
  }
  return null;
}

interface MapAnchors {
  isTdm: boolean;
  atkSpawn: Pt;
  defSpawn: Pt;
  siteA: Pt;
  siteB: Pt;
  mid: Pt;
  aMain: Pt;
  aLobby: Pt;
  aBack: Pt;
  aLink: Pt;
  bMain: Pt;
  bLobby: Pt;
  bBack: Pt;
  bLink: Pt;
}

function resolveMapAnchors(map: ValorantMap): MapAnchors {
  const isTdm = map.category === 'tdm';
  const callouts = map.callouts;

  const atkFallback = rectCenterPct(map.fallbackGeometry.attackerSpawn);
  const defFallback = rectCenterPct(map.fallbackGeometry.defenderSpawn);

  if (isTdm) {
    return {
      isTdm: true,
      atkSpawn: { x: 50, y: 82, label: 'จุดเกิดเรา' },
      defSpawn: { x: 50, y: 18, label: 'จุดเกิดศัตรู' },
      siteA: { x: 25, y: 48, label: 'เลนซ้าย' },
      siteB: { x: 75, y: 48, label: 'เลนขวา' },
      mid: { x: 50, y: 50, label: 'กลางสนาม' },
      aMain: { x: 25, y: 60, label: 'ซ้ายหน้า' },
      aLobby: { x: 28, y: 74, label: 'ฐานซ้าย' },
      aBack: { x: 25, y: 34, label: 'ซ้ายบน' },
      aLink: { x: 38, y: 48, label: 'เชื่อมซ้าย' },
      bMain: { x: 75, y: 60, label: 'ขวาหน้า' },
      bLobby: { x: 72, y: 74, label: 'ฐานขวา' },
      bBack: { x: 75, y: 34, label: 'ขวาบน' },
      bLink: { x: 62, y: 48, label: 'เชื่อมขวา' },
    };
  }

  const atkSpawn = pickCallout(callouts, [/atk/i, /attacker/i], 'Atk') ?? atkFallback;
  const defSpawn = pickCallout(callouts, [/def/i, /defender/i], 'Def') ?? defFallback;

  const fbSiteA = map.fallbackGeometry.sites[0]
    ? rectCenterPct(map.fallbackGeometry.sites[0])
    : { x: 26, y: 30 };
  const fbSiteB = map.fallbackGeometry.sites[1]
    ? rectCenterPct(map.fallbackGeometry.sites[1])
    : { x: 74, y: 30 };

  const siteA =
    pickCallout(callouts, [/^A\s+Site$/i, /site/i], 'A') ?? { ...fbSiteA, label: 'A Site' };
  const siteB =
    pickCallout(callouts, [/^B\s+Site$/i, /site/i], 'B') ?? { ...fbSiteB, label: 'B Site' };
  const mid =
    pickCallout(callouts, [/courtyard/i, /mid\s*top/i, /mid\s*bottom/i, /mid/i], 'Mid') ??
    lerpPt(atkSpawn, defSpawn, 0.5, 'Mid');

  const aMain =
    pickCallout(callouts, [/main/i, /long/i, /short/i, /bath/i, /cave/i, /ramp/i], 'A') ??
    lerpPt(siteA, atkSpawn, 0.34, 'A Main');
  const aLobby =
    pickCallout(callouts, [/lobby/i, /garden/i, /cave/i], 'A') ??
    lerpPt(siteA, atkSpawn, 0.62, 'A Lobby');
  const aBack =
    pickCallout(
      callouts,
      [/back/i, /tower/i, /heaven/i, /rafters/i, /elbow/i, /crane/i, /art/i, /screens/i],
      'A'
    ) ?? lerpPt(siteA, defSpawn, 0.28, 'A Back');
  const aLink =
    pickCallout(callouts, [/link/i, /tree/i, /window/i, /door/i, /garden/i], 'A') ??
    lerpPt(siteA, mid, 0.45, 'A Link');

  const bMain =
    pickCallout(callouts, [/main/i, /long/i, /short/i, /cave/i, /ramp/i], 'B') ??
    lerpPt(siteB, atkSpawn, 0.34, 'B Main');
  const bLobby =
    pickCallout(callouts, [/lobby/i, /fountain/i, /hall/i], 'B') ??
    lerpPt(siteB, atkSpawn, 0.62, 'B Lobby');
  const bBack =
    pickCallout(
      callouts,
      [/back/i, /tower/i, /heaven/i, /elbow/i, /boat/i, /arch/i, /alley/i],
      'B'
    ) ?? lerpPt(siteB, defSpawn, 0.28, 'B Back');
  const bLink =
    pickCallout(callouts, [/link/i, /window/i, /market/i, /garage/i, /drop/i], 'B') ??
    lerpPt(siteB, mid, 0.45, 'B Link');

  return {
    isTdm: false,
    atkSpawn,
    defSpawn,
    siteA,
    siteB,
    mid,
    aMain,
    aLobby,
    aBack,
    aLink,
    bMain,
    bLobby,
    bBack,
    bLink,
  };
}

function makePos(
  id: string,
  slotIndex: number,
  pt: Pt,
  label: string,
  ourTeam: (string | null)[],
  roleTone: 'attack' | 'defense' | 'lurk' | 'warning'
): BoardMarker {
  return {
    id,
    kind: 'position',
    x: pt.x,
    y: pt.y,
    slotNumber: slotIndex + 1,
    agentId: ourTeam[slotIndex] ?? undefined,
    team: 'our',
    label,
    roleTone,
  };
}

function makeRoute(id: string, pts: Pt[], color: string, dashed = true): RouteStroke {
  return {
    id,
    kind: 'route',
    points: pts.map((p) => ({ x: p.x, y: p.y })),
    color,
    dashed,
  };
}

function buildBaseCounterPlay({
  map,
  side,
  economy,
  problemId,
  ourTeam,
}: {
  map: ValorantMap;
  side: Side;
  economy: LiveMatchEconomy;
  problemId: LiveMatchProblemId;
  ourTeam: (string | null)[];
}): LiveMatchCounterOutput {
  const problem =
    LIVE_MATCH_PROBLEMS.find((p) => p.id === problemId) ?? getProblemsForSide(side)[0];
  const a = resolveMapAnchors(map);
  const strokes: RouteStroke[] = [];
  const markers: BoardMarker[] = [];

  const ecoSuffix =
    economy === 'eco'
      ? ' (รอบ Eco: เดินเกาะกลุ่ม 2–3 คนรุมชิงปืน)'
      : economy === 'bonus'
      ? ' (รอบ Bonus: บีบเข้าระยะประชิด)'
      : '';

  switch (problem.id) {
    case 'atk_stuck_traps': {
      const p1 = offsetPt(a.aLobby, -2, 1);
      const p2 = offsetPt(a.mid, -2.5, 2);
      const p3 = offsetPt(a.mid, 2.5, 1);
      const p4 = offsetPt(a.bLobby, -2.2, 1);
      const p5 = offsetPt(a.bLobby, 2.4, 2);
      markers.push(
        makePos('lm-1', 0, p1, 'ปาสกิลหลอก A', ourTeam, 'lurk'),
        makePos('lm-2', 1, p2, 'ยึด Mid', ourTeam, 'attack'),
        makePos('lm-3', 2, p3, 'เจาะ Link บีบหลัง', ourTeam, 'attack'),
        makePos('lm-4', 3, p4, 'ยิงพังสาย B', ourTeam, 'attack'),
        makePos('lm-5', 4, p5, 'เข้าไซท์ B', ourTeam, 'attack'),
        { id: 'lm-rec', kind: 'recon', x: a.bMain.x, y: a.bMain.y, label: 'สกิลเช็คกับดัก' },
        { id: 'lm-smk', kind: 'smoke', x: a.bBack.x, y: a.bBack.y, label: 'Smoke ปิดหลัง' }
      );
      strokes.push(
        makeRoute('lm-r1', [p2, a.bLink, a.siteB], '#34D399'),
        makeRoute('lm-r2', [p4, a.bMain, a.siteB], '#FF4655'),
        makeRoute('lm-r3', [p1, lerpPt(p1, a.aMain, 0.5)], '#FBBF24')
      );
      return {
        problem,
        headline: `เลี่ยงจุดกับดักหนา — สลับไปเจาะ Split อีกไซท์พร้อมสกิลพังสาย${ecoSuffix}`,
        commands: [
          {
            head: 'ปาเสียงหลอกแล้วสลับไปอีกไซท์ทันที',
            detail: 'ส่ง 1 คนกดสกิลหลอกหน้าไซท์เดิม ดึงตัว Sentinel/เพื่อนให้ค้างอยู่จุดนั้น',
          },
          {
            head: 'พังกับดักด้วยสกิลก่อนเดินเข้าเสมอ',
            detail: 'ใช้ Shock Dart, Grenade หรือ Drone เคลียร์สาย/ป้อมหน้าประตูห้ามเดินชนดื้อๆ',
          },
          {
            head: 'ส่ง 2 ตัวเจาะ Mid/Link ตีโอบหลังไซท์',
            detail: 'บีบให้คนกันไซท์ต้องหันรับ 2 ด้านจนทิ้งจุดซ่อนกับดัก',
          },
        ],
        elements: { strokes, markers },
      };
    }

    case 'atk_op_locked': {
      const p1 = offsetPt(a.aLobby, 0, 2);
      const p2 = offsetPt(a.mid, -2.5, 2.5);
      const p3 = offsetPt(a.mid, 2.5, 2);
      const p4 = offsetPt(a.aLink, -2, 3);
      const p5 = offsetPt(a.bLobby, 0, 2);
      markers.push(
        makePos('lm-1', 0, p1, 'ปา Smoke/Flash', ourTeam, 'attack'),
        makePos('lm-2', 1, p2, 'ชิงระยะใกล้ Mid', ourTeam, 'attack'),
        makePos('lm-3', 2, p3, 'ตามเทรด', ourTeam, 'attack'),
        makePos('lm-4', 3, p4, 'โอบทางแคบ', ourTeam, 'attack'),
        makePos('lm-5', 4, p5, 'ดักทางหมุน', ourTeam, 'lurk'),
        { id: 'lm-smk1', kind: 'smoke', x: a.aMain.x, y: a.aMain.y, label: 'ตัดเส้น Op' },
        { id: 'lm-fl1', kind: 'flash', x: a.mid.x, y: a.mid.y, label: 'Flash ไล่มุม' }
      );
      strokes.push(
        makeRoute('lm-r1', [p2, a.aLink, a.siteA], '#34D399'),
        makeRoute('lm-r2', [p1, lerpPt(a.aMain, a.siteA, 0.35)], '#FF4655')
      );
      return {
        problem,
        headline: `ห้าม Dry Peek มุมยาวเดี่ยว — ตัดสายตาด้วย Smoke แล้วเข้าทางแคบ${ecoSuffix}`,
        commands: [
          {
            head: 'ห้ามโผล่มุมยาวตัวเปล่าเด็ดขาด!',
            detail: 'ลง Smoke ปิดเส้นเล็งสไนเปอร์หรือกดกำแพงบังก่อนข้ามช่องเปิดทุกครั้ง',
          },
          {
            head: 'ปา Flash หรือหมา/โดรนไล่คนถือ Op',
            detail: 'บังคับให้ Operator ยิงพลาดหรือถอยหนีออกจากมุมแรกก่อนเดินต่อ',
          },
          {
            head: 'เปลี่ยนมาเข้าทางแคบ (Short / Mid)',
            detail: 'บีบไฟต์เข้าระยะใกล้-กลางเพื่อให้ปืนสไนเปอร์เล่นยากที่สุด',
          },
        ],
        elements: { strokes, markers },
      };
    }

    case 'atk_flanked': {
      const watchPt = lerpPt(a.atkSpawn, a.aLobby, 0.45);
      const p1 = offsetPt(a.aMain, -2, 2);
      const p2 = offsetPt(a.aMain, 2.5, 2);
      const p3 = offsetPt(a.aLink, -1.5, 2);
      const p4 = offsetPt(a.mid, 2, 2);
      const p5 = watchPt;
      markers.push(
        makePos('lm-1', 0, p1, 'นำเข้าไซท์', ourTeam, 'attack'),
        makePos('lm-2', 1, p2, 'ตามเทรด', ourTeam, 'attack'),
        makePos('lm-3', 2, p3, 'เจาะ Link', ourTeam, 'attack'),
        makePos('lm-4', 3, p4, 'ปิดมุม Mid', ourTeam, 'attack'),
        makePos('lm-5', 4, p5, 'Anti-Flank รอ 10 วิ', ourTeam, 'lurk'),
        { id: 'lm-pin1', kind: 'pin', x: a.bLobby.x, y: a.bLobby.y, label: 'วางกับดักกันหลัง' }
      );
      strokes.push(
        makeRoute('lm-r1', [p1, a.siteA], '#FF4655'),
        makeRoute('lm-r2', [p3, a.siteA], '#34D399'),
        makeRoute('lm-r3', [a.bLobby, p5], '#FB923C')
      );
      return {
        problem,
        headline: `วางคนรอเช็กหลัง 10 วิแรก + ปักกับดักปิดเส้นก่อนเข้าไซท์${ecoSuffix}`,
        commands: [
          {
            head: 'ทิ้ง 1 คนยืนเช็กหลังนิ่งๆ (Anti-Flank)',
            detail: 'ให้คนหลังรอฟังเสียงวิ่งอ้อม 8–10 วินาที ดักเก็บตัวล้วงฟรี 1 คิลก่อนตามทีม',
          },
          {
            head: 'วางกับดัก / ปิดเสียงจุดเดินอ้อม',
            detail: 'ใช้ Trapwire, Alarmbot หรือ Smoke ปิดเส้นที่ศัตรูเคยอ้อมมาทุกครั้ง',
          },
          {
            head: 'ตัดสินใจเข้าไซท์ให้ไว อย่ายืนแช่หน้าประตู',
            detail: 'เมื่อปาสกิลเปิดแล้วให้เข้าพร้อมกันทันที ไม่ปล่อยเวลาให้อีกฝั่งอ้อมถึงหลัง',
          },
        ],
        elements: { strokes, markers },
      };
    }

    case 'atk_def_aggro': {
      const p1 = offsetPt(a.aLobby, -3, 3);
      const p2 = offsetPt(a.aLobby, 3, 2);
      const p3 = offsetPt(a.mid, -3, 5);
      const p4 = offsetPt(a.bLobby, -2.5, 3);
      const p5 = offsetPt(a.bLobby, 3, 3);
      markers.push(
        makePos('lm-1', 0, p1, 'ดักคู่หน้า A #1', ourTeam, 'warning'),
        makePos('lm-2', 1, p2, 'ซ้อนเทรด A #2', ourTeam, 'warning'),
        makePos('lm-3', 2, p3, 'ดักคนดัน Mid', ourTeam, 'attack'),
        makePos('lm-4', 3, p4, 'ดักคู่หน้า B #1', ourTeam, 'warning'),
        makePos('lm-5', 4, p5, 'ซ้อนเทรด B #2', ourTeam, 'warning'),
        { id: 'lm-fl1', kind: 'flash', x: a.aMain.x, y: a.aMain.y, label: 'จุดศัตรูชอบดัน' }
      );
      strokes.push(
        makeRoute('lm-r1', [a.aMain, p1], '#FB923C'),
        makeRoute('lm-r2', [a.aMain, p2], '#FB923C'),
        makeRoute('lm-r3', [p1, a.siteA], '#34D399')
      );
      return {
        problem,
        headline: `หยุดนิ่งดักกินคิลตัวดัน 15 วิแรก แล้วค่อยเข้าไซท์ที่ว่าง${ecoSuffix}`,
        commands: [
          {
            head: 'หยุดเดินแล้วตั้งเป้าดัก 15 วินาทีแรก',
            detail: 'ไม่ต้องรีบวิ่งเข้าไป — รอฝั่งรับที่ใจร้อนดันออกมากินคิลฟรีก่อนเริ่มบุก',
          },
          {
            head: 'จับคู่ Crossfire หน้าประตูทุกเลน',
            detail: 'ยืนซ้อนเป็นคู่ 2 คน หากศัตรูโผล่ยิงใส่คนแรก คนที่สองต้องยิงซ้ำทันที',
          },
          {
            head: 'สวนเข้าไซท์ที่ตัวดันเพิ่งตายทันที',
            detail: 'เมื่อตัดตัวดันได้แล้ว ไซท์ฝั่งนั้นจะโล่งที่สุด ให้เร่งเข้าวาง Spike เลย',
          },
        ],
        elements: { strokes, markers },
      };
    }

    case 'atk_rotate_late': {
      const p1 = offsetPt(a.bLobby, 0, 1);
      const p2 = offsetPt(a.aMain, -2.5, 1.5);
      const p3 = offsetPt(a.aMain, 2.5, 2.5);
      const p4 = offsetPt(a.aLink, -1.5, 1.5);
      const p5 = offsetPt(a.aLobby, 0, 2);
      markers.push(
        makePos('lm-1', 0, p1, 'ปาเสียงหลอก B', ourTeam, 'lurk'),
        makePos('lm-2', 1, p2, 'พุ่งเข้า A เร็ว', ourTeam, 'attack'),
        makePos('lm-3', 2, p3, 'ถือ Spike ปักไว', ourTeam, 'attack'),
        makePos('lm-4', 3, p4, 'ตัดทาง Link', ourTeam, 'attack'),
        makePos('lm-5', 4, p5, 'ลงควันปิด CT', ourTeam, 'attack'),
        { id: 'lm-smk1', kind: 'smoke', x: a.aBack.x, y: a.aBack.y, label: 'ปิดทางหมุน CT' },
        { id: 'lm-spk1', kind: 'spike', x: a.siteA.x, y: a.siteA.y, label: 'รีบปักในไซท์' }
      );
      strokes.push(
        makeRoute('lm-r1', [p2, a.siteA], '#FF4655'),
        makeRoute('lm-r2', [p4, a.siteA], '#34D399'),
        makeRoute('lm-r3', [p1, a.bMain], '#FBBF24')
      );
      return {
        problem,
        headline: `สกิลหลอกดึงคนก่อนเข้า 5 วิ + ลงควันตัดทางหมุนแล้วปัก Spike ไว${ecoSuffix}`,
        commands: [
          {
            head: 'ส่ง 1 คนปาสกิลหลอกอีกไซท์ก่อนเข้า 5 วิ',
            detail: 'ปาควันหรือแฟลชอีกฝั่งให้ตัวซ้อน Mid/Spawn ขยับออกจากไซท์เป้าหมายของเรา',
          },
          {
            head: 'ลง Smoke ปิดประตูหมุน (CT / Link) ทันที',
            detail: 'อย่าให้เพื่อนอีกฝั่งเดินทะลุมาช่วยในไซท์ง่ายๆ กดดันให้ต้องเข้าผ่านควัน',
          },
          {
            head: 'เข้าปุ๊บวาง Spike แล้วถอยตั้ง Post-Plant',
            detail: 'ไม่เสียเวลายืนเช็กมุมเกินจำเป็น ปัก Spike เสร็จให้ถอยเล่น Crossfire รอกู้',
          },
        ],
        elements: { strokes, markers },
      };
    }

    // ==================== DEFENSE COUNTER PLAYS ====================
    case 'def_fast_rush': {
      const p1 = offsetPt(a.aBack, -2, 0.5);
      const p2 = offsetPt(a.aLink, 1.5, -1);
      const p3 = offsetPt(a.mid, 0, -2);
      const p4 = lerpPt(a.siteB, a.defSpawn, 0.35);
      const p5 = offsetPt(a.bBack, 2, 0.5);
      markers.push(
        makePos('lm-1', 0, p1, 'ถอยมุมลึก A', ourTeam, 'defense'),
        makePos('lm-2', 1, p2, 'ซ้อนมุมไขว้ Link', ourTeam, 'defense'),
        makePos('lm-3', 2, p3, 'หมุนซ้อน/ตัดหลัง', ourTeam, 'defense'),
        makePos('lm-4', 3, p4, 'เตรียมหมุนช่วย', ourTeam, 'defense'),
        makePos('lm-5', 4, p5, 'เฝ้า B ชัวร์', ourTeam, 'defense'),
        { id: 'lm-smk1', kind: 'smoke', x: a.aMain.x, y: a.aMain.y, label: 'Smoke หน้าประตู' },
        { id: 'lm-mol1', kind: 'molly', x: lerpPt(a.aMain, a.siteA, 0.3).x, y: lerpPt(a.aMain, a.siteA, 0.3).y, label: 'Molly ขวาง Rush' }
      );
      strokes.push(
        makeRoute('lm-r1', [a.aMain, p1], '#22D3EE'),
        makeRoute('lm-r2', [p3, a.aLink, a.siteA], '#34D399'),
        makeRoute('lm-r3', [p4, a.aBack], '#22D3EE')
      );
      return {
        problem,
        headline: `ได้ยินเสียงวิ่งให้ปา Smoke + Molly ขวางทันที แล้วถอยตั้ง Crossfire ลึก${ecoSuffix}`,
        commands: [
          {
            head: 'ปา Smoke + Molly ตัดหัวขบวนหน้าประตูทันที',
            detail: 'ตัดคนพุ่งหน้าให้ขาดจากเพื่อนที่ตามหลัง และบังคับให้ต้องเดินฝ่าไฟ',
          },
          {
            head: 'ถอยไปยืนมุมลึกในไซท์ห้ามแลก 1 ต่อ 5',
            detail: 'เลิกยืนชนปากทางเข้าไซท์ ถอยมารอซ้อนยิงพร้อมเพื่อน 2 มุมเมื่อศัตรูหลุดเข้ามา',
          },
          {
            head: 'ตัว Mid หมุนเข้าตัดขบวนจากด้านข้าง/หลัง',
            detail: 'ใช้จังหวะที่ศัตรูโฟกัสข้างหน้าในไซท์ ออกมายิงเก็บตัวท้ายขบวน',
          },
        ],
        elements: { strokes, markers },
      };
    }

    case 'def_fake_heavy': {
      const p1 = offsetPt(a.aBack, -2, 0);
      const p2 = offsetPt(a.aLink, 1.5, -1);
      const p3 = offsetPt(a.mid, 0, -1.5);
      const p4 = offsetPt(a.siteB, -2, 0.5);
      const p5 = offsetPt(a.bMain, 0, 2);
      markers.push(
        makePos('lm-1', 0, p1, 'ห้ามทิ้งไซท์ A', ourTeam, 'defense'),
        makePos('lm-2', 1, p2, 'หมุนเมื่อเห็น Spike', ourTeam, 'defense'),
        makePos('lm-3', 2, p3, 'ยืนกลางคุม Mid', ourTeam, 'defense'),
        makePos('lm-4', 3, p4, 'เฝ้าไซท์ B นิ่ง', ourTeam, 'defense'),
        makePos('lm-5', 4, p5, 'ดันเช็กฝั่งเงียบ', ourTeam, 'warning'),
        { id: 'lm-rec1', kind: 'recon', x: a.bLobby.x, y: a.bLobby.y, label: 'เช็กข่าวฝั่งว่าง' }
      );
      strokes.push(
        makeRoute('lm-r1', [p5, a.bLobby], '#FBBF24'),
        makeRoute('lm-r2', [p3, a.aLink], '#22D3EE'),
        makeRoute('lm-r3', [p3, a.bLink], '#22D3EE')
      );
      return {
        problem,
        headline: `Anchor ห้ามหมุนตามเสียงอย่างเดียว + ส่ง 1 ตัวฝั่งเงียบดันเช็กข้อมูล${ecoSuffix}`,
        commands: [
          {
            head: 'ห้ามทิ้งไซท์จนกว่าจะเห็นตัว 3+ หรือเห็น Spike!',
            detail: 'ปล่อยให้เพื่อนใช้ Smoke/Molly ถ่วงไปก่อน คนอีกไซท์อย่ารีบหมุนตามเสียงแฟลช',
          },
          {
            head: 'ส่ง 1 คนฝั่งที่เงียบดันไปเอาข้อมูล (Info Push)',
            detail: 'เดินเช็ก Lobby ฝั่งตรงข้าม — ถ้าว่างสนิทแปลว่าศัตรูกำลังเข้าจริงค่อยหมุนเต็มทีม',
          },
          {
            head: 'วางคน Mid ยืนกลางพร้อมสลับช่วยทั้ง 2 ด้าน',
            detail: 'ตัว Mid ทำหน้าที่อ่านเสียงเท้าย้ายไซท์และแจ้งเตือนทันทีที่อีกฝั่งถอนตัว',
          },
        ],
        elements: { strokes, markers },
      };
    }

    case 'def_mid_control': {
      const p1 = offsetPt(a.aBack, 0, 0);
      const p2 = offsetPt(a.mid, -3, -2);
      const p3 = offsetPt(a.mid, 3, -1);
      const p4 = offsetPt(a.bLink, 0, -1);
      const p5 = offsetPt(a.bBack, 0, 0);
      markers.push(
        makePos('lm-1', 0, p1, 'เฝ้ามุมปิด A', ourTeam, 'defense'),
        makePos('lm-2', 1, p2, 'ชิง Mid คู่ #1', ourTeam, 'warning'),
        makePos('lm-3', 2, p3, 'เปิดแฟลช/สแกน Mid', ourTeam, 'warning'),
        makePos('lm-4', 3, p4, 'กันทาง B Link', ourTeam, 'defense'),
        makePos('lm-5', 4, p5, 'เฝ้ามุมปิด B', ourTeam, 'defense'),
        { id: 'lm-fl1', kind: 'flash', x: a.mid.x, y: a.mid.y, label: 'แฟลชชิง Mid ต้นรอบ' },
        { id: 'lm-smk1', kind: 'smoke', x: lerpPt(a.mid, a.atkSpawn, 0.35).x, y: lerpPt(a.mid, a.atkSpawn, 0.35).y, label: 'ปิดทางขึ้น Mid' }
      );
      strokes.push(
        makeRoute('lm-r1', [p2, a.mid], '#FB923C'),
        makeRoute('lm-r2', [p3, a.mid], '#FB923C'),
        makeRoute('lm-r3', [p4, a.mid], '#22D3EE')
      );
      return {
        problem,
        headline: `นัด 2 คนชิง Mid ต้นรอบด้วย Flash/Recon ไม่ปล่อยให้อีกฝั่งเดินสบาย${ecoSuffix}`,
        commands: [
          {
            head: 'นัด 2 คนชิง Mid ตั้งแต่เริ่มรอบ (Aggro Mid)',
            detail: 'ยิงสแกนหรือปา Flash เปิดมุม Mid พร้อมกันเพื่อเอาคิลหรือดันให้อีกฝั่งถอย',
          },
          {
            head: 'ปา Smoke ปิดคอขวดทางขึ้น Mid ทุกครั้ง',
            detail: 'บังคับให้ฝ่ายบุกต้องเสียสกิลเพิ่มหรือเดินทะลุควันแบบไม่รู้มุมตั้งรับ',
          },
          {
            head: 'คนในไซท์ถอยระวังทาง Link ด้านข้าง',
            detail: 'หากชิง Mid ไม่สำเร็จ ให้คนเฝ้าไซท์ขยับหลบมุมไม่ให้โดนยิงขนาบ 2 ทาง',
          },
        ],
        elements: { strokes, markers },
      };
    }

    case 'def_postplant_lose': {
      const p1 = offsetPt(a.aBack, -2.5, -1);
      const p2 = offsetPt(a.aBack, 2.5, -1.5);
      const p3 = offsetPt(a.aLink, -1.5, -1);
      const p4 = offsetPt(a.aLink, 2.2, 0.5);
      const p5 = lerpPt(a.defSpawn, a.siteA, 0.58);
      markers.push(
        { id: 'lm-spk1', kind: 'spike', x: a.siteA.x, y: a.siteA.y, label: 'กู้ Spike' },
        { id: 'lm-smk1', kind: 'smoke', x: a.siteA.x, y: a.siteA.y, label: 'Smoke คลุมกู้' },
        { id: 'lm-fl1', kind: 'flash', x: lerpPt(a.aBack, a.siteA, 0.45).x, y: lerpPt(a.aBack, a.siteA, 0.45).y, label: 'Flash เปิด Retake' },
        makePos('lm-1', 0, p1, 'เข้าทาง CT #1', ourTeam, 'defense'),
        makePos('lm-2', 1, p2, 'เปิดแฟลช/กู้ครึ่ง', ourTeam, 'defense'),
        makePos('lm-3', 2, p3, 'บีบทาง Link #1', ourTeam, 'defense'),
        makePos('lm-4', 3, p4, 'ไล่คน Lineup', ourTeam, 'warning'),
        makePos('lm-5', 4, p5, 'ถือเป้าบังมุม', ourTeam, 'defense')
      );
      strokes.push(
        makeRoute('lm-r1', [p1, a.siteA], '#22D3EE'),
        makeRoute('lm-r2', [p3, a.siteA], '#34D399'),
        makeRoute('lm-r3', [p4, a.aMain], '#FBBF24')
      );
      return {
        problem,
        headline: `รอรวมทีมเข้า Retake 2 ทิศพร้อมกัน + Smoke คลุม Spike ก่อนแตะหลอก${ecoSuffix}`,
        commands: [
          {
            head: 'ห้ามวิ่งเข้าไปตายทีละคน — รอเข้า 2 ทางพร้อมกัน',
            detail: 'นัดนับ 3-2-1 เข้าทาง CT/Back และทาง Link พร้อมแฟลชให้ศัตรูหันรับไม่ทัน',
          },
          {
            head: 'ปา Smoke คลุมตัว Spike ก่อนแตะหลอก (Tap)',
            detail: 'ปิดมุมส่อง Lineup และล่อให้ตัวซ่อนโผล่ตัวออกมาให้เพื่อนที่ถือเป้าอยู่ยิง',
          },
          {
            head: 'ส่ง 1 คนวิ่งตัดตัว Lineup นอกไซท์',
            detail: 'อย่าให้ศัตรูยืนปาไฟ/Shock สบายๆ จากระยะไกล — ดันเช็ก Main เพื่อกดดันตัวปา',
          },
        ],
        elements: { strokes, markers },
      };
    }

    case 'def_man_down':
    default: {
      const p1 = offsetPt(a.aBack, -2, 0.5);
      const p2 = offsetPt(a.aLink, 1.5, -0.5);
      const p3 = offsetPt(a.bBack, 2, 0.5);
      const p4 = lerpPt(a.siteB, a.defSpawn, 0.45);
      markers.push(
        makePos('lm-1', 0, p1, 'ถอยมุมลึก A', ourTeam, 'warning'),
        makePos('lm-2', 1, p2, 'ซ้อนมุมอับ', ourTeam, 'warning'),
        makePos('lm-3', 2, p3, 'ถอยมุมลึก B', ourTeam, 'warning'),
        makePos('lm-4', 3, p4, 'รอซ้อน Retake', ourTeam, 'defense'),
        { id: 'lm-w1', kind: 'wall', x: a.aMain.x, y: a.aMain.y, label: 'ห้าม Peek ออก' }
      );
      strokes.push(
        makeRoute('lm-r1', [a.aMain, p1], '#FB923C'),
        makeRoute('lm-r2', [a.mid, p2], '#FB923C'),
        makeRoute('lm-r3', [p4, p1], '#22D3EE')
      );
      return {
        problem,
        headline: `ถอยมารวมตัวกันในไซท์ ห้ามเดินออกไปดวลเดี่ยว — บีบให้ศัตรูเดินเข้ามาหา${ecoSuffix}`,
        commands: [
          {
            head: 'ถอยมารวมตัวในไซท์ ห้ามเดินออกไปดวลเดี่ยว!',
            detail: 'เลิกเปิดหน้าเช็ก Main ต้นรอบ ยอมเสียพื้นที่นอกไซท์เพื่อรักษาชีวิตให้ครบ 4–5 คน',
          },
          {
            head: 'ยืนซ้อนคู่ Crossfire หรือ Gamble Stack 3-1',
            detail: 'ถ้าเงินน้อยหรือคนน้อยกว่า ให้รวม 3 คนดักไซท์เดียวเพื่อรุมยิงตีจำนวนคนกลับมา',
          },
          {
            head: 'ถ้าโดนโถมอีกไซท์ให้ถอยรอ Retake พร้อมกัน',
            detail: 'อย่ายิงสู้คนเดียวในไซท์ รอรวมทีม 4 คนเข้า Retake ทีเดียวโอกาสชนะสูงกว่ามาก',
          },
        ],
        elements: { strokes, markers },
      };
    }
  }
}

export function buildLiveMatchCounterPlay({
  map,
  side,
  economy,
  problemId,
  ourTeam,
  variation = 1,
  agentNames = [],
}: {
  map: ValorantMap;
  side: Side;
  economy: LiveMatchEconomy;
  problemId: LiveMatchProblemId;
  ourTeam: (string | null)[];
  variation?: 1 | 2 | 3;
  agentNames?: string[];
}): LiveMatchCounterOutput {
  const base = buildBaseCounterPlay({ map, side, economy, problemId, ourTeam });
  const a = resolveMapAnchors(map);

  const specs: TransformSpec[] = [getVariationTransform(variation, side, a)];
  const ecoSpec = getEconomyTransform(economy, side, a);
  if (ecoSpec) specs.push(ecoSpec);
  applyTransforms(base.elements, specs);

  base.variation = variation;
  base.commands = base.commands.map((cmd, idx) => {
    const name = agentNames[idx]?.trim();
    return name ? { ...cmd, actor: name } : cmd;
  });
  return base;
}

export interface EnemyCounterWarningItem {
  agent: Agent;
  tip: string;
}

const ENEMY_AGENT_COUNTERS: Record<string, { attack: string; defense: string }> = {
  jett: {
    attack: 'ระวัง Jett ถือ Operator มุมเปิดและ Dash หนี — ต้อง Smoke/Flash ไล่มุมก่อนโผล่',
    defense: 'ระวัง Jett โยน Cloudburst แล้ว Dash ทะลุควันตัดหลัง — ตั้งเป้าดักลึกหลังไซท์',
  },
  chamber: {
    attack: 'ระวัง Chamber ดักยิง 1 นัดแล้ววาร์ปหนี (TP) — อย่าเดินเรียงแถวให้โดนยิงซ้ำมุมเดิม',
    defense: 'ระวังกับดัก Trademark กันหลังและ Headhunter ระยะไกล — ยิงพังสายก่อนอ้อมหลัง',
  },
  raze: {
    attack: 'ระวัง Raze ปาระเบิด Paint Shells ใส่ทางเข้า — อย่าไปยืนออหน้าประตูรอเข้าพร้อมกัน',
    defense: 'ระวัง Raze พุ่ง Satchel ข้ามหัวเข้าไซท์ — ฟั่งเสียงบูมบอทและตั้งเป้าดักกลางอากาศ',
  },
  neon: {
    attack: 'ระวัง Neon วิ่งอ้อมล้วงหลังเร็วมาก — ต้องทิ้งคนหรือวางสายเฝ้าหลังทุกครั้ง',
    defense: 'ระวัง Neon วิ่ง Slide เปิดไซท์ — วาง Smoke/สกิลชะลอหน้าประตูและเล็งยิงระดับสไลด์',
  },
  reyna: {
    attack: 'อย่าเดินแจก 1v1 ให้ Reyna กิน Soul ฮีล/Dismiss หนี — เดินคู่กันเทรดคิลเสมอ',
    defense: 'รีบยิงลูกตา Leer ของ Reyna ทันที (หรือถอยหลบ) แล้วค่อยสลับมุมยิงซ้ำ',
  },
  yoru: {
    attack: 'ระวัง Yoru วาร์ปอ้อมหลังหรือใช้ร่างปลอมหลอก — ยิงทำลายประตูวาร์ปที่เห็นทันที',
    defense: 'ระวัง Yoru Flash+TP เข้าหลังไซท์ — เช็กมุมหลังไซท์ทุกครั้งเมื่อได้ยินเสียงวาร์ป',
  },
  phoenix: {
    attack: 'ระวัง Phoenix เปิดแฟลชมุมโค้งสวนและใช้อัลติฟรี — ดักยิงจุดคืนร่างหลังอัลติหมด',
    defense: 'ระวังอัลติ Run It Back เดินเปิดไซท์ — ถอยหลบหรือรีบยิงให้แตกแล้วดันหาตัวจริง',
  },
  iso: {
    attack: 'เห็นโล่ Double Tap ของ Iso ให้ยิงทำลายโล่ก่อน (อย่ายิงนัดเดียวหวังหัว)',
    defense: 'อย่าดวล 1v1 ตรงๆ กับ Iso ที่มีโล่ — ใช้ปืนกลหรือช่วยกันยิง 2 คนเจาะโล่',
  },
  waylay: {
    attack: 'ระวัง Waylay พุ่ง Lightspeed ข้ามมุมแล้ววาร์ปกลับจุดเดิม (Refract) — ดักยิงจุดวาร์ปกลับ',
    defense: 'ระวัง Waylay พุ่งเข้าไซท์เร็วพร้อมสโลว์ Saturate — อย่าอยู่ติดกันในจุดเดียว',
  },
  cypher: {
    attack: 'ระวังสาย Trapwire และ One-way Cage ของ Cypher — ใช้ Sova/Raze/KAY/O พังสายก่อนเข้า',
    defense: 'ระวัง Cypher แอบวางสายกันหลัง (Lurk) — ยิงพังสายหรืออ้อมทางที่ไม่ติดกับดัก',
  },
  killjoy: {
    attack: 'ระวัง Turret + Nanoswarm ดักประตู — เก็บสกิล/กระสุนพัง Lockdown ก่อนโดนบีบออกจากไซท์',
    defense: 'ระวัง Killjoy ทิ้ง Turret กันหลังและเก็บ Lockdown ไล่ Retake — ดันพังอัลติทันทีถ้าระยะถึง',
  },
  vyse: {
    attack: 'ระวังกุหลาบแฟลช Arc Rose และกำแพงตัดคนหลังของ Vyse — ยิงทำลายกุหลาบและเช็กทางออก',
    defense: 'ระวัง Vyse วางกุหลาบดัก Retake — อย่าหันหน้าเข้ากำแพงตรงๆ ก่อนเปิดเข้ากู้ Spike',
  },
  deadlock: {
    attack: 'ระวังตาข่าย Barrier Mesh ขวางทางและ Sonic Sensor จับเสียง — ยิงพังปมตรงกลางตาข่าย',
    defense: 'ระวัง Deadlock โยนตาข่ายตัดทาง Retake — รอเพื่อนช่วยกันยิงเปิดทางพร้อมกัน',
  },
  sage: {
    attack: 'ระวังกำแพง Sage ปิดทางเข้า — พกปืนยิงพังกำแพงทันทีถ้าจะเข้าจุดนั้นต่อ หรือสลับไซท์',
    defense: 'ระวัง Sage ตั้งกำแพงกันคนกู้/ปัก — ต้องมีคนช่วยกันยิงกำแพงและระวังชุบ Res',
  },
  sova: {
    attack: 'เห็นลูกดอก Recon ให้รีบยิงพังในนัดแรก ก่อนที่ฝั่งรับจะสแปมยิงทะลุควัน/กำแพง',
    defense: 'ระวัง Sova ยิง Shock Bolt Lineup ใส่จุดกู้ Spike — ให้ 1 คนดันเช็กมุมยิงหรือกู้หลอก',
  },
  breach: {
    attack: 'อย่าไปยืนอัดในช่องแคบ (เช่น Mid/Main) พร้อมกัน — ระวัง Fault Line สตั๊นยกทีม',
    defense: 'ระวังโดน Breach สตั๊น+Flash ไล่ออกจากจุดยืน — เล่นมุมห่างกำแพงที่ถอยหลบได้',
  },
  skye: {
    attack: 'ได้ยินเสียงนกหรือหมา Skye ให้หันหลบแฟลชทันที แล้วยิงทำลายหมาก่อนเปิดตำแหน่ง',
    defense: 'ระวัง Skye ปล่อยนก Flash เปิดทางให้ Duelist พุ่งตาม — เตรียมหันหลบแล้วหันกลับมายิง',
  },
  kayo: {
    attack: 'ระวังมีด ZERO/point ปิดสกิลเข้าทำ — ยิงพังมีดทันทีหรือรอดีเลย์ 8 วินาทีค่อยเข้า',
    defense: 'ระวังมีด Suppress ปิดกับดัก/สกิล Sentinel ของเรา — อย่าวางสายติดจุดเดิมซ้ำๆ',
  },
  fade: {
    attack: 'รีบยิงทำลายตา Haunt ทันที และระวังหมา Prowler ไล่ติดจากมุมแคบ',
    defense: 'ระวัง Fade โยน Seize ล่ามคู่กับระเบิด/สกิลอื่น — อย่าซ้อน 2 คนในจุดมุมอับแคบ',
  },
  gekko: {
    attack: 'ยิงสกิล Dizzy บนฟ้าและ Wingman ก่อนเข้าถึงตัวเสมอ (เก็บลูกแก้วกลับไปใช้ซ้ำได้)',
    defense: 'ระวัง Gekko ส่ง Wingman ไปปัก Spike ฟรีๆ ขณะเพื่อนยิงคุ้มกัน — รีบยิงตัวหุ่นให้แตก',
  },
  tejo: {
    attack: 'ระวังมิสไซล์ Guided Salvo บีบออกจากหลังกล่อง — ขยับเปลี่ยนมุมทันทีเมื่อเห็นวงเตือนบนพื้น',
    defense: 'ระวัง Stealth Drone ไล่ Suppress และ Salvo เคลียร์จุดยืนหลังกล่อง — อย่ายืนจุดเดิมซ้ำ',
  },
  omen: {
    attack: 'ระวัง Omen Flash Paranoia ทะลุกำแพงและวาร์ปซ่อนมุมสูง — เช็กมุมสูงและข้างควัน',
    defense: 'ระวัง Omen วาร์ปเข้าหลังไซท์หรือปาควันปลอมหลอก — เช็กมุมอับและจุดบนกล่องเสมอ',
  },
  clove: {
    attack: 'ฆ่า Clove แล้วยังปา Smoke ได้ — รีบเข้า/ออกจุดเดิมให้ไว และระวัง Clove กดอัลติคืนชีพ',
    defense: 'ฆ่า Clove ในไซท์แล้วอย่าเพิ่งหันหลังหนี! เช็กว่ากดอัลติคืนชีพหรือไม่แล้วยิงซ้ำ',
  },
  viper: {
    attack: 'ระวังม่านพิษลดเลือดเมื่อเดินผ่านและ Orb ดักประตู — รอจังหวะม่านตกค่อยเข้า',
    defense: 'ระวัง Viper Snake Bite Lineup ใส่ Spike — ปา Smoke/แตะหลอกและแบ่งคนไปไล่ตัวปา',
  },
  brimstone: {
    attack: 'ระวัง Stim Beacon ดันเร็วและไฟ/อัลติใส่จุดปัก — กะจังหวะออกก่อนโดนเผา',
    defense: 'ระวัง Brimstone Molly + Orbital Strike ใส่ Spike จากนอกไซท์ — กู้ทันทีเมื่อมีโอกาสก่อนตาย',
  },
  astra: {
    attack: 'อย่าเข้าทางแคบพร้อมกันโดนดูด Gravity Well — ระวังดาวหลอกและกำแพง Cosmic Divide',
    defense: 'ระวัง Astra กางกำแพงตัดเสียงเข้าปัก Spike — ฟังเสียงใกล้ๆ หรือใช้สกิลยิง/โยนข้ามกำแพง',
  },
  harbor: {
    attack: 'ระวังลูกแก้วกันกระสุน Cove และกำแพงน้ำ — ยิงทำลายลูกแก้วเมื่อ Harbor ปาขวางประตู',
    defense: 'ระวัง Harbor ปาลูกแก้ว Cove กันตอนวาง/กู้ Spike — รุมยิงลูกแก้วให้แตกทันทีแล้วสแปมทะลุ',
  },
};

export function buildEnemyCounterWarnings(
  enemyTeam: (string | null)[],
  side: Side,
  agents: Agent[]
): EnemyCounterWarningItem[] {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const items: EnemyCounterWarningItem[] = [];
  const seen = new Set<string>();

  for (const id of enemyTeam) {
    if (!id || seen.has(id)) continue;
    const ag = byId.get(id);
    if (!ag) continue;
    seen.add(id);

    const specific = ENEMY_AGENT_COUNTERS[ag.id];
    const fallbackByRole =
      ag.role === 'duelist'
        ? 'ตัวเข้าปะทะไว — ตั้งเป้าคู่ Crossfire ไม่ยืนดวล 1v1 เดี่ยว'
        : ag.role === 'sentinel'
        ? 'มีกับดักคุมพื้นที่ — ยิงพังอุปกรณ์/เช็กจุดซ่อนก่อนเข้า'
        : ag.role === 'initiator'
        ? 'มีสกิลเปิดข้อมูล/แฟลช — เตรียมหลบแฟลชและเปลี่ยนมุมยืนหลังโดนสแกน'
        : 'มีสกิลควันตัดสายตา — ระวังมุมซ่อนในควันและเช็กทางเชื่อมให้ดี';

    items.push({
      agent: ag,
      tip: specific ? (side === 'attack' ? specific.attack : specific.defense) : fallbackByRole,
    });
  }

  return items;
}
