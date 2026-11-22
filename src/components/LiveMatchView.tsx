import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Bomb,
  ChevronDown,
  Coins,
  Compass,
  Crosshair,
  Eye,
  Flame,
  Loader2,
  MapPin,
  Plus,
  Radar,
  RotateCcw,
  RotateCw,
  Search,
  Send,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Users,
  Wind,
  X,
} from 'lucide-react';
import { ROLES_ORDER, ROLE_META } from '../data/valorantFallback';
import { useMapOrientation, ROTATION_TRANSITION } from '../hooks/useMapOrientation';
import {
  Agent,
  AgentRole,
  BoardElements,
  BoardMarker,
  LiveMatchEconomy,
  LiveMatchProblemId,
  RouteStroke,
  Side,
  ValorantMap,
} from '../types/tactix';
import {
  LIVE_MATCH_ECONOMIES,
  buildEnemyCounterWarnings,
} from '../utils/liveMatchEngine';
import {
  AiAgentOrder,
  AiCoachResponse,
  requestLiveCoachAdvice,
} from '../services/liveCoachAi';
import { AgentAvatar } from './AgentAvatar';

export interface LiveMatchState {
  mapId: string;
  side: Side;
  economy: LiveMatchEconomy;
  ourTeam: (string | null)[];
  enemyTeam: (string | null)[];
  problemId?: LiveMatchProblemId | null;
  variation?: 1 | 2 | 3;
  situationText?: string;
  selectedTags?: string[];
}

interface LiveMatchViewProps {
  maps: ValorantMap[];
  agents: Agent[];
  matchState: LiveMatchState;
  boardOurTeam: (string | null)[];
  onChangeMatchState: (updater: (prev: LiveMatchState) => LiveMatchState) => void;
  onResetMatch: () => void;
}

const QUICK_TAGS_BY_SIDE: Record<Side, string[]> = {
  attack: [
    'ศัตรูมี Op',
    'โดนบุกเร็ว / ดันสวน',
    'โดนตุ๋ยหลัง',
    'ติดกับดัก Cypher/KJ',
    'เข้าไซท์ไม่ได้',
    'รีเทคไม่ทัน',
    'ศัตรู Eco / Force',
    'เสียคนต้นรอบ',
  ],
  defense: [
    'โดนบุกเร็ว 5 คน',
    'ศัตรูชอบ Fake',
    'เสียพื้นที่ Mid',
    'แพ้ Post-Plant',
    'ศัตรูมี Op',
    'โดนตุ๋ยหลัง',
    'ต้อง Retake',
    'คนน้อยกว่า 4v5',
  ],
};

function updateSlot(
  team: (string | null)[],
  slotIndex: number,
  agentId: string | null
): (string | null)[] {
  if (slotIndex < 0 || slotIndex >= 5) return team;
  const next = team.map((id) => (agentId !== null && id === agentId ? null : id));
  next[slotIndex] = agentId;
  return next;
}

function getToneColor(tone: AiAgentOrder['roleTone']): string {
  switch (tone) {
    case 'attack':
      return '#FF4655';
    case 'defense':
      return '#22D3EE';
    case 'lurk':
      return '#FBBF24';
    case 'warning':
      return '#FB923C';
    default:
      return '#34D399';
  }
}

