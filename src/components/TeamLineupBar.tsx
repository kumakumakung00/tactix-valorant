import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Crosshair,
  Eye,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wand2,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  getCompsForMapAndPlay,
  getMetaAgentSetForMap,
  UNIVERSAL_STYLE_COMPS,
} from '../data/mapComps';
import { getPlaybooksForMap } from '../data/proPlaybooks';
import { ROLES_ORDER, ROLE_META } from '../data/valorantFallback';
import {
  Agent,
  AgentAbility,
  AgentRole,
  PendingAbilityPlace,
  Side,
  StrategyPlay,
  ValorantMap,
} from '../types/tactix';
import { analyzeComposition } from '../utils/compAnalyzer';
import { AgentAvatar } from './AgentAvatar';

interface TeamLineupBarProps {
  agents: Agent[];
  activeMap: ValorantMap;
  activePlay: StrategyPlay;
  side: Side;
  ourTeam: (string | null)[];
  enemyTeam: (string | null)[];
  pendingAgentPlace: { agentId: string; team: 'our' | 'enemy' } | null;
  pendingAbilityPlace: PendingAbilityPlace | null;
  activeProPlaybookId: string | null;
  onPickOur: (slotIndex: number, agentId: string | null) => void;
  onPickEnemy: (slotIndex: number, agentId: string | null) => void;
  onApplyOurComp: (agentIds: string[], agentDuties?: Record<string, string>) => void;
  onApplyProPlaybook: (playbookId: string) => void;
  onResetTeams: () => void;
  onRequestPlaceAgent: (agentId: string, team: 'our' | 'enemy') => void;
  onRequestPlaceAbility: (ability: PendingAbilityPlace) => void;
}

const SLOT_KEY_LABEL: Record<string, string> = {
  Grenade: 'C',
  Ability1: 'Q',
  Ability2: 'E',
  Ultimate: 'X',
  Passive: 'P',
};

const ROLE_ICON: Record<AgentRole, typeof Swords> = {
  duelist: Swords,
  initiator: Eye,
  controller: Wind,
  sentinel: Shield,
};

function inferAbilityMarkerKind(
  ability: AgentAbility
): PendingAbilityPlace['kind'] {
  const hay = `${ability.name} ${ability.description}`.toLowerCase();
  if (
    /smoke|cloudburst|dark cover|sky smoke|poison cloud|nebula|high tide|cove|ruse|ควัน|หมอก|บังสายตา|บดบังวิสัยทัศน์/.test(
      hay
    )
  ) {
    return 'smoke';
  }
  if (/wall|barrier|toxic screen|blaze|fast lane|cascade|กำแพง|ม่าน/.test(hay)) {
    return 'wall';
  }
  if (/flash|blind|paranoia|curveball|leer|guiding light|dizzy|ตาบอด|แฟลช/.test(hay)) {
    return 'flash';
  }
  if (
    /recon|drone|haunt|prowler|seeker|trailblazer|spycam|turret|alarmbot|zero\/point|ตรวจจับ|เปิดเผยตำแหน่ง|สอดแนม|โดรน|กล้อง/.test(
      hay
    )
  ) {
    return 'recon';
  }
  if (
    /molly|incendiary|snake bite|hot hands|paint shells|nanoswarm|frag|aftershock|shock|mosh|swarm|ไฟ|ระเบิด|กรด/.test(
      hay
    )
  ) {
    return 'molly';
  }
  return 'pin';
}

const KIND_LABEL: Record<PendingAbilityPlace['kind'], { text: string; color: string }> = {
  smoke: { text: 'ควัน / ตัดวิชั่น', color: 'text-[#A855F7]' },
  flash: { text: 'แฟลช / บังตา', color: 'text-[#FBBF24]' },
  recon: { text: 'หาข้อมูล / กับดัก', color: 'text-[#FACC15]' },
  molly: { text: 'เคลียร์พื้นที่ / ดาเมจ', color: 'text-[#FB7185]' },
  wall: { text: 'กำแพง / กั้นโซน', color: 'text-[#38BDF8]' },
  pin: { text: 'สกิลยุทธวิธี', color: 'text-[#22D3EE]' },
};

