import { Agent, Side, StrategyPlay, ValorantMap } from '../types/tactix';

export function formatStrategyBrief(
  map: ValorantMap,
  side: Side,
  play: StrategyPlay,
  ourTeam: (string | null)[],
  enemyTeam: (string | null)[],
  agents: Agent[]
): string {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const sideLabel = side === 'attack' ? 'ฝั่งบุก (ATTACK)' : 'ฝั่งรับ (DEFENSE)';
  const ourNames = ourTeam.map((id, i) => {
    const ag = id ? byId.get(id) : undefined;
    const duty = play.assignments[String(i)]?.trim();
    if (!ag) return `${i + 1}. -`;
    return duty ? `${i + 1}. ${ag.name} (${ag.role}) — ${duty}` : `${i + 1}. ${ag.name} (${ag.role})`;
  });
  const enemyNames = enemyTeam
    .map((id) => (id ? byId.get(id)?.name : null))
    .filter(Boolean)
    .join(', ');

  const lines: string[] = [
    `TACTIX — แผนการเล่น Valorant`,
    `แผนที่: ${map.name} | ฝั่ง: ${sideLabel}`,
    `แผน: ${play.name} (${play.roundType.toUpperCase()})`,
    ``,
    `[ทีมเรา 5 คน]`,
    ...ourNames,
  ];

  if (enemyNames) {
    lines.push(``, `[ทีมศัตรู]`, enemyNames);
  }

  if (play.steps.length > 0) {
    lines.push(``, `[ลำดับการเดินแผน]`);
    play.steps.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.text}`);
    });
  }

  if (play.notes.trim()) {
    lines.push(``, `[โน้ตเพิ่มเติม]`, play.notes.trim());
  }

  return lines.join('\n');
}

function loadImageCors(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load error'));
    img.src = src;
  });
}

const MARKER_COLORS: Record<string, string> = {
  smoke: '#A855F7',
  flash: '#FBBF24',
  recon: '#FACC15',
  molly: '#FB7185',
  wall: '#38BDF8',
  spike: '#FF4655',
  pin: '#E2E8F0',
  agent: '#22D3EE',
};

const MARKER_SHORT: Record<string, string> = {
  smoke: 'SMK',
  flash: 'FLS',
  recon: 'RCN',
  molly: 'MOL',
  wall: 'WAL',
  spike: 'SPK',
  pin: 'PIN',
};

export async function renderTacticalBoardPng(
  map: ValorantMap,
  side: Side,
  play: StrategyPlay,
  agents: Agent[],
  showCallouts = true
): Promise<string> {
  const width = 1080;
  const headerH = 88;
  const boardSize = 960;
  const pad = 60;
  const height = headerH + boardSize + 72;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  // Background
  ctx.fillStyle = '#0B0E14';
  ctx.fillRect(0, 0, width, height);

  // Header bar
  ctx.fillStyle = '#111620';
  ctx.fillRect(0, 0, width, headerH);
  ctx.fillStyle = side === 'attack' ? '#FF4655' : '#22D3EE';
  ctx.fillRect(0, headerH - 3, width, 3);

  ctx.fillStyle = '#F1F5F9';
  ctx.font = 'bold 28px "Chakra Petch", sans-serif';
  ctx.fillText(`TACTIX  ·  ${map.name.toUpperCase()}`, pad, 42);

  ctx.fillStyle = side === 'attack' ? '#FF4655' : '#22D3EE';
  ctx.font = 'bold 16px "Anuphan", sans-serif';
  ctx.fillText(`${side === 'attack' ? 'ฝั่งบุก (ATTACK)' : 'ฝั่งรับ (DEFENSE)'}  ·  ${play.name}`, pad, 68);

  // Map frame
  const bx = pad;
  const by = headerH + 24;
  ctx.fillStyle = '#0F141D';
  ctx.fillRect(bx, by, boardSize, boardSize);
  ctx.strokeStyle = '#263145';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, boardSize, boardSize);

  // Draw live minimap if available
  let drewMapImg = false;
  if (map.displayIcon) {
    try {
      const img = await loadImageCors(map.displayIcon);
      ctx.drawImage(img, bx + 20, by + 20, boardSize - 40, boardSize - 40);
      drewMapImg = true;
    } catch {
      drewMapImg = false;
    }
  }

  const mapPad = drewMapImg ? 20 : 0;
  const innerSize = boardSize - mapPad * 2;
  const toPx = (pt: { x: number; y: number }) => ({
    x: bx + mapPad + (pt.x / 100) * innerSize,
    y: by + mapPad + (pt.y / 100) * innerSize,
  });

  if (!drewMapImg) {
    // Draw fallback geometry
    const geo = map.fallbackGeometry;
    const scale = innerSize / 600;
    ctx.fillStyle = '#1C2433';
    geo.floors.forEach((r) => {
      ctx.fillRect(bx + r.x * scale, by + r.y * scale, r.w * scale, r.h * scale);
    });
    geo.sites.forEach((s) => {
      ctx.fillStyle = 'rgba(255, 70, 85, 0.14)';
      ctx.fillRect(bx + s.x * scale, by + s.y * scale, s.w * scale, s.h * scale);
      ctx.strokeStyle = '#FF4655';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + s.x * scale, by + s.y * scale, s.w * scale, s.h * scale);
      ctx.fillStyle = '#FF4655';
      ctx.font = 'bold 48px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.label ?? '', bx + (s.x + s.w / 2) * scale, by + (s.y + s.h / 2 + 16) * scale);
      ctx.textAlign = 'left';
    });
  }

  // Draw Callout labels directly on map if enabled
  if (showCallouts && map.callouts.length > 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (const c of map.callouts) {
      const p = toPx(c);
      if (c.name === 'Site') {
        ctx.font = 'bold 34px "Chakra Petch", sans-serif';
        ctx.fillStyle = '#FF4655';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.group, p.x, p.y);
        ctx.textBaseline = 'bottom';
        continue;
      }
      ctx.fillStyle = c.group === 'Atk' ? '#FF4655' : c.group === 'Def' ? '#22D3EE' : '#94A3B8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '600 13px "Chakra Petch", sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(11, 14, 20, 0.92)';
      ctx.strokeText(c.key, p.x, p.y - 7);
      ctx.fillStyle = c.group === 'Atk' ? '#FDA4AF' : c.group === 'Def' ? '#A5F3FC' : '#E2E8F0';
      ctx.fillText(c.key, p.x, p.y - 7);
    }
    ctx.restore();
  }

  // Draw strokes
  for (const stroke of play.elements.strokes) {
    if (stroke.points.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.kind === 'route' ? 5 : 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.dashed) {
      ctx.setLineDash([14, 8]);
    }
    ctx.beginPath();
    const first = toPx(stroke.points[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = toPx(stroke.points[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    if (stroke.kind === 'route') {
      const p1 = toPx(stroke.points[stroke.points.length - 2]);
      const p2 = toPx(stroke.points[stroke.points.length - 1]);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const headLen = 18;
      ctx.setLineDash([]);
      ctx.fillStyle = stroke.color;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw markers
  const agentById = new Map(agents.map((a) => [a.id, a]));
  let smokeIdx = 0;

  for (const m of play.elements.markers) {
    const pos = toPx(m);
    if (m.kind === 'smoke') {
      smokeIdx += 1;
      ctx.save();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.36)';
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(smokeIdx), pos.x, pos.y);
      ctx.restore();
    } else if (m.kind === 'agent' && m.agentId) {
      const ag = agentById.get(m.agentId);
      const teamColor = m.team === 'enemy' ? '#FB7185' : '#22D3EE';
      ctx.save();
      ctx.fillStyle = '#111620';
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 12px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((ag?.name ?? 'AG').slice(0, 3).toUpperCase(), pos.x, pos.y);
      ctx.restore();
    } else {
      const col = MARKER_COLORS[m.kind] ?? '#E2E8F0';
      ctx.save();
      ctx.fillStyle = '#111620';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(MARKER_SHORT[m.kind] ?? 'PT', pos.x, pos.y);
      if (m.label) {
        ctx.font = '600 12px "Anuphan", sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText(m.label, pos.x, pos.y + 24);
      }
      ctx.restore();
    }
  }

  // Footer caption
  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px "Anuphan", sans-serif';
  ctx.fillText(
    `สร้างจาก TACTIX Valorant Strategy Planner  ·  ${play.steps.length} ขั้นตอนปฏิบัติ`,
    bx,
    height - 20
  );

  return canvas.toDataURL('image/png');
}