export function LiveMatchView({
  maps,
  agents,
  matchState,
  boardOurTeam,
  onChangeMatchState,
  onResetMatch,
}: LiveMatchViewProps) {
  const [mapMenuOpen, setMapMenuOpen] = useState(false);
  const [showCallouts, setShowCallouts] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<{
    team: 'our' | 'enemy';
    index: number;
  } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerRole, setPickerRole] = useState<AgentRole | 'all'>('all');

  const [coachPlan, setCoachPlan] = useState<AiCoachResponse | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<number | null>(null);

  const mapMenuRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const activeMap = useMemo(
    () => maps.find((m) => m.id === matchState.mapId) ?? maps[0],
    [maps, matchState.mapId]
  );

  const {
    rotation,
    displayRotation,
    manualQuarterTurns,
    rotateManually,
    isSideways,
    getCenterOffset,
    counterRotateSvg,
    counterRotateHtml,
  } = useMapOrientation(activeMap.callouts, matchState.side, activeMap.id);

  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);
  const standardMaps = useMemo(() => maps.filter((m) => m.category !== 'tdm'), [maps]);
  const tdmMaps = useMemo(() => maps.filter((m) => m.category === 'tdm'), [maps]);

  const situationText = matchState.situationText ?? '';
  const selectedTags = matchState.selectedTags ?? [];

  useEffect(() => {
    setImgFailed(false);
  }, [activeMap.id, activeMap.displayIcon]);

  useEffect(() => {
    if (!mapMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (mapMenuRef.current && !mapMenuRef.current.contains(e.target as Node)) {
        setMapMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [mapMenuOpen]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setStageSize((prev) =>
        prev.width === Math.floor(rect.width) && prev.height === Math.floor(rect.height)
          ? prev
          : { width: Math.floor(rect.width), height: Math.floor(rect.height) }
      );
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const activeEconomyMeta = useMemo(
    () =>
      LIVE_MATCH_ECONOMIES.find((e) => e.id === matchState.economy) ?? LIVE_MATCH_ECONOMIES[3],
    [matchState.economy]
  );

  const enemyCounters = useMemo(
    () => buildEnemyCounterWarnings(matchState.enemyTeam, matchState.side, agents),
    [matchState.enemyTeam, matchState.side, agents]
  );

  const filteredPickerAgents = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return agents.filter((a) => {
      if (pickerRole !== 'all' && a.role !== pickerRole) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, pickerRole, pickerSearch]);

  const boardElements = useMemo<BoardElements>(() => {
    if (!coachPlan) return { strokes: [], markers: [] };

    const markers: BoardMarker[] = [];
    const strokes: RouteStroke[] = [];

    coachPlan.agentOrders.forEach((order, idx) => {
      const slotIdx = Math.max(0, Math.min(4, (order.slot || idx + 1) - 1));
      const resolvedAgentId = order.agentId ?? matchState.ourTeam[slotIdx] ?? undefined;
      markers.push({
        id: `ai-pos-${slotIdx}-${idx}`,
        kind: 'position',
        x: order.x,
        y: order.y,
        slotNumber: order.slot || idx + 1,
        agentId: resolvedAgentId,
        team: 'our',
        label: `${order.agentName} · ${order.callout}`,
        roleTone: order.roleTone,
      });

      if (
        typeof order.moveToX === 'number' &&
        typeof order.moveToY === 'number' &&
        Math.hypot(order.moveToX - order.x, order.moveToY - order.y) >= 3
      ) {
        strokes.push({
          id: `ai-route-${slotIdx}-${idx}`,
          kind: 'route',
          points: [
            { x: order.x, y: order.y },
            { x: order.moveToX, y: order.moveToY },
          ],
          color: getToneColor(order.roleTone),
          dashed: true,
        });
      }
    });

    coachPlan.utilityPlacements.forEach((u, idx) => {
      markers.push({
        id: `ai-util-${idx}`,
        kind: u.kind,
        x: u.x,
        y: u.y,
        label: u.label,
      });
    });

    return { strokes, markers };
  }, [coachPlan, matchState.ourTeam]);

  const squareSize =
    stageSize.width > 0 && stageSize.height > 0
      ? Math.floor(Math.min(stageSize.width, stageSize.height))
      : 0;

  const mapFit = useMemo(() => {
    const pts = activeMap.callouts;
    if (pts.length === 0 || stageSize.width <= 0 || stageSize.height <= 0 || squareSize <= 0) {
      return { autoScale: 1.08, centerX: 50, centerY: 50 };
    }
    let minX = 100;
    let maxX = 0;
    let minY = 100;
    let maxY = 0;
    for (const c of pts) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }
    const mapSpanX = Math.max(24, Math.min(100, maxX + 4) - Math.max(0, minX - 4));
    const mapSpanY = Math.max(24, Math.min(100, maxY + 3) - Math.max(0, minY - 4));
    const spanX = isSideways ? mapSpanY : mapSpanX;
    const spanY = isSideways ? mapSpanX : mapSpanY;
    const centerX = Math.min(62, Math.max(38, (minX + maxX) / 2));
    const centerY = Math.min(62, Math.max(38, (minY + maxY) / 2));
    const fitX = stageSize.width / (squareSize * (spanX / 100));
    const fitY = stageSize.height / (squareSize * (spanY / 100));
    const autoScale = Math.min(1.5, Math.max(1.06, Math.min(fitX, fitY)));
    return { autoScale, centerX, centerY };
  }, [activeMap.callouts, stageSize.width, stageSize.height, squareSize, isSideways]);

  const centerOffset = getCenterOffset(mapFit.centerX, mapFit.centerY);

  const useLiveMapImg = !!activeMap.displayIcon && !imgFailed;
  const siteLabels = useMemo(
    () => activeMap.callouts.filter((c) => c.name === 'Site'),
    [activeMap.callouts]
  );

  const handleHalftimeSwap = () => {
    setCoachPlan(null);
    setCoachError(null);
    onChangeMatchState((prev) => ({
      ...prev,
      side: prev.side === 'attack' ? 'defense' : 'attack',
      economy: 'pistol',
      selectedTags: [],
    }));
  };

  const handleToggleTag = (tag: string) => {
    onChangeMatchState((prev) => {
      const current = prev.selectedTags ?? [];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, selectedTags: next };
    });
  };

  const handleAskCoach = async () => {
    if (coachLoading) return;
    if (!situationText.trim() && selectedTags.length === 0) {
      setCoachError('กรุณาเลือก Tag ด่วน หรือพิมพ์สถานการณ์สั้นๆ ก่อนขอคำสั่ง');
      return;
    }

    setCoachLoading(true);
    setCoachError(null);
    setFocusedSlot(null);

    try {
      const ourTeamPayload = matchState.ourTeam
        .map((id, idx) => {
          const ag = id ? agentById.get(id) : undefined;
          if (!ag) return null;
          return {
            slot: idx + 1,
            id: ag.id,
            name: ag.name,
            role: ROLE_META[ag.role].label,
            abilities: ag.abilities.slice(0, 4).map((ab) => ab.name),
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const enemyTeamPayload = matchState.enemyTeam
        .map((id) => {
          const ag = id ? agentById.get(id) : undefined;
          if (!ag) return null;
          return { name: ag.name, role: ROLE_META[ag.role].label };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const calloutsPayload = activeMap.callouts.map((c) => ({
        key: c.key,
        group: c.group,
        x: c.x,
        y: c.y,
      }));

      const result = await requestLiveCoachAdvice({
        mapName: activeMap.name,
        sites: activeMap.sites,
        side: matchState.side,
        economy: `${activeEconomyMeta.label} (${activeEconomyMeta.th})`,
        ourTeam: ourTeamPayload,
        enemyTeam: enemyTeamPayload,
        callouts: calloutsPayload,
        situation: situationText.trim(),
        tags: selectedTags,
      });

      setCoachPlan(result);
    } catch (err) {
      setCoachError(
        err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อ AI Coach ได้ในขณะนี้'
      );
    } finally {
      setCoachLoading(false);
    }
  };

  let smokeNumber = 0;
  const canCopyBoardTeam = boardOurTeam.some(Boolean);
  const quickTags = QUICK_TAGS_BY_SIDE[matchState.side];
  const ourPickedCount = matchState.ourTeam.filter(Boolean).length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0B0E14] text-[#F1F5F9]">
      {/* 1. Top Live Match Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#263145] bg-[#111620] px-4 py-2">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Map Dropdown Selector */}
          <div ref={mapMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setMapMenuOpen((o) => !o)}
              className="clip-angle-sm flex items-center gap-2 border border-[#263145] bg-[#171E2B] px-3 py-1.5 text-left transition-colors hover:border-[#FF4655]"
            >
              <span className="text-[11px] font-medium text-[#94A3B8]">แผนที่:</span>
              <span className="font-display text-sm font-bold uppercase tracking-wider text-[#F1F5F9] whitespace-nowrap">
                {activeMap.name}
              </span>
              <span className="font-mono-tabular text-[11px] text-[#94A3B8] whitespace-nowrap">
                {activeMap.sites.join('/')}
              </span>
              <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
            </button>

            {mapMenuOpen && (
              <div className="absolute left-0 top-11 z-50 w-76 border border-[#2E3B52] bg-[#111620] p-1.5 shadow-2xl">
                <div className="scrollbar-thin max-h-88 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    โหมดมาตรฐาน 5v5 ({standardMaps.length})
                  </div>
                  {standardMaps.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setCoachPlan(null);
                        onChangeMatchState((prev) => ({ ...prev, mapId: m.id }));
                        setMapMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-2.5 py-2 text-left text-xs transition-colors ${
                        m.id === activeMap.id
                          ? 'bg-[#FF4655]/15 text-[#F1F5F9]'
                          : 'text-[#CBD5E1] hover:bg-[#171E2B]'
                      }`}
                    >
                      <span className="font-display text-sm font-semibold uppercase">{m.name}</span>
                      <span className="font-mono-tabular text-[11px] text-[#94A3B8]">
                        {m.sites.join('/')}
                      </span>
                    </button>
                  ))}
                  {tdmMaps.length > 0 && (
                    <>
                      <div className="mt-1 border-t border-[#263145] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        TDM ({tdmMaps.length})
                      </div>
                      {tdmMaps.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setCoachPlan(null);
                            onChangeMatchState((prev) => ({ ...prev, mapId: m.id }));
                            setMapMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-2.5 py-2 text-left text-xs transition-colors ${
                            m.id === activeMap.id
                              ? 'bg-[#22D3EE]/15 text-[#F1F5F9]'
                              : 'text-[#CBD5E1] hover:bg-[#171E2B]'
                          }`}
                        >
                          <span className="font-display text-sm font-semibold uppercase">
                            {m.name}
                          </span>
                          <span className="font-mono-tabular text-[11px] text-[#22D3EE]">TDM</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Attack / Defense Toggle */}
          <div
            className="flex items-center border border-[#263145] bg-[#0B0E14] p-0.5"
            role="group"
            aria-label="เลือกฝั่งการเล่น"
          >
            <button
              type="button"
              onClick={() => {
                setCoachPlan(null);
                onChangeMatchState((prev) => ({
                  ...prev,
                  side: 'attack',
                  selectedTags: [],
                }));
              }}
              aria-pressed={matchState.side === 'attack'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                matchState.side === 'attack'
                  ? 'bg-[#FF4655] text-white'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              <Swords className="h-3.5 w-3.5" />
              ฝั่งบุก · Attack
            </button>
            <button
              type="button"
              onClick={() => {
                setCoachPlan(null);
                onChangeMatchState((prev) => ({
                  ...prev,
                  side: 'defense',
                  selectedTags: [],
                }));
              }}
              aria-pressed={matchState.side === 'defense'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                matchState.side === 'defense'
                  ? 'bg-[#22D3EE] text-[#0B0E14]'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              ฝั่งรับ · Defense
            </button>
          </div>

          {/* Halftime Button */}
          <button
            type="button"
            onClick={handleHalftimeSwap}
            className="flex items-center gap-1.5 border border-[#FBBF24]/50 bg-[#FBBF24]/12 px-3 py-1.5 text-xs font-semibold text-[#FDE68A] transition-colors hover:bg-[#FBBF24]/22 whitespace-nowrap"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-[#FBBF24]" />
            สลับฝั่งครึ่งหลัง (Halftime)
          </button>
        </div>

        {/* Prominent Red Reset Match Button */}
        <button
          type="button"
          onClick={() => {
            setCoachPlan(null);
            setCoachError(null);
            onResetMatch();
          }}
          className="clip-angle-sm flex items-center gap-1.5 bg-[#FF4655] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#DC2626] whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          จบเกม / รีเซ็ตแมตช์
        </button>
      </div>

      {/* Main 3-Column Live Match Workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[268px_330px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[284px_360px_minmax(0,1fr)]">
        {/* Column 1: Left (Economy + Our Team 5 + Enemy Team 5) */}
        <aside className="scrollbar-thin flex min-h-0 flex-col gap-4 border-b border-[#263145] bg-[#111620] p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          {/* Economy Selector */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                <Coins className="h-3.5 w-3.5 text-[#FBBF24]" />
                สถานะเงินรอบนี้
              </h2>
              <span className="text-[11px] font-medium text-[#94A3B8]">
                {activeEconomyMeta.th}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {LIVE_MATCH_ECONOMIES.map((eco) => {
                const active = matchState.economy === eco.id;
                return (
                  <button
                    key={eco.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onChangeMatchState((prev) => ({ ...prev, economy: eco.id }))
                    }
                    className={`border py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'border-[#FBBF24] bg-[#FBBF24]/18 text-[#FDE68A]'
                        : 'border-[#263145] bg-[#171E2B] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {eco.label}
                  </button>
                );
              })}
            </div>

            <p className="border border-[#263145] bg-[#171E2B]/80 px-2.5 py-2 text-[11px] leading-relaxed text-[#CBD5E1]">
              {activeEconomyMeta.warning}
            </p>
          </section>

          {/* Our Team 5 Slots */}
          <section className="space-y-2 border-t border-[#263145] pt-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                <Users className="h-3.5 w-3.5" />
                ทีมเรา ({ourPickedCount}/5)
              </h2>
              {canCopyBoardTeam && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeMatchState((prev) => ({
                      ...prev,
                      ourTeam: [...boardOurTeam],
                    }))
                  }
                  className="text-[10px] font-semibold text-[#94A3B8] hover:text-[#22D3EE] whitespace-nowrap"
                >
                  ดึงทีมจากกระดาน
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {matchState.ourTeam.map((agId, idx) => {
                const ag = agId ? agentById.get(agId) : undefined;
                return (
                  <div
                    key={`live-our-${idx}`}
                    className="flex h-10 items-center gap-2 border border-[#263145] bg-[#171E2B] px-2"
                  >
                    <span className="w-3.5 font-mono-tabular text-[11px] text-[#64748B]">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPickingSlot({ team: 'our', index: idx });
                        setPickerSearch('');
                        setPickerRole('all');
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      {ag ? (
                        <>
                          <AgentAvatar agent={ag} size="xs" />
                          <span className="truncate font-display text-xs font-semibold uppercase text-[#F1F5F9]">
                            {ag.name}
                          </span>
                          <span
                            className={`ml-auto text-[10px] ${ROLE_META[ag.role].colorClass}`}
                          >
                            {ROLE_META[ag.role].label}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                          <Plus className="h-3.5 w-3.5" />
                          เลือก Agent ทีมเรา
                        </span>
                      )}
                    </button>
                    {ag && (
                      <button
                        type="button"
                        onClick={() =>
                          onChangeMatchState((prev) => ({
                            ...prev,
                            ourTeam: updateSlot(prev.ourTeam, idx, null),
                          }))
                        }
                        aria-label={`นำ ${ag.name} ออก`}
                        className="text-[#64748B] hover:text-[#FF4655]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Enemy Team 5 Slots */}
          <section className="space-y-2 border-t border-[#263145] pt-3.5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-[#FF4655]">
                <Crosshair className="h-3.5 w-3.5" />
                ทีมศัตรู (5 ตัว)
              </h2>
              <span className="font-mono-tabular text-[11px] text-[#94A3B8]">
                {matchState.enemyTeam.filter(Boolean).length}/5
              </span>
            </div>

            <div className="space-y-1.5">
              {matchState.enemyTeam.map((agId, idx) => {
                const ag = agId ? agentById.get(agId) : undefined;
                return (
                  <div
                    key={`live-enemy-${idx}`}
                    className="flex h-10 items-center gap-2 border border-[#263145] bg-[#171E2B] px-2"
                  >
                    <span className="w-3.5 font-mono-tabular text-[11px] text-[#64748B]">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPickingSlot({ team: 'enemy', index: idx });
                        setPickerSearch('');
                        setPickerRole('all');
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      {ag ? (
                        <>
                          <AgentAvatar agent={ag} size="xs" />
                          <span className="truncate font-display text-xs font-semibold uppercase text-[#F1F5F9]">
                            {ag.name}
                          </span>
                          <span
                            className={`ml-auto text-[10px] ${ROLE_META[ag.role].colorClass}`}
                          >
                            {ROLE_META[ag.role].label}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                          <Plus className="h-3.5 w-3.5" />
                          เลือก Agent ศัตรู
                        </span>
                      )}
                    </button>
                    {ag && (
                      <button
                        type="button"
                        onClick={() =>
                          onChangeMatchState((prev) => ({
                            ...prev,
                            enemyTeam: updateSlot(prev.enemyTeam, idx, null),
                          }))
                        }
                        aria-label={`นำ ${ag.name} ออก`}
                        className="text-[#64748B] hover:text-[#FF4655]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        {/* Column 2: Center (AI Coach Live Consultation Input + Quick-Tap Tags) */}
        <section className="scrollbar-thin flex min-h-0 flex-col gap-4 border-b border-[#263145] bg-[#0B0E14] p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <header className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-[#22D3EE]">
                AI Coach · ช่วง Buy Phase
              </span>
              <span
                className={`font-display text-xs font-bold uppercase ${
                  matchState.side === 'attack' ? 'text-[#FF4655]' : 'text-[#22D3EE]'
                }`}
              >
                {matchState.side === 'attack' ? 'ฝั่งบุก · Attack' : 'ฝั่งรับ · Defense'}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold text-[#F1F5F9]">
              ปรึกษาแก้เกมสด
            </h2>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              กด Tag ปัญหาด่วนหรือพิมพ์สถานการณ์สั้นๆ AI Coach จะสั่งแผนแยกตามตัวละครพร้อมปักหมุดพิกัดลงแผนที่ 2D ทันที
            </p>
          </header>

          {/* Context Summary Strip sent to AI */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border border-[#263145] bg-[#111620] px-3 py-2 text-[11px] text-[#CBD5E1]">
            <span>แผนที่: <strong className="text-[#F1F5F9]">{activeMap.name}</strong></span>
            <span className="text-[#475569]" aria-hidden="true">·</span>
            <span>เงิน: <strong className="text-[#FBBF24]">{activeEconomyMeta.label}</strong></span>
            <span className="text-[#475569]" aria-hidden="true">·</span>
            <span>ทีมเรา: <strong className="font-mono-tabular text-[#22D3EE]">{ourPickedCount}/5</strong></span>
          </div>

          {/* Quick-Tap Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Tag กดด่วน ({selectedTags.length})
              </span>
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeMatchState((prev) => ({ ...prev, selectedTags: [] }))
                  }
                  className="text-[11px] text-[#94A3B8] hover:text-[#FF4655]"
                >
                  ล้าง Tag
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleToggleTag(tag)}
                    className={`border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? matchState.side === 'attack'
                          ? 'border-[#FF4655] bg-[#FF4655]/18 text-[#F1F5F9]'
                          : 'border-[#22D3EE] bg-[#22D3EE]/18 text-[#F1F5F9]'
                        : 'border-[#263145] bg-[#111620] text-[#CBD5E1] hover:border-[#475569] hover:bg-[#171E2B]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Situation Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="live-coach-situation"
                className="font-display text-xs font-semibold uppercase tracking-wider text-[#94A3B8]"
              >
                เล่าสถานการณ์เพิ่มเติม (ไม่บังคับ)
              </label>
              {situationText.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeMatchState((prev) => ({ ...prev, situationText: '' }))
                  }
                  className="text-[11px] text-[#64748B] hover:text-[#F1F5F9]"
                >
                  ล้างข้อความ
                </button>
              )}
            </div>
            <textarea
              id="live-coach-situation"
              rows={4}
              value={situationText}
              onChange={(e) =>
                onChangeMatchState((prev) => ({ ...prev, situationText: e.target.value }))
              }
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void handleAskCoach();
                }
              }}
              placeholder="พิมพ์สั้นๆ เช่น: Jett ศัตรูถือ Op ยืนดัก A Main ตลอด, Cypher วางสายที่ B ถ้าเดินเข้าโดนยิงสวน..."
              className="w-full resize-none border border-[#263145] bg-[#111620] p-3 text-xs leading-relaxed text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#22D3EE] focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
              <span>กด Ctrl+Enter เพื่อส่งทันที</span>
              {ourPickedCount === 0 && (
                canCopyBoardTeam ? (
                  <button
                    type="button"
                    onClick={() =>
                      onChangeMatchState((prev) => ({
                        ...prev,
                        ourTeam: [...boardOurTeam],
                      }))
                    }
                    className="font-semibold text-[#22D3EE] hover:underline whitespace-nowrap"
                  >
                    ดึงทีม 5 ตัวจากกระดานหลัก
                  </button>
                ) : (
                  <span className="text-[#FBBF24]">แนะนำเลือกทีมเรา 5 ตัวด้านซ้าย</span>
                )
              )}
            </div>
          </div>

          {/* Primary Submit CTA */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={coachLoading || (!situationText.trim() && selectedTags.length === 0)}
              onClick={() => void handleAskCoach()}
              className="clip-angle-sm flex w-full items-center justify-center gap-2 bg-[#FF4655] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {coachLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI Coach กำลังวิเคราะห์แผน...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>ขอคำสั่งแก้เกม (AI Coach)</span>
                </>
              )}
            </button>

            {coachPlan && (
              <button
                type="button"
                onClick={() => {
                  setCoachPlan(null);
                  setCoachError(null);
                  setFocusedSlot(null);
                }}
                className="flex w-full items-center justify-center gap-1.5 border border-[#263145] bg-[#111620] py-2 text-xs font-medium text-[#94A3B8] transition-colors hover:border-[#475569] hover:text-[#F1F5F9]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                ล้างแผน AI บนกระดาน
              </button>
            )}
          </div>

          {/* Error Banner */}
          {coachError && (
            <div
              role="alert"
              className="flex items-start gap-2 border border-[#FF4655]/50 bg-[#FF4655]/12 p-3 text-xs leading-relaxed text-[#FECDD3]"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4655]" />
              <span>{coachError}</span>
            </div>
          )}
        </section>

        {/* Column 3: Right (2D Adjusted Map + Per-Agent AI Coach Orders + Enemy Warnings) */}
        <section className="scrollbar-thin flex min-h-0 flex-col bg-[#0B0E14] lg:overflow-y-auto">
          {/* 2D Map Preview with AI Updated Positions, Arrows & Utility */}
          <div className="flex flex-col border-b border-[#263145] bg-[#111620]">
            <div className="flex items-center justify-between border-b border-[#263145] px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#F1F5F9] whitespace-nowrap">
                  แผนที่แก้เกม 2D · {activeMap.name}
                </span>
                {coachPlan && (
                  <span className="truncate text-xs font-semibold text-[#34D399]">
                    — {coachPlan.strategyName}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCallouts((v) => !v)}
                aria-pressed={showCallouts}
                className={`flex shrink-0 items-center gap-1 border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  showCallouts
                    ? 'border-[#22D3EE]/50 bg-[#22D3EE]/15 text-[#22D3EE]'
                    : 'border-[#263145] bg-[#171E2B] text-[#94A3B8] hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Callouts
              </button>
            </div>

            <div
              ref={stageRef}
              className="relative flex h-[310px] items-center justify-center overflow-hidden bg-[#0B0E14] sm:h-[360px]"
            >
              {activeMap.splash && (
                <img
                  src={activeMap.splash}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-20 saturate-75"
                />
              )}
              <div
                aria-hidden="true"
                className="bg-tactical-grid pointer-events-none absolute inset-0 opacity-40"
              />

              <div
                className="relative z-10 aspect-square"
                style={{
                  width: squareSize > 0 ? `${squareSize}px` : '100%',
                  height: squareSize > 0 ? `${squareSize}px` : '100%',
                  transform: `scale(${mapFit.autoScale})`,
                  transformOrigin: 'center center',
                }}
              >
                <div
                  className="relative h-full w-full"
                  style={{
                    transform: `translate(${centerOffset.x.toFixed(2)}%, ${centerOffset.y.toFixed(2)}%) rotate(${displayRotation}deg)`,
                    transformOrigin: 'center center',
                    transition: `transform ${ROTATION_TRANSITION}`,
                  }}
                >
                  {useLiveMapImg ? (
                    <img
                      src={activeMap.displayIcon}
                      alt={`แผนที่ ${activeMap.name}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImgFailed(true)}
                      className="pointer-events-none h-full w-full object-contain opacity-95"
                      draggable={false}
                    />
                  ) : (
                    <svg
                      viewBox="0 0 600 600"
                      className="pointer-events-none h-full w-full"
                      role="img"
                      aria-label={`แผนผังแผนที่ ${activeMap.name}`}
                    >
                      {activeMap.fallbackGeometry.floors.map((r, idx) => (
                        <rect
                          key={idx}
                          x={r.x}
                          y={r.y}
                          width={r.w}
                          height={r.h}
                          fill="#1C2433"
                        />
                      ))}
                      {activeMap.fallbackGeometry.sites.map((s) => (
                        <g key={s.label}>
                          <rect
                            x={s.x + 4}
                            y={s.y + 4}
                            width={s.w - 8}
                            height={s.h - 8}
                            fill="rgba(255, 70, 85, 0.14)"
                            stroke="#FF4655"
                            strokeDasharray="6 4"
                            strokeWidth="1.5"
                          />
                          <text
                            x={s.x + s.w / 2}
                            y={s.y + s.h / 2 + 18}
                            textAnchor="middle"
                            fill="#FF4655"
                            className="font-display text-[48px] font-bold"
                            style={counterRotateSvg(s.x + s.w / 2, s.y + s.h / 2)}
                          >
                            {s.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  )}

                  {/* SVG Callouts + Tactical Arrows + Smokes */}
                  <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs>
                      <radialGradient id="lm-smoke-grad">
                        <stop offset="0%" stopColor="#A855F7" stopOpacity="0.65" />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity="0.22" />
                      </radialGradient>
                    </defs>

                    {useLiveMapImg &&
                      siteLabels.map((sl) => (
                        <text
                          key={sl.key}
                          x={sl.x}
                          y={sl.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#FF4655"
                          fontSize="4.6"
                          className="font-display font-bold"
                          style={{
                            paintOrder: 'stroke',
                            stroke: 'rgba(11, 14, 20, 0.9)',
                            strokeWidth: '0.8',
                            ...counterRotateSvg(sl.x, sl.y),
                          }}
                        >
                          {sl.group}
                        </text>
                      ))}

                    {showCallouts &&
                      activeMap.callouts
                        .filter((c) => c.name !== 'Site')
                        .map((c) => (
                          <g key={c.key}>
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r="0.55"
                              fill={
                                c.group === 'Atk'
                                  ? '#FF4655'
                                  : c.group === 'Def'
                                  ? '#22D3EE'
                                  : '#94A3B8'
                              }
                            />
                            <text
                              x={c.x}
                              y={c.y - 1.1}
                              textAnchor="middle"
                              fill="#F1F5F9"
                              fontSize="1.65"
                              className="font-display font-semibold"
                              style={{
                                paintOrder: 'stroke',
                                stroke: 'rgba(11, 14, 20, 0.94)',
                                strokeWidth: '0.55',
                                strokeLinejoin: 'round',
                                ...counterRotateSvg(c.x, c.y),
                              }}
                            >
                              {c.key}
                            </text>
                          </g>
                        ))}

                    {boardElements.strokes.map((st) => {
                      if (st.points.length < 2) return null;
                      const ptsStr = st.points.map((p) => `${p.x},${p.y}`).join(' ');
                      const last = st.points[st.points.length - 1];
                      const prev = st.points[st.points.length - 2];
                      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
                      const headSize = 2.0;
                      const arrowPts = `${last.x},${last.y} ${
                        last.x - headSize * Math.cos(angle - Math.PI / 6)
                      },${last.y - headSize * Math.sin(angle - Math.PI / 6)} ${
                        last.x - headSize * Math.cos(angle + Math.PI / 6)
                      },${last.y - headSize * Math.sin(angle + Math.PI / 6)}`;
                      return (
                        <g key={st.id}>
                          <polyline
                            points={ptsStr}
                            fill="none"
                            stroke="#0B0E14"
                            strokeWidth="1.45"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.7"
                          />
                          <polyline
                            points={ptsStr}
                            fill="none"
                            stroke={st.color}
                            strokeWidth="0.9"
                            strokeDasharray="2.1 1.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="animate-route-dash"
                          />
                          <circle cx={st.points[0].x} cy={st.points[0].y} r="0.9" fill={st.color} />
                          <polygon points={arrowPts} fill={st.color} />
                        </g>
                      );
                    })}

                    {boardElements.markers
                      .filter((m) => m.kind === 'smoke')
                      .map((m) => {
                        smokeNumber += 1;
                        return (
                          <g key={m.id}>
                            <circle
                              cx={m.x}
                              cy={m.y}
                              r="4"
                              fill="url(#lm-smoke-grad)"
                              stroke="#A855F7"
                              strokeWidth="0.4"
                            />
                            <text
                              x={m.x}
                              y={m.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#FFFFFF"
                              fontSize="2.4"
                              className="font-display font-bold"
                              style={counterRotateSvg(m.x, m.y)}
                            >
                              {smokeNumber}
                            </text>
                          </g>
                        );
                      })}
                  </svg>

                  {/* Position Circles & Tactical Skill Markers */}
                  {boardElements.markers
                    .filter((m) => m.kind !== 'smoke')
                    .map((m) => {
                      const ag = m.agentId ? agentById.get(m.agentId) : undefined;
                      if (m.kind === 'position') {
                        const toneRing: Record<
                          NonNullable<BoardMarker['roleTone']>,
                          { border: string; ring: string; badge: string }
                        > = {
                          attack: {
                            border: 'border-[#FF4655]',
                            ring: 'ring-[#FF4655]/45',
                            badge: 'border-[#FF4655]/70 text-[#FECDD3]',
                          },
                          defense: {
                            border: 'border-[#22D3EE]',
                            ring: 'ring-[#22D3EE]/45',
                            badge: 'border-[#22D3EE]/70 text-[#A5F3FC]',
                          },
                          lurk: {
                            border: 'border-[#FBBF24]',
                            ring: 'ring-[#FBBF24]/45',
                            badge: 'border-[#FBBF24]/70 text-[#FDE68A]',
                          },
                          warning: {
                            border: 'border-[#FB923C]',
                            ring: 'ring-[#FB923C]/50',
                            badge: 'border-[#FB923C]/70 text-[#FED7AA]',
                          },
                        };
                        const tone =
                          toneRing[
                            m.roleTone ?? (matchState.side === 'attack' ? 'attack' : 'defense')
                          ];
                        const isFocused = focusedSlot !== null && m.slotNumber === focusedSlot;

                        return (
                          <div
                            key={m.id}
                            style={{ left: `${m.x}%`, top: `${m.y}%`, ...counterRotateHtml }}
                            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                          >
                            <div
                              className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 bg-[#0B0E14]/95 ring-2 ring-offset-1 ring-offset-[#0B0E14] shadow-lg transition-transform ${tone.border} ${
                                isFocused ? 'scale-125 ring-white' : tone.ring
                              }`}
                            >
                              {ag?.icon ? (
                                <img
                                  src={ag.icon}
                                  alt={ag.name}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="font-mono-tabular text-xs font-bold text-white">
                                  {m.slotNumber ?? '•'}
                                </span>
                              )}
                            </div>
                            {m.label && (
                              <span
                                className={`mt-1 whitespace-nowrap border bg-[#0B0E14]/95 px-1.5 py-0.5 text-[9px] font-semibold leading-none shadow ${tone.badge}`}
                              >
                                {m.label}
                              </span>
                            )}
                          </div>
                        );
                      }

                      const iconCfg: Record<
                        string,
                        { Icon: typeof Flame; color: string; ring: string }
                      > = {
                        flash: { Icon: Sparkles, color: 'text-[#FBBF24]', ring: 'border-[#FBBF24]' },
                        recon: { Icon: Radar, color: 'text-[#FACC15]', ring: 'border-[#FACC15]' },
                        molly: { Icon: Flame, color: 'text-[#FB7185]', ring: 'border-[#FB7185]' },
                        wall: { Icon: Shield, color: 'text-[#38BDF8]', ring: 'border-[#38BDF8]' },
                        spike: { Icon: Bomb, color: 'text-[#FF4655]', ring: 'border-[#FF4655]' },
                        pin: { Icon: MapPin, color: 'text-[#F1F5F9]', ring: 'border-[#94A3B8]' },
                      };
                      const cfg = iconCfg[m.kind] ?? iconCfg.pin;
                      const Icon = cfg.Icon;

                      return (
                        <div
                          key={m.id}
                          style={{ left: `${m.x}%`, top: `${m.y}%`, ...counterRotateHtml }}
                          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border bg-[#111620]/95 shadow ${cfg.ring}`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                          </div>
                          {m.label && (
                            <span className="mt-0.5 whitespace-nowrap border border-[#263145] bg-[#0B0E14]/95 px-1 py-0 text-[9px] font-medium text-[#F1F5F9]">
                              {m.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5">
                <div
                  className="pointer-events-none flex items-center gap-1.5 border border-[#263145] bg-[#0B0E14]/85 px-2 py-1 font-mono-tabular text-[10px] text-[#94A3B8]"
                  aria-label={`ทิศเหนือของแผนที่หมุน ${rotation} องศา`}
                >
                  <div
                    className="relative flex h-5 w-5 items-center justify-center rounded-full border border-[#263145]"
                    style={{
                      transform: `rotate(${displayRotation}deg)`,
                      transition: `transform ${ROTATION_TRANSITION}`,
                    }}
                  >
                    <Compass className="h-3 w-3 text-[#94A3B8]" />
                    <span
                      className="absolute -top-0.5 left-1/2 h-1.5 w-1 -translate-x-1/2 bg-[#FF4655]"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[#F1F5F9]">N</span>
                  <span>{rotation > 0 ? `+${rotation}` : rotation}°</span>
                </div>
                <button
                  type="button"
                  onClick={rotateManually}
                  title="หมุนแผนที่ 90° (สลับฝั่งเพื่อรีเซ็ตมุมอัตโนมัติ)"
                  aria-label="หมุนแผนที่ 90 องศา"
                  className={`flex items-center gap-1 border px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4655] ${
                    manualQuarterTurns !== 0
                      ? 'border-[#FF4655] bg-[#FF4655]/20 text-white'
                      : 'border-[#263145] bg-[#0B0E14]/85 text-[#CBD5E1] hover:border-[#475569] hover:text-white'
                  }`}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  90°
                </button>
              </div>
            </div>
          </div>

          {/* Per-Agent Coach Commands + Enemy Warnings */}
          <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
            {/* Box 1: AI Coach Per-Agent Commands */}
            <div className="space-y-2.5 border border-[#263145] bg-[#111620] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                  คำสั่งโค้ชแยกตาม Agent
                </h3>
                <span className="font-mono-tabular text-[11px] font-semibold text-[#FBBF24]">
                  {activeEconomyMeta.label}
                </span>
              </div>

              {coachLoading ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 border border-dashed border-[#263145] bg-[#0B0E14]/60 p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#22D3EE]" />
                  <p className="text-xs font-semibold text-[#CBD5E1]">
                    กำลังคำนวณแผนแก้เกมและพิกัดบน {activeMap.name}...
                  </p>
                </div>
              ) : coachPlan ? (
                <>
                  <div className="border border-[#263145] bg-[#171E2B] px-3 py-2">
                    <div className="text-xs font-bold text-[#34D399]">
                      {coachPlan.strategyName}
                    </div>
                    <div className="mt-0.5 text-[11px] leading-relaxed text-[#E2E8F0]">
                      {coachPlan.headline}
                    </div>
                  </div>

                  <ol className="space-y-2">
                    {coachPlan.agentOrders.map((order, idx) => {
                      const slotIdx = Math.max(0, Math.min(4, (order.slot || idx + 1) - 1));
                      const agId = order.agentId ?? matchState.ourTeam[slotIdx];
                      const ag = agId ? agentById.get(agId) : undefined;
                      const isFocused = focusedSlot === (order.slot || idx + 1);

                      return (
                        <li key={`${order.slot}-${order.agentName}-${idx}`}>
                          <button
                            type="button"
                            onClick={() =>
                              setFocusedSlot((prev) =>
                                prev === (order.slot || idx + 1) ? null : order.slot || idx + 1
                              )
                            }
                            className={`flex w-full items-start gap-2.5 border p-2.5 text-left transition-colors ${
                              isFocused
                                ? 'border-[#22D3EE] bg-[#22D3EE]/10'
                                : 'border-[#263145] bg-[#171E2B] hover:border-[#475569]'
                            }`}
                          >
                            {ag ? (
                              <AgentAvatar agent={ag} size="xs" />
                            ) : (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#FF4655] font-mono-tabular text-xs font-bold text-white">
                                {order.slot || idx + 1}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <span className="font-display text-xs font-bold uppercase text-[#F1F5F9]">
                                  {order.agentName}
                                </span>
                                <span className="font-mono-tabular text-[10px] text-[#94A3B8]">
                                  {order.callout} · ({Math.round(order.x)}, {Math.round(order.y)})
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-[#E2E8F0]">
                                {order.command}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center border border-dashed border-[#263145] bg-[#0B0E14]/60 p-4 text-center">
                  <p className="text-sm font-semibold text-[#CBD5E1]">
                    พร้อมปรึกษา AI Coach ช่วง Buy Phase
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
                    กด Tag ด่วนหรือเล่าสถานการณ์ตรงกลาง แล้วกด &ldquo;ขอคำสั่งแก้เกม&rdquo; เพื่อรับคำสั่งแยกตาม Agent และอัปเดตจุดยืนบนแผนที่ 2D
                  </p>
                </div>
              )}
            </div>

            {/* Box 2: Enemy Agent Specific Counter Warnings */}
            <div className="space-y-2.5 border border-[#263145] bg-[#111620] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-[#FB923C]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  คำเตือนแก้ทางตัวละครศัตรู
                </h3>
                <span className="font-mono-tabular text-[11px] text-[#94A3B8]">
                  {enemyCounters.length}/5 ตัว
                </span>
              </div>

              {enemyCounters.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center border border-dashed border-[#263145] bg-[#0B0E14]/60 p-4 text-center">
                  <p className="text-sm font-semibold text-[#CBD5E1]">
                    ยังไม่ได้เลือกตัวละครศัตรู
                  </p>
                  <p className="mt-1 text-xs text-[#64748B]">
                    เลือกตัวละครศัตรูทางฝั่งซ้าย เพื่อรับคำเตือนรับมือสกิลเฉพาะตัวทันที
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {enemyCounters.map((item) => (
                    <li
                      key={item.agent.id}
                      className="flex items-start gap-2.5 border border-[#F97316]/35 bg-[#171E2B] p-2.5"
                    >
                      <AgentAvatar agent={item.agent} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-xs font-bold uppercase text-[#FED7AA]">
                          {item.agent.name}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-[#E2E8F0]">
                          {item.tip}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Fast Agent Picker Modal */}
      {pickingSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPickingSlot(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col border border-[#2E3B52] bg-[#111620] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#263145] px-4 py-3">
              <span className="font-display text-sm font-bold uppercase tracking-wide text-[#F1F5F9]">
                เลือก Agent ({pickingSlot.team === 'our' ? 'ทีมเรา' : 'ทีมศัตรู'} · ช่องที่{' '}
                {pickingSlot.index + 1})
              </span>
              <button
                type="button"
                onClick={() => setPickingSlot(null)}
                aria-label="ปิดหน้าต่างเลือกตัวละคร"
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 border-b border-[#263145] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="พิมพ์ชื่อ Agent..."
                  autoFocus
                  className="w-full border border-[#263145] bg-[#0B0E14] py-2 pl-9 pr-3 text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#FF4655] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPickerRole('all')}
                  className={`px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                    pickerRole === 'all'
                      ? 'bg-[#FF4655] text-white'
                      : 'bg-[#171E2B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  ทั้งหมด
                </button>
                {ROLES_ORDER.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPickerRole(r)}
                    className={`px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                      pickerRole === r
                        ? 'bg-[#263145] text-[#F1F5F9]'
                        : 'bg-[#171E2B] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {ROLE_META[r].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="scrollbar-thin grid grid-cols-4 gap-2 overflow-y-auto p-3 sm:grid-cols-6">
              {filteredPickerAgents.map((a) => {
                const targetTeam =
                  pickingSlot.team === 'our' ? matchState.ourTeam : matchState.enemyTeam;
                const inTeamElsewhere = targetTeam.some(
                  (id, i) => id === a.id && i !== pickingSlot.index
                );
                const isSelected = targetTeam[pickingSlot.index] === a.id;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      onChangeMatchState((prev) => ({
                        ...prev,
                        [pickingSlot.team === 'our' ? 'ourTeam' : 'enemyTeam']: updateSlot(
                          pickingSlot.team === 'our' ? prev.ourTeam : prev.enemyTeam,
                          pickingSlot.index,
                          a.id
                        ),
                      }));
                      setPickingSlot(null);
                    }}
                    className={`flex flex-col items-center gap-1 border p-1.5 transition-colors ${
                      isSelected
                        ? 'border-[#FF4655] bg-[#FF4655]/15'
                        : 'border-[#263145] bg-[#171E2B] hover:border-[#475569]'
                    } ${inTeamElsewhere ? 'opacity-45' : ''}`}
                  >
                    <AgentAvatar agent={a} size="sm" />
                    <span className="w-full truncate text-center font-display text-[10px] font-medium uppercase text-[#E2E8F0]">
                      {a.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