interface AgentPickerDropdownProps {
  slotIndex: number;
  team: (string | null)[];
  teamType: 'our' | 'enemy';
  agents: Agent[];
  metaAgentIds: Set<string>;
  alignRight?: boolean;
  onSelect: (agentId: string) => void;
  onClose: () => void;
}

function AgentPickerDropdown({
  slotIndex,
  team,
  teamType,
  agents,
  metaAgentIds,
  alignRight = false,
  onSelect,
  onClose,
}: AgentPickerDropdownProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AgentRole | 'all'>('all');

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (roleFilter !== 'all' && a.role !== roleFilter) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, roleFilter, search]);

  return (
    <div
      className={`absolute top-full z-50 mt-1 w-[320px] border border-[#2E3B52] bg-[#111620] shadow-2xl ${
        alignRight ? 'right-0' : 'left-0'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#263145] px-3 py-2">
        <span className="font-display text-xs font-semibold text-[#94A3B8]">
          {teamType === 'our' ? 'เลือกทีมเรา' : 'เลือกทีมศัตรู'} · ช่องที่ {slotIndex + 1}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[#64748B] hover:text-[#F1F5F9]"
          aria-label="ปิดหน้าต่างเลือกตัวละคร"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 border-b border-[#263145] p-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ Agent..."
            autoFocus
            className="w-full border border-[#263145] bg-[#0B0E14] py-1.5 pl-8 pr-2.5 text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#FF4655] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-[#FF4655] text-white'
                : 'bg-[#171E2B] text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            ทั้งหมด
          </button>
          {ROLES_ORDER.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-[#263145] text-[#F1F5F9]'
                  : 'bg-[#171E2B] text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {ROLE_META[r].label}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin max-h-[260px] overflow-y-auto p-2.5">
        {filteredAgents.length === 0 ? (
          <p className="py-5 text-center text-xs text-[#64748B]">ไม่พบ Agent ที่ตรงกับการค้นหา</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {filteredAgents.map((a) => {
              const alreadyInTeam = team.some((id, i) => id === a.id && i !== slotIndex);
              const isCurrent = team[slotIndex] === a.id;
              const isMeta = metaAgentIds.has(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  title={
                    alreadyInTeam
                      ? `${a.name} อยู่ในทีมแล้ว (กดเพื่อย้ายช่อง)`
                      : isMeta
                      ? `${a.name} · แนะนำสำหรับแผนที่นี้`
                      : a.name
                  }
                  onClick={() => onSelect(a.id)}
                  className={`relative flex flex-col items-center gap-1 border p-1.5 transition-colors ${
                    isCurrent
                      ? 'border-[#FF4655] bg-[#FF4655]/15'
                      : isMeta
                      ? 'border-[#FBBF24]/45 bg-[#171E2B] hover:border-[#FBBF24] hover:bg-[#1E2738]'
                      : 'border-[#263145] bg-[#171E2B] hover:border-[#475569] hover:bg-[#1E2738]'
                  } ${alreadyInTeam ? 'opacity-45' : ''}`}
                >
                  {isMeta && (
                    <span className="absolute right-0.5 top-0.5 text-[8px] font-bold leading-none text-[#FBBF24]">
                      ★
                    </span>
                  )}
                  <AgentAvatar agent={a} size="sm" />
                  <span className="w-full truncate text-center font-display text-[10px] font-medium uppercase text-[#E2E8F0]">
                    {a.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

type ActivePopover = 'comps' | 'pro' | 'analysis' | 'enemy' | null;

export function TeamLineupBar({
  agents,
  activeMap,
  activePlay,
  side,
  ourTeam,
  enemyTeam,
  pendingAgentPlace,
  pendingAbilityPlace,
  activeProPlaybookId,
  onPickOur,
  onPickEnemy,
  onApplyOurComp,
  onApplyProPlaybook,
  onResetTeams,
  onRequestPlaceAgent,
  onRequestPlaceAbility,
}: TeamLineupBarProps) {
  const [openSlotPicker, setOpenSlotPicker] = useState<{
    team: 'our' | 'enemy';
    index: number;
  } | null>(null);
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [hoveredSkill, setHoveredSkill] = useState<{
    slotIndex: number;
    agent: Agent;
    ability: AgentAbility;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);
  const metaAgentIds = useMemo(() => getMetaAgentSetForMap(activeMap.id), [activeMap.id]);
  const mapComps = useMemo(
    () => getCompsForMapAndPlay(activeMap.id, side, activePlay),
    [activeMap.id, side, activePlay]
  );
  const proPlaybooks = useMemo(() => getPlaybooksForMap(activeMap.id), [activeMap.id]);
  const analysis = useMemo(
    () => analyzeComposition(ourTeam, enemyTeam, agents),
    [ourTeam, enemyTeam, agents]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenSlotPicker(null);
        setActivePopover(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenSlotPicker(null);
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    setActivePopover(null);
    setOpenSlotPicker(null);
  }, [activeMap.id, side]);

  const ourCount = ourTeam.filter(Boolean).length;
  const enemyCount = enemyTeam.filter(Boolean).length;
  const enemySide: Side = side === 'attack' ? 'defense' : 'attack';
  const totalCompOptions = mapComps.length + UNIVERSAL_STYLE_COMPS.length;

  const togglePopover = (target: Exclude<ActivePopover, null>) => {
    setOpenSlotPicker(null);
    setActivePopover((prev) => (prev === target ? null : target));
  };

  return (
    <section
      ref={containerRef}
      aria-label="Team Lineup 5 ตัว และสกิลเฉพาะทีมที่เลือก"
      className="relative z-30 border-b border-[#263145] bg-[#111620] px-3 py-1.5"
    >
      {/* Compact Header & Team Utility Popovers */}
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-display text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
            Team Lineup
          </span>
          <span
            className={`font-mono-tabular font-semibold ${
              side === 'attack' ? 'text-[#FF4655]' : 'text-[#22D3EE]'
            }`}
          >
            {ourCount}/5
          </span>
          <span className="hidden text-[#64748B] sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="hidden text-[#94A3B8] sm:inline">
            แสดงเฉพาะสกิลของ {ourCount} ตัวที่เลือก (คลิกสกิลเพื่อวางบนแผนที่)
          </span>
        </div>

        <div className="relative flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => togglePopover('pro')}
            aria-expanded={activePopover === 'pro'}
            className={`flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              activePopover === 'pro'
                ? 'border-[#FBBF24] bg-[#FBBF24] text-[#0B0E14]'
                : 'border-[#FBBF24]/50 bg-[#FBBF24]/10 text-[#FDE68A] hover:bg-[#FBBF24]/20'
            }`}
          >
            <Trophy className="h-3 w-3" />
            <span>แผนทีมดัง</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${activePopover === 'pro' ? 'rotate-180' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={() => togglePopover('comps')}
            aria-expanded={activePopover === 'comps'}
            className={`flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              activePopover === 'comps'
                ? 'border-[#FBBF24] bg-[#FBBF24]/15 text-[#FDE68A]'
                : 'border-[#263145] bg-[#171E2B] text-[#CBD5E1] hover:border-[#FBBF24] hover:text-[#FDE68A]'
            }`}
          >
            <Wand2 className="h-3 w-3" />
            <span>สูตรคอมพ์ ({totalCompOptions})</span>
          </button>

          <button
            type="button"
            onClick={() => togglePopover('analysis')}
            aria-expanded={activePopover === 'analysis'}
            className={`flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              activePopover === 'analysis'
                ? 'border-[#22D3EE] bg-[#22D3EE]/15 text-[#22D3EE]'
                : analysis.warnings.length > 0
                ? 'border-[#FB923C]/50 bg-[#171E2B] text-[#FED7AA] hover:border-[#FB923C]'
                : 'border-[#263145] bg-[#171E2B] text-[#CBD5E1] hover:border-[#22D3EE] hover:text-[#22D3EE]'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            <span>วิเคราะห์คอมพ์</span>
            {analysis.warnings.length > 0 && (
              <span className="font-mono-tabular text-[10px] font-bold text-[#FB923C]">
                ({analysis.warnings.length})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => togglePopover('enemy')}
            aria-expanded={activePopover === 'enemy'}
            className={`flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              activePopover === 'enemy'
                ? 'border-[#FB7185] bg-[#FB7185]/15 text-[#FECDD3]'
                : 'border-[#263145] bg-[#171E2B] text-[#CBD5E1] hover:border-[#FB7185] hover:text-[#FECDD3]'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>ทีมศัตรู</span>
            <span className="font-mono-tabular text-[10px] text-[#94A3B8]">{enemyCount}/5</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onResetTeams();
              setActivePopover(null);
              setOpenSlotPicker(null);
            }}
            title="ล้างตัวละครทั้งหมด"
            aria-label="ล้างตัวละครทั้งหมด"
            className="flex items-center gap-1 border border-[#263145] bg-[#171E2B] px-1.5 py-0.5 text-[11px] text-[#94A3B8] transition-colors hover:border-[#FF4655] hover:text-[#FF4655]"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden md:inline">ล้าง</span>
          </button>

          {/* Popover: Pro Playbooks */}
          {activePopover === 'pro' && (
            <div className="scrollbar-thin absolute right-0 top-full z-50 mt-1.5 max-h-96 w-80 space-y-1.5 overflow-y-auto border border-[#FBBF24]/50 bg-[#0B0E14] p-2.5 shadow-2xl">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                <span>แผนทีมโปรระดับโลก · {activeMap.name}</span>
                <span className="font-mono-tabular text-[#94A3B8]">{proPlaybooks.length} ทีม</span>
              </div>
              {proPlaybooks.length === 0 ? (
                <p className="py-3 text-center text-xs text-[#64748B]">
                  ยังไม่มีแผนทีมโปรเฉพาะด่าน {activeMap.name}
                </p>
              ) : (
                proPlaybooks.map((pb) => {
                  const applied = activeProPlaybookId === pb.id;
                  return (
                    <button
                      key={pb.id}
                      type="button"
                      onClick={() => {
                        onApplyProPlaybook(pb.id);
                        setActivePopover(null);
                      }}
                      className={`w-full border p-2 text-left transition-colors ${
                        applied
                          ? 'border-[#FBBF24] bg-[#FBBF24]/15'
                          : 'border-[#263145] bg-[#171E2B] hover:border-[#FBBF24]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[11px] font-semibold text-[#F1F5F9]">
                          {pb.teamName}
                        </span>
                        {applied && (
                          <span className="shrink-0 text-[9px] font-bold text-[#FBBF24]">
                            กำลังใช้
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1">
                        {pb.agents.map((agId) => {
                          const ag = agentById.get(agId);
                          return ag ? <AgentAvatar key={agId} agent={ag} size="xs" /> : null;
                        })}
                      </div>
                      <p className="mt-1 text-[10px] leading-snug text-[#94A3B8]">
                        สไตล์: {pb.styleLabel}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Popover: Comp Presets */}
          {activePopover === 'comps' && (
            <div className="scrollbar-thin absolute right-0 top-full z-50 mt-1.5 max-h-96 w-80 space-y-3 overflow-y-auto border border-[#FBBF24]/40 bg-[#0B0E14] p-2.5 shadow-2xl">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                  <span>คอมพ์ประจำด่าน {activeMap.name}</span>
                  <span className="font-mono-tabular text-[#94A3B8]">{mapComps.length} สูตร</span>
                </div>
                <div className="space-y-1.5">
                  {mapComps.map((comp) => {
                    const applied = comp.agents.every((id) => ourTeam.includes(id));
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => {
                          onApplyOurComp(comp.agents, comp.agentDuties);
                          setActivePopover(null);
                        }}
                        className={`w-full border p-2 text-left transition-colors ${
                          applied
                            ? 'border-[#34D399]/70 bg-[#34D399]/10'
                            : 'border-[#263145] bg-[#171E2B] hover:border-[#FBBF24]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[11px] font-semibold text-[#F1F5F9]">
                            {comp.title}
                          </span>
                          {applied ? (
                            <span className="shrink-0 text-[9px] font-bold text-[#34D399]">
                              กำลังใช้
                            </span>
                          ) : comp.isBestForPlay ? (
                            <span className="shrink-0 text-[9px] font-bold text-[#FBBF24]">
                              ตรงแผน
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          {comp.agents.map((agId) => {
                            const ag = agentById.get(agId);
                            return ag ? <AgentAvatar key={agId} agent={ag} size="xs" /> : null;
                          })}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[#94A3B8]">
                          {comp.reason}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#263145] pt-2.5">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#22D3EE]">
                  <span>คอมพ์ตามสไตล์การเล่น (ทุกด่าน)</span>
                  <span className="font-mono-tabular text-[#94A3B8]">
                    {UNIVERSAL_STYLE_COMPS.length} สูตร
                  </span>
                </div>
                <div className="space-y-1.5">
                  {UNIVERSAL_STYLE_COMPS.map((comp) => {
                    const applied = comp.agents.every((id) => ourTeam.includes(id));
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => {
                          onApplyOurComp(comp.agents, comp.agentDuties);
                          setActivePopover(null);
                        }}
                        className={`w-full border p-2 text-left transition-colors ${
                          applied
                            ? 'border-[#34D399]/70 bg-[#34D399]/10'
                            : 'border-[#263145] bg-[#171E2B] hover:border-[#22D3EE]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[11px] font-semibold text-[#F1F5F9]">
                            {comp.title}
                          </span>
                          {applied && (
                            <span className="shrink-0 text-[9px] font-bold text-[#34D399]">
                              กำลังใช้
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          {comp.agents.map((agId) => {
                            const ag = agentById.get(agId);
                            return ag ? <AgentAvatar key={agId} agent={ag} size="xs" /> : null;
                          })}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[#94A3B8]">
                          {comp.reason}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Popover: Comp Analysis */}
          {activePopover === 'analysis' && (
            <div className="scrollbar-thin absolute right-0 top-full z-50 mt-1.5 max-h-[70vh] w-80 space-y-2.5 overflow-y-auto border border-[#22D3EE]/50 bg-[#0B0E14] p-3 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
                  วิเคราะห์คอมพ์ทีมเรา
                </h3>
                <span className="font-mono-tabular text-[11px] text-[#94A3B8]">
                  {analysis.pickedCount}/5 ตัว
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {ROLES_ORDER.map((r) => {
                  const Icon = ROLE_ICON[r];
                  return (
                    <div
                      key={r}
                      className="flex flex-col items-center border border-[#263145] bg-[#171E2B] py-1.5"
                    >
                      <Icon className={`h-3.5 w-3.5 ${ROLE_META[r].colorClass}`} />
                      <span className="mt-1 font-mono-tabular text-xs font-semibold text-[#F1F5F9]">
                        {analysis.roleCounts[r]}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {ROLE_META[r].label.slice(0, 4)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border border-[#263145] bg-[#171E2B] p-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  สไตล์การเล่นของทีม
                </div>
                <div className="mt-1 text-xs font-bold text-[#F1F5F9]">{analysis.playStyle}</div>
              </div>

              {analysis.pickedCount > 0 && (
                <>
                  <div className="space-y-1.5 border border-[#263145] bg-[#171E2B] p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#34D399]">
                      <Sparkles className="h-3 w-3" />
                      <span>จุดเด่นและแนวทางเล่น</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#CBD5E1]">
                      <strong className="text-[#FF4655]">บุก:</strong> {analysis.attackTip}
                    </p>
                    <p className="text-[11px] leading-relaxed text-[#CBD5E1]">
                      <strong className="text-[#22D3EE]">รับ:</strong> {analysis.defenseTip}
                    </p>
                  </div>

                  {analysis.recommendedCombo && (
                    <div className="space-y-1.5 border border-[#263145] bg-[#171E2B] p-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                        <Zap className="h-3 w-3" />
                        <span>คอมโบสกิลแนะนำ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 shrink-0">
                          <AgentAvatar agent={analysis.recommendedCombo.agents[0]} size="xs" />
                          <span className="text-[10px] font-bold text-[#94A3B8]">+</span>
                          <AgentAvatar agent={analysis.recommendedCombo.agents[1]} size="xs" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#F1F5F9]">
                          {analysis.recommendedCombo.title}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#CBD5E1]">
                        {analysis.recommendedCombo.detail}
                      </p>
                    </div>
                  )}

                  {analysis.warnings.length > 0 && (
                    <div className="space-y-1.5">
                      {analysis.warnings.map((w) => (
                        <div
                          key={w}
                          className="flex items-start gap-2 border border-[#F97316]/45 bg-[#F97316]/12 px-2.5 py-2 text-[11px] leading-relaxed text-[#FED7AA]"
                        >
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FB923C]" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Popover: Enemy Team 5 Slots */}
          {activePopover === 'enemy' && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-80 space-y-2.5 border border-[#FB7185]/45 bg-[#0B0E14] p-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                    ทีมศัตรู
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    {enemySide === 'attack' ? 'ฝั่งบุก · Attack' : 'ฝั่งรับ · Defense'}
                  </p>
                </div>
                <span className="font-mono-tabular text-xs font-semibold text-[#FB7185]">
                  {enemyCount}/5
                </span>
              </div>

              <div className="space-y-1.5">
                {enemyTeam.map((agId, idx) => {
                  const ag = agId ? agentById.get(agId) : undefined;
                  const isPickerOpen =
                    openSlotPicker?.team === 'enemy' && openSlotPicker.index === idx;
                  const isPlacingThis =
                    pendingAgentPlace?.team === 'enemy' && pendingAgentPlace.agentId === agId;
                  return (
                    <div key={`enemy-${idx}`} className="relative">
                      <div className="flex h-10 items-center gap-2 border border-[#263145] bg-[#171E2B] px-2">
                        <span className="w-3.5 font-mono-tabular text-[11px] text-[#64748B]">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSlotPicker(isPickerOpen ? null : { team: 'enemy', index: idx })
                          }
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          {ag ? (
                            <>
                              <AgentAvatar agent={ag} size="xs" />
                              <span className="truncate font-display text-xs font-semibold uppercase text-[#F1F5F9]">
                                {ag.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-[#64748B]">+ เลือกตัวศัตรู</span>
                          )}
                        </button>
                        {ag && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onRequestPlaceAgent(ag.id, 'enemy');
                                setActivePopover(null);
                              }}
                              title={`วาง ${ag.name} ลงบนแผนที่`}
                              className={`flex h-6 w-6 items-center justify-center border ${
                                isPlacingThis
                                  ? 'border-[#FF4655] bg-[#FF4655] text-white'
                                  : 'border-[#263145] bg-[#111620] text-[#94A3B8] hover:text-white'
                              }`}
                            >
                              <MapPin className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onPickEnemy(idx, null)}
                              title="นำออก"
                              className="flex h-6 w-6 items-center justify-center border border-[#263145] bg-[#111620] text-[#64748B] hover:text-[#FF4655]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isPickerOpen && (
                        <AgentPickerDropdown
                          slotIndex={idx}
                          team={enemyTeam}
                          teamType="enemy"
                          agents={agents}
                          metaAgentIds={metaAgentIds}
                          alignRight
                          onSelect={(id) => {
                            onPickEnemy(idx, id);
                            setOpenSlotPicker(null);
                          }}
                          onClose={() => setOpenSlotPicker(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {analysis.enemyCounters.length > 0 && (
                <div className="space-y-1 border-t border-[#263145] pt-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#FB7185]">
                    <Crosshair className="h-3 w-3" />
                    <span>จุดต้องระวังจากฝั่งศัตรู</span>
                  </div>
                  {analysis.enemyCounters.map((c) => (
                    <p
                      key={c}
                      className="border border-[#FB7185]/25 bg-[#FB7185]/10 px-2 py-1.5 text-[11px] leading-relaxed text-[#FECDD3]"
                    >
                      {c}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compact 5-Slot Team Lineup + Selected Agents' Abilities ONLY */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {ourTeam.map((agentId, slotIndex) => {
          const agent = agentId ? agentById.get(agentId) : undefined;
          const isPickerOpen =
            openSlotPicker?.team === 'our' && openSlotPicker.index === slotIndex;
          const isPlacingAgent =
            pendingAgentPlace?.team === 'our' && pendingAgentPlace.agentId === agentId;
          const slotAbilities = agent ? agent.abilities.slice(0, 4) : [];

          return (
            <div
              key={`lineup-slot-${slotIndex}`}
              className={`relative border px-2 py-1.5 transition-colors ${
                agent
                  ? side === 'attack'
                    ? 'border-[#263145] bg-[#171E2B] hover:border-[#FF4655]/60'
                    : 'border-[#263145] bg-[#171E2B] hover:border-[#22D3EE]/60'
                  : 'border-dashed border-[#263145] bg-[#0B0E14]/60 hover:border-[#3A4A66]'
              }`}
            >
              {/* Agent Line */}
              <div className="flex h-7 items-center gap-1.5">
                <span className="w-3 shrink-0 font-mono-tabular text-[10px] text-[#64748B]">
                  {slotIndex + 1}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setActivePopover(null);
                    setOpenSlotPicker(isPickerOpen ? null : { team: 'our', index: slotIndex });
                  }}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF4655]"
                >
                  {agent ? (
                    <>
                      <AgentAvatar agent={agent} size="xs" />
                      <span className="truncate font-display text-xs font-semibold uppercase tracking-wide text-[#F1F5F9]">
                        {agent.name}
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#CBD5E1] whitespace-nowrap">
                      <Plus className="h-3 w-3 shrink-0" />
                      <span>เลือก Agent</span>
                    </span>
                  )}
                </button>

                {agent && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onRequestPlaceAgent(agent.id, 'our')}
                      title={`วาง ${agent.name} ลงบนแผนที่`}
                      aria-label={`วาง ${agent.name} ลงบนแผนที่`}
                      className={`flex h-6 w-6 items-center justify-center border transition-colors ${
                        isPlacingAgent
                          ? 'border-[#FF4655] bg-[#FF4655] text-white'
                          : 'border-[#263145] bg-[#111620] text-[#94A3B8] hover:border-[#475569] hover:text-[#F1F5F9]'
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPickOur(slotIndex, null)}
                      title={`นำ ${agent.name} ออก`}
                      aria-label={`นำ ${agent.name} ออก`}
                      className="flex h-6 w-6 items-center justify-center border border-[#263145] bg-[#111620] text-[#64748B] transition-colors hover:border-[#FF4655]/50 hover:text-[#FF4655]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Abilities Row — Shown ONLY for this selected Agent */}
              {agent && slotAbilities.length > 0 && (
                <div className="mt-1 flex items-center gap-1 border-t border-[#263145]/80 pt-1">
                  {slotAbilities.map((ab) => {
                    const keyLabel = SLOT_KEY_LABEL[ab.slot] ?? ab.slot.slice(0, 1);
                    const isPlacingThisSkill =
                      pendingAbilityPlace?.agentId === agent.id &&
                      pendingAbilityPlace.abilityName === ab.name;
                    const kind = inferAbilityMarkerKind(ab);

                    return (
                      <button
                        key={`${ab.slot}-${ab.name}`}
                        type="button"
                        onClick={() =>
                          onRequestPlaceAbility({
                            agentId: agent.id,
                            agentName: agent.name,
                            abilitySlot: keyLabel,
                            abilityName: ab.name,
                            abilityIcon: ab.icon,
                            kind,
                          })
                        }
                        onMouseEnter={() => setHoveredSkill({ slotIndex, agent, ability: ab })}
                        onMouseLeave={() =>
                          setHoveredSkill((prev) =>
                            prev?.slotIndex === slotIndex && prev.ability.name === ab.name
                              ? null
                              : prev
                          )
                        }
                        onFocus={() => setHoveredSkill({ slotIndex, agent, ability: ab })}
                        onBlur={() =>
                          setHoveredSkill((prev) =>
                            prev?.slotIndex === slotIndex && prev.ability.name === ab.name
                              ? null
                              : prev
                          )
                        }
                        aria-label={`${agent.name} ${keyLabel}: ${ab.name}`}
                        aria-pressed={isPlacingThisSkill}
                        className={`flex h-6 min-w-0 flex-1 items-center justify-center gap-1 border px-1 transition-colors ${
                          isPlacingThisSkill
                            ? 'border-[#22D3EE] bg-[#22D3EE]/20 text-white'
                            : 'border-[#263145] bg-[#111620] text-[#CBD5E1] hover:border-[#FF4655]/70 hover:text-white'
                        }`}
                      >
                        {ab.icon ? (
                          <img
                            src={ab.icon}
                            alt={ab.name}
                            referrerPolicy="no-referrer"
                            className="h-3.5 w-3.5 shrink-0 object-contain"
                          />
                        ) : null}
                        <span className="font-mono-tabular text-[10px] font-semibold leading-none">
                          {keyLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Hover Skill Detail Tooltip */}
              {hoveredSkill?.slotIndex === slotIndex && (
                <div
                  className={`pointer-events-none absolute top-full z-50 mt-1 w-64 border border-[#2E3B52] bg-[#0B0E14] p-2.5 shadow-2xl ${
                    slotIndex >= 3 ? 'right-0' : 'left-0'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs font-bold text-[#F1F5F9]">
                      [{SLOT_KEY_LABEL[hoveredSkill.ability.slot] ?? '?'}]{' '}
                      {hoveredSkill.ability.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        KIND_LABEL[inferAbilityMarkerKind(hoveredSkill.ability)].color
                      }`}
                    >
                      {KIND_LABEL[inferAbilityMarkerKind(hoveredSkill.ability)].text}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#CBD5E1]">
                    {hoveredSkill.ability.description ||
                      `สกิลของ ${hoveredSkill.agent.name} — คลิกเพื่อวางตำแหน่งบนแผนที่`}
                  </p>
                  <div className="mt-1.5 border-t border-[#263145] pt-1 text-[10px] text-[#22D3EE]">
                    คลิกเพื่อวางสกิลนี้ลงบนแผนที่
                  </div>
                </div>
              )}

              {/* Agent Picker Popover for this slot */}
              {isPickerOpen && (
                <AgentPickerDropdown
                  slotIndex={slotIndex}
                  team={ourTeam}
                  teamType="our"
                  agents={agents}
                  metaAgentIds={metaAgentIds}
                  alignRight={slotIndex >= 3}
                  onSelect={(id) => {
                    onPickOur(slotIndex, id);
                    setOpenSlotPicker(null);
                  }}
                  onClose={() => setOpenSlotPicker(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
