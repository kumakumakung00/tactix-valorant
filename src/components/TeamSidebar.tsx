import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
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
  Wand2,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { ROLES_ORDER, ROLE_META } from '../data/valorantFallback';
import {
  getCompsForMapAndPlay,
  getMetaAgentSetForMap,
  UNIVERSAL_STYLE_COMPS,
} from '../data/mapComps';
import { Agent, AgentRole, Side, StrategyPlay, ValorantMap } from '../types/tactix';
import { analyzeComposition } from '../utils/compAnalyzer';
import { AgentAvatar } from './AgentAvatar';

interface TeamSidebarProps {
  agents: Agent[];
  activeMap: ValorantMap;
  activePlay: StrategyPlay;
  side: Side;
  ourTeam: (string | null)[];
  enemyTeam: (string | null)[];
  pendingAgentPlace: { agentId: string; team: 'our' | 'enemy' } | null;
  onPickOur: (slotIndex: number, agentId: string | null) => void;
  onPickEnemy: (slotIndex: number, agentId: string | null) => void;
  onApplyOurComp: (agentIds: string[], agentDuties?: Record<string, string>) => void;
  onResetTeams: () => void;
  onRequestPlaceAgent: (agentId: string, team: 'our' | 'enemy') => void;
}

const ROLE_ICON: Record<AgentRole, typeof Swords> = {
  duelist: Swords,
  initiator: Eye,
  controller: Wind,
  sentinel: Shield,
};

interface SlotPickerProps {
  slotIndex: number;
  team: (string | null)[];
  teamType: 'our' | 'enemy';
  sideTone: Side;
  agents: Agent[];
  metaAgentIds: Set<string>;
  isPlacingThis: boolean;
  onPick: (agentId: string | null) => void;
  onPlaceOnMap: (agentId: string) => void;
}

function TeamSlotRow({
  slotIndex,
  team,
  teamType,
  sideTone,
  agents,
  metaAgentIds,
  isPlacingThis,
  onPick,
  onPlaceOnMap,
}: SlotPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AgentRole | 'all'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedId = team[slotIndex];
  const agent = selectedId ? agents.find((a) => a.id === selectedId) : undefined;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (roleFilter !== 'all' && a.role !== roleFilter) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, roleFilter, search]);

  const accentBorder =
    sideTone === 'attack'
      ? 'border-[#FF4655]/45 hover:border-[#FF4655]'
      : 'border-[#22D3EE]/45 hover:border-[#22D3EE]';

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex h-12 items-center gap-2.5 border bg-[#171E2B] px-2.5 transition-colors ${
          agent ? accentBorder : 'border-[#263145] hover:border-[#3A4A66]'
        }`}
      >
        <span className="w-4 font-mono-tabular text-[11px] text-[#64748B]">{slotIndex + 1}</span>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF4655]"
        >
          {agent ? (
            <>
              <AgentAvatar agent={agent} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-xs font-semibold uppercase tracking-wide text-[#F1F5F9]">
                  {agent.name}
                </div>
                <div className={`text-[11px] ${ROLE_META[agent.role].colorClass}`}>
                  {ROLE_META[agent.role].label}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span className="flex h-8 w-8 items-center justify-center border border-dashed border-[#334155] bg-[#111620]">
                <Plus className="h-3.5 w-3.5" />
              </span>
              <span>เลือกตัวละคร</span>
            </div>
          )}
        </button>

        {agent && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onPlaceOnMap(agent.id)}
              title={`วาง ${agent.name} ลงบนแผนที่`}
              aria-label={`วาง ${agent.name} ลงบนแผนที่`}
              className={`flex h-7 w-7 items-center justify-center border transition-colors ${
                isPlacingThis
                  ? 'border-[#FF4655] bg-[#FF4655] text-white'
                  : 'border-[#263145] bg-[#111620] text-[#94A3B8] hover:border-[#475569] hover:text-[#F1F5F9]'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onPick(null)}
              title="ล้างช่อง"
              aria-label={`นำ ${agent.name} ออก`}
              className="flex h-7 w-7 items-center justify-center border border-[#263145] bg-[#111620] text-[#64748B] transition-colors hover:border-[#FF4655]/50 hover:text-[#FF4655]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-13 z-50 w-[330px] border border-[#2E3B52] bg-[#111620] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#263145] px-3 py-2">
            <span className="font-display text-xs font-semibold text-[#94A3B8]">
              {teamType === 'our' ? 'ทีมเรา' : 'ทีมศัตรู'} · ช่องที่ {slotIndex + 1}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
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

            <div className="flex items-center gap-1">
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

          <div className="scrollbar-thin max-h-[290px] overflow-y-auto p-2.5">
            {filteredAgents.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#64748B]">ไม่พบ Agent ที่ตรงกับการค้นหา</p>
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
                          ? `${a.name} · แนะนำสำหรับแผนที่นี้ (Meta Pick)`
                          : a.name
                      }
                      onClick={() => {
                        onPick(a.id);
                        setOpen(false);
                        setSearch('');
                      }}
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
      )}
    </div>
  );
}

