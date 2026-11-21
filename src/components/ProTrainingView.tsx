import { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  Clock,
  Crosshair,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  Target,
  UserCheck,
} from 'lucide-react';
import { PRO_TRAINING_PROFILES } from '../data/proTrainingData';
import { ROLE_META } from '../data/valorantFallback';
import { Agent, AgentRole } from '../types/tactix';
import { AgentAvatar } from './AgentAvatar';

interface ProTrainingViewProps {
  agents: Agent[];
}

const DRILLS_STORAGE_KEY = 'tactix:pro-drills:v1';

const ROLE_FILTERS: { id: 'all' | AgentRole; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'duelist', label: 'Duelist' },
  { id: 'initiator', label: 'Initiator' },
  { id: 'controller', label: 'Controller' },
  { id: 'sentinel', label: 'Sentinel' },
];

export function ProTrainingView({ agents }: ProTrainingViewProps) {
  const [selectedProId, setSelectedProId] = useState<string>(PRO_TRAINING_PROFILES[0].id);
  const [roleFilter, setRoleFilter] = useState<'all' | AgentRole>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedDrills, setCompletedDrills] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(DRILLS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed as Record<string, boolean>;
      }
    } catch {
      // Ignore invalid storage
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(completedDrills));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedDrills]);

  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PRO_TRAINING_PROFILES.filter((pro) => {
      const inferredRole =
        pro.primaryRole ?? (pro.agentId ? agentById.get(pro.agentId)?.role : undefined);
      if (roleFilter !== 'all' && inferredRole !== roleFilter) return false;
      if (!q) return true;
      return (
        pro.playerName.toLowerCase().includes(q) ||
        pro.teamTag.toLowerCase().includes(q) ||
        pro.roleFocus.toLowerCase().includes(q) ||
        pro.specialty.toLowerCase().includes(q)
      );
    });
  }, [agentById, roleFilter, searchQuery]);

  const activeProfile = useMemo(
    () => PRO_TRAINING_PROFILES.find((p) => p.id === selectedProId) ?? PRO_TRAINING_PROFILES[0],
    [selectedProId]
  );

  const signatureAgent = activeProfile.agentId ? agentById.get(activeProfile.agentId) : undefined;
  const activeCompletedCount = activeProfile.drills.filter((d) => !!completedDrills[d.id]).length;

  const toggleDrill = (drillId: string) => {
    setCompletedDrills((prev) => ({
      ...prev,
      [drillId]: !prev[drillId],
    }));
  };

  const resetActiveProfileDrills = () => {
    setCompletedDrills((prev) => {
      const next = { ...prev };
      for (const d of activeProfile.drills) {
        delete next[d.id];
      }
      return next;
    });
  };

  return (
    <div className="scrollbar-thin flex h-full w-full flex-col overflow-y-auto bg-[#0B0E14] text-[#F1F5F9]">
      {/* Page Header */}
      <div className="border-b border-[#263145] bg-[#111620] px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#FF4655]">
              <Target className="h-3.5 w-3.5" />
              <span>PRO PLAYER TRAINING CURRICULUM</span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-[#F1F5F9]">
              การฝึกเล่นตามแนวทางนักแข่งระดับโลก (แยกเฉพาะบุคคล)
            </h1>
            <p className="mt-1 text-sm text-[#94A3B8]">
              รวบรวมรูทีนการซ้อมและแนวคิดจากที่นักแข่งระดับโปรออกมาสอนจริง โดยแยกตารางฝึกเฉพาะตัวของแต่ละคนไม่ปะปนกัน
            </p>
          </div>
          <div className="border border-[#263145] bg-[#171E2B] px-3.5 py-2 text-xs text-[#CBD5E1]">
            <span className="text-[#94A3B8]">โปรแกรมนักแข่งทั้งหมด: </span>
            <span className="font-mono-tabular font-semibold text-[#F1F5F9]">
              {PRO_TRAINING_PROFILES.length} คน
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Content: Individual Player Roster + Single Selected Pro Curriculum */}
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[310px_minmax(0,1fr)]">
        {/* Left: Individual Pro Player List with Search & Role Filter */}
        <aside aria-label="รายชื่อนักแข่ง" className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-0.5 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            <span>เลือกนักแข่ง ({filteredProfiles.length} / {PRO_TRAINING_PROFILES.length})</span>
            <UserCheck className="h-3.5 w-3.5 text-[#22D3EE]" />
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อนักแข่ง หรือทีม..."
              aria-label="ค้นหานักแข่ง"
              className="w-full border border-[#263145] bg-[#111620] py-1.5 pl-8 pr-3 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
            />
          </div>

          {/* Role filter strip */}
          <div className="flex flex-wrap gap-1">
            {ROLE_FILTERS.map((rf) => {
              const active = roleFilter === rf.id;
              return (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => setRoleFilter(rf.id)}
                  className={`border px-2 py-1 text-[11px] font-medium transition-colors ${
                    active
                      ? 'border-[#FF4655] bg-[#FF4655]/15 text-[#F1F5F9]'
                      : 'border-[#263145] bg-[#111620] text-[#94A3B8] hover:border-[#475569] hover:text-white'
                  }`}
                >
                  {rf.label}
                </button>
              );
            })}
          </div>

          {/* Player Roster Buttons */}
          <div className="scrollbar-thin grid max-h-[540px] grid-cols-1 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2 lg:grid-cols-1">
            {filteredProfiles.length === 0 ? (
              <div className="border border-dashed border-[#263145] bg-[#111620] p-4 text-center text-xs text-[#64748B]">
                ไม่พบนักแข่งที่ตรงกับคำค้นหา
              </div>
            ) : (
              filteredProfiles.map((pro) => {
                const isSelected = pro.id === activeProfile.id;
                const proAgent = pro.agentId ? agentById.get(pro.agentId) : undefined;
                const doneCount = pro.drills.filter((d) => !!completedDrills[d.id]).length;
                const roleMeta = pro.primaryRole ? ROLE_META[pro.primaryRole] : undefined;

                return (
                  <button
                    key={pro.id}
                    type="button"
                    onClick={() => setSelectedProId(pro.id)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-3 border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-[#FF4655] bg-[#171E2B]'
                        : 'border-[#263145] bg-[#111620] hover:border-[#475569] hover:bg-[#171E2B]/70'
                    }`}
                  >
                    {proAgent ? (
                      <AgentAvatar agent={proAgent} size="md" />
                    ) : (
                      <span className="clip-angle-sm flex h-10 w-10 shrink-0 items-center justify-center bg-[#263145] font-display text-sm font-bold text-[#F1F5F9]">
                        {pro.playerName.slice(0, 2).toUpperCase()}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-base font-bold tracking-wide text-[#F1F5F9]">
                          {pro.playerName}
                        </span>
                        <span
                          className={`font-mono-tabular text-[11px] font-semibold ${
                            doneCount === pro.drills.length ? 'text-[#34D399]' : 'text-[#94A3B8]'
                          }`}
                        >
                          {doneCount}/{pro.drills.length}
                        </span>
                      </div>
                      <div className="truncate text-[11px] text-[#94A3B8]">{pro.teamTag}</div>
                      <div className={`mt-0.5 truncate text-[11px] ${roleMeta?.colorClass ?? 'text-[#22D3EE]'}`}>
                        {pro.roleFocus}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Isolated Individual Pro Training Curriculum */}
        <section
          aria-label={`ตารางฝึกของ ${activeProfile.playerName}`}
          className="flex flex-col gap-5"
        >
          {/* Individual Pro Identity & Philosophy Card */}
          <div className="border border-[#263145] bg-[#111620] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#263145] pb-4">
              <div className="flex items-center gap-3.5">
                {signatureAgent && <AgentAvatar agent={signatureAgent} size="lg" />}
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-display text-2xl font-bold tracking-wide text-[#F1F5F9]">
                      {activeProfile.playerName}
                    </h2>
                    <span className="border border-[#FF4655]/40 bg-[#FF4655]/10 px-2 py-0.5 text-[11px] font-medium text-[#FF4655]">
                      {activeProfile.roleFocus}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[#94A3B8]">{activeProfile.teamTag}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#22D3EE]">
                    <Crosshair className="h-3.5 w-3.5 shrink-0" />
                    <span>จุดเด่นเฉพาะตัว: {activeProfile.specialty}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="border border-[#263145] bg-[#0B0E14] px-3 py-1.5 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    ความคืบหน้าของ {activeProfile.playerName}
                  </div>
                  <div className="font-mono-tabular text-sm font-bold text-[#34D399]">
                    {activeCompletedCount} / {activeProfile.drills.length} แบบฝึก
                  </div>
                </div>
                {activeCompletedCount > 0 && (
                  <button
                    type="button"
                    onClick={resetActiveProfileDrills}
                    title="รีเซ็ตเช็กลิสต์ของนักแข่งคนนี้"
                    className="border border-[#263145] bg-[#171E2B] p-2 text-[#94A3B8] transition-colors hover:border-[#FF4655] hover:text-[#FF4655]"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="border border-[#263145] bg-[#171E2B] p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                  แนวคิดการฝึกของ {activeProfile.playerName}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#E2E8F0]">
                  {activeProfile.philosophy}
                </p>
              </div>
              <div className="border border-[#263145] bg-[#171E2B] p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#22D3EE]">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>ข้อสังเกตและเทคนิคเฉพาะตัว</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#E2E8F0]">
                  {activeProfile.settingsNote}
                </p>
              </div>
            </div>
          </div>

          {/* Individual Drills List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold uppercase tracking-wider text-[#F1F5F9]">
                รูทีนการฝึกเฉพาะของ {activeProfile.playerName} ({activeProfile.drills.length} ขั้นตอน)
              </h3>
              <span className="text-xs text-[#94A3B8]">คลิกเพื่อติ๊กเมื่อฝึกเสร็จแต่ละหัวข้อ</span>
            </div>

            {activeProfile.drills.map((drill, idx) => {
              const checked = !!completedDrills[drill.id];
              return (
                <div
                  key={drill.id}
                  className={`border transition-colors ${
                    checked
                      ? 'border-[#34D399]/50 bg-[#111620]'
                      : 'border-[#263145] bg-[#111620]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#263145] bg-[#171E2B]/65 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleDrill(drill.id)}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      {checked ? (
                        <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#34D399]" />
                      ) : (
                        <Square className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B] hover:text-[#F1F5F9]" />
                      )}
                      <div>
                        <div
                          className={`text-sm font-semibold ${
                            checked ? 'text-[#94A3B8] line-through' : 'text-[#F1F5F9]'
                          }`}
                        >
                          {idx + 1}. {drill.title}
                        </div>
                        <div className="mt-1 text-xs text-[#22D3EE]">
                          เป้าหมาย: <span className="text-[#CBD5E1]">{drill.goal}</span>
                        </div>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2 text-[11px]">
                      <span className="border border-[#263145] bg-[#0B0E14] px-2 py-0.5 text-[#CBD5E1]">
                        {drill.mode}
                      </span>
                      <span className="flex items-center gap-1 border border-[#263145] bg-[#0B0E14] px-2 py-0.5 font-mono-tabular text-[#FBBF24]">
                        <Clock className="h-3 w-3" />
                        {drill.duration}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-1.5 px-4 py-3 text-xs leading-relaxed text-[#CBD5E1]">
                    {drill.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-[#FF4655]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Individual Key Takeaways */}
          <div className="border border-[#263145] bg-[#111620] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F1F5F9]">
              <Sparkles className="h-4 w-4 text-[#FF4655]" />
              <span>หัวใจสำคัญที่ {activeProfile.playerName} เน้นย้ำ</span>
            </div>
            <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#CBD5E1]">
              {activeProfile.keyTakeaways.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5 border-l-2 border-[#FF4655] pl-3">
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