export function TeamSidebar({
  agents,
  activeMap,
  activePlay,
  side,
  ourTeam,
  enemyTeam,
  pendingAgentPlace,
  onPickOur,
  onPickEnemy,
  onApplyOurComp,
  onResetTeams,
  onRequestPlaceAgent,
}: TeamSidebarProps) {
  const enemySide: Side = side === 'attack' ? 'defense' : 'attack';
  const analysis = useMemo(
    () => analyzeComposition(ourTeam, enemyTeam, agents),
    [ourTeam, enemyTeam, agents]
  );

  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);
  const metaAgentIds = useMemo(() => getMetaAgentSetForMap(activeMap.id), [activeMap.id]);
  const mapComps = useMemo(
    () => getCompsForMapAndPlay(activeMap.id, side, activePlay),
    [activeMap.id, side, activePlay]
  );
  const [compPickerOpen, setCompPickerOpen] = useState(false);

  const totalCompOptions = mapComps.length + UNIVERSAL_STYLE_COMPS.length;

  useEffect(() => {
    setCompPickerOpen(false);
  }, [activeMap.id, side]);

  const ourCount = ourTeam.filter(Boolean).length;
  const enemyCount = enemyTeam.filter(Boolean).length;

  return (
    <aside className="scrollbar-thin flex min-h-0 flex-col gap-5 overflow-y-auto border-r border-[#263145] bg-[#111620] p-4">
      {/* Our Team */}
      <section className="space-y-2.5">
        <header className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
              ทีมเรา
            </h2>
            <p className="text-[11px] text-[#94A3B8]">
              {side === 'attack' ? 'ฝั่งบุก · Attack' : 'ฝั่งรับ · Defense'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompPickerOpen((prev) => !prev)}
              aria-expanded={compPickerOpen}
              className={`flex items-center gap-1 border px-2 py-1 text-[10px] font-semibold transition-colors whitespace-nowrap ${
                compPickerOpen
                  ? 'border-[#FBBF24] bg-[#FBBF24]/15 text-[#FDE68A]'
                  : 'border-[#263145] bg-[#171E2B] text-[#CBD5E1] hover:border-[#FBBF24] hover:text-[#FDE68A]'
              }`}
            >
              <Wand2 className="h-3 w-3" />
              <span>เลือกคอมพ์ ({totalCompOptions})</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${compPickerOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <span
              className={`font-mono-tabular text-xs font-semibold ${
                side === 'attack' ? 'text-[#FF4655]' : 'text-[#22D3EE]'
              }`}
            >
              {ourCount}/5
            </span>
          </div>
        </header>

        {/* Expandable Multi-Comp Preset Selector */}
        {compPickerOpen && (
          <div className="scrollbar-thin max-h-80 space-y-3 overflow-y-auto border border-[#FBBF24]/40 bg-[#0B0E14] p-2.5">
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
                        setCompPickerOpen(false);
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
                        setCompPickerOpen(false);
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

        <div className="space-y-1.5">
          {ourTeam.map((_, i) => (
            <TeamSlotRow
              key={`our-${i}`}
              slotIndex={i}
              team={ourTeam}
              teamType="our"
              sideTone={side}
              agents={agents}
              metaAgentIds={metaAgentIds}
              isPlacingThis={
                pendingAgentPlace?.team === 'our' && pendingAgentPlace.agentId === ourTeam[i]
              }
              onPick={(id) => onPickOur(i, id)}
              onPlaceOnMap={(id) => onRequestPlaceAgent(id, 'our')}
            />
          ))}
        </div>
      </section>

      {/* Dynamic Team Comp Analysis (Auto-computed from selected 5 agents) */}
      <section
        aria-label="วิเคราะห์คอมพ์ทีมเรา"
        className="space-y-2.5 border-t border-[#263145] pt-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
            วิเคราะห์คอมพ์ทีมเรา
          </h3>
          <span className="font-mono-tabular text-[10px] text-[#94A3B8]">
            {analysis.pickedCount}/5 ตัว
          </span>
        </div>

        {/* Role Counter Strip */}
        <div className="grid grid-cols-4 gap-1.5">
          {ROLES_ORDER.map((r) => {
            const Icon = ROLE_ICON[r];
            const count = analysis.roleCounts[r];
            return (
              <div
                key={r}
                className="flex flex-col items-center border border-[#263145] bg-[#171E2B] py-1.5"
              >
                <Icon className={`h-3.5 w-3.5 ${ROLE_META[r].colorClass}`} />
                <span className="mt-1 font-mono-tabular text-xs font-semibold text-[#F1F5F9]">
                  {count}
                </span>
                <span className="text-[10px] text-[#94A3B8]">{ROLE_META[r].label.slice(0, 4)}</span>
              </div>
            );
          })}
        </div>

        {/* 1. Team Playstyle */}
        <div className="border border-[#263145] bg-[#171E2B] p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            1. สไตล์การเล่นของทีม
          </div>
          <div className="mt-1 text-xs font-bold text-[#F1F5F9]">{analysis.playStyle}</div>
        </div>

        {analysis.pickedCount > 0 && (
          <>
            {/* 2. Highlights & Attack/Defense Guide */}
            <div className="space-y-1.5 border border-[#263145] bg-[#171E2B]/85 p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#34D399]">
                <Sparkles className="h-3 w-3" />
                <span>2. จุดเด่นและสิ่งที่ทีมทำได้</span>
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-[#CBD5E1]">
                <li className="border-l-2 border-[#FF4655] pl-2">{analysis.attackTip}</li>
                <li className="border-l-2 border-[#22D3EE] pl-2">{analysis.defenseTip}</li>
              </ul>
            </div>

            {/* 3. Recommended 2-Agent Skill Combo */}
            {analysis.recommendedCombo && (
              <div className="space-y-2 border border-[#263145] bg-[#171E2B]/85 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                  <Zap className="h-3 w-3" />
                  <span>3. คอมโบสกิลแนะนำ</span>
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

            {/* 4. Orange Weakness Warnings */}
            {analysis.warnings.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#FB923C]">
                  4. คำเตือนจุดอ่อน (Warning)
                </div>
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
      </section>

      {/* Enemy Team */}
      <section className="space-y-2.5 border-t border-[#263145] pt-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
              ทีมศัตรู
            </h2>
            <p className="text-[11px] text-[#94A3B8]">
              {enemySide === 'attack' ? 'ฝั่งบุก · Attack' : 'ฝั่งรับ · Defense'}
            </p>
          </div>
          <span
            className={`font-mono-tabular text-xs font-semibold ${
              enemySide === 'attack' ? 'text-[#FF4655]' : 'text-[#22D3EE]'
            }`}
          >
            {enemyCount}/5
          </span>
        </header>

        <div className="space-y-1.5">
          {enemyTeam.map((_, i) => (
            <TeamSlotRow
              key={`enemy-${i}`}
              slotIndex={i}
              team={enemyTeam}
              teamType="enemy"
              sideTone={enemySide}
              agents={agents}
              metaAgentIds={metaAgentIds}
              isPlacingThis={
                pendingAgentPlace?.team === 'enemy' && pendingAgentPlace.agentId === enemyTeam[i]
              }
              onPick={(id) => onPickEnemy(i, id)}
              onPlaceOnMap={(id) => onRequestPlaceAgent(id, 'enemy')}
            />
          ))}
        </div>

        {analysis.enemyCounters.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-wider text-[#FB7185]">
              <Crosshair className="h-3 w-3" />
              จุดต้องระวังจากฝั่งศัตรู
            </h4>
            {analysis.enemyCounters.map((c) => (
              <div
                key={c}
                className="border border-[#FB7185]/25 bg-[#FB7185]/8 px-2.5 py-2 text-[11px] leading-relaxed text-[#FECDD3]"
              >
                {c}
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={onResetTeams}
        className="mt-auto flex items-center justify-center gap-2 border border-[#263145] bg-[#171E2B] py-2 text-xs font-medium text-[#94A3B8] transition-colors hover:border-[#FF4655] hover:text-[#FF4655]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        ล้างตัวละครทั้งหมด
      </button>
    </aside>
  );
}
