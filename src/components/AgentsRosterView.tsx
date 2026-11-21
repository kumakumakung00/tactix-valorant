import { useMemo, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { ROLES_ORDER, ROLE_META } from '../data/valorantFallback';
import { Agent, AgentRole } from '../types/tactix';
import { AgentAvatar } from './AgentAvatar';

interface AgentsRosterViewProps {
  agents: Agent[];
  ourTeam: (string | null)[];
  enemyTeam: (string | null)[];
  onAddToOurTeam: (agentId: string) => void;
  onAddToEnemyTeam: (agentId: string) => void;
}

const SLOT_KEY_LABEL: Record<string, string> = {
  Grenade: 'C',
  Ability1: 'Q',
  Ability2: 'E',
  Ultimate: 'X',
  Passive: 'Passive',
};

export function AgentsRosterView({
  agents,
  ourTeam,
  enemyTeam,
  onAddToOurTeam,
  onAddToEnemyTeam,
}: AgentsRosterViewProps) {
  const [roleFilter, setRoleFilter] = useState<AgentRole | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(agents[0]?.id ?? 'jett');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (roleFilter !== 'all' && a.role !== roleFilter) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, roleFilter, search]);

  const selectedAgent = agents.find((a) => a.id === selectedId) ?? filtered[0] ?? agents[0];
  const inOur = selectedAgent ? ourTeam.includes(selectedAgent.id) : false;
  const inEnemy = selectedAgent ? enemyTeam.includes(selectedAgent.id) : false;

  return (
    <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col overflow-hidden lg:flex-row">
      {/* Agents Grid */}
      <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-wider text-[#F1F5F9]">
              ทำเนียบ Agent ทั้งหมด ({agents.length})
            </h1>
            <p className="text-xs text-[#94A3B8]">
              ดูสกิลและบทบาทของแต่ละตัวละคร พร้อมเพิ่มเข้าสู่กระดานจัดทีม 5v5 ได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#64748B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา Agent..."
                className="w-48 border border-[#263145] bg-[#111620] py-1.5 pl-8 pr-2.5 text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#FF4655] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 border border-[#263145] bg-[#111620] p-0.5">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  roleFilter === 'all' ? 'bg-[#FF4655] text-white' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
              {ROLES_ORDER.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    roleFilter === r ? 'bg-[#263145] text-white' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((a) => {
            const active = selectedAgent?.id === a.id;
            const meta = ROLE_META[a.role];
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                className={`flex items-center gap-3 border p-2.5 text-left transition-colors ${
                  active
                    ? 'border-[#FF4655] bg-[#FF4655]/15'
                    : 'border-[#263145] bg-[#111620] hover:border-[#475569] hover:bg-[#171E2B]'
                }`}
              >
                <AgentAvatar agent={a} size="md" />
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-bold uppercase text-[#F1F5F9]">
                    {a.name}
                  </div>
                  <div className={`text-[11px] ${meta.colorClass}`}>{meta.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Agent Detail Panel */}
      {selectedAgent && (
        <aside className="scrollbar-thin w-full shrink-0 overflow-y-auto border-t border-[#263145] bg-[#111620] p-5 lg:w-[420px] lg:border-l lg:border-t-0">
          {selectedAgent.portrait && (
            <div className="bg-tactical-grid relative mb-4 flex h-44 items-center justify-center overflow-hidden border border-[#263145] bg-[#0B0E14]">
              <img
                src={selectedAgent.portrait}
                alt={selectedAgent.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain object-top"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#111620] to-transparent"
              />
            </div>
          )}

          <div className="flex items-start gap-4 border-b border-[#263145] pb-4">
            <AgentAvatar agent={selectedAgent} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F1F5F9]">
                {selectedAgent.name}
              </h2>
              <p className={`text-xs font-medium ${ROLE_META[selectedAgent.role].colorClass}`}>
                {ROLE_META[selectedAgent.role].label} · {ROLE_META[selectedAgent.role].th}
              </p>
              {selectedAgent.description && (
                <p className="mt-2 text-xs leading-relaxed text-[#CBD5E1]">
                  {selectedAgent.description}
                </p>
              )}
              {selectedAgent.roleDescription && (
                <p className="mt-2 border-t border-[#263145] pt-2 text-[11px] leading-relaxed text-[#94A3B8]">
                  {selectedAgent.roleDescription}
                </p>
              )}
            </div>
          </div>

          {/* Quick Add to Teams */}
          <div className="grid grid-cols-2 gap-2 border-b border-[#263145] py-4">
            <button
              type="button"
              disabled={inOur}
              onClick={() => onAddToOurTeam(selectedAgent.id)}
              className={`flex items-center justify-center gap-1.5 border py-2 text-xs font-semibold transition-colors ${
                inOur
                  ? 'border-[#34D399]/40 bg-[#34D399]/10 text-[#34D399]'
                  : 'border-[#263145] bg-[#171E2B] text-[#F1F5F9] hover:border-[#22D3EE] hover:text-[#22D3EE]'
              }`}
            >
              {inOur ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {inOur ? 'อยู่ในทีมเราแล้ว' : 'เพิ่มเข้าทีมเรา'}
            </button>
            <button
              type="button"
              disabled={inEnemy}
              onClick={() => onAddToEnemyTeam(selectedAgent.id)}
              className={`flex items-center justify-center gap-1.5 border py-2 text-xs font-semibold transition-colors ${
                inEnemy
                  ? 'border-[#FF4655]/40 bg-[#FF4655]/10 text-[#FF4655]'
                  : 'border-[#263145] bg-[#171E2B] text-[#F1F5F9] hover:border-[#FF4655] hover:text-[#FF4655]'
              }`}
            >
              {inEnemy ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {inEnemy ? 'อยู่ในทีมศัตรูแล้ว' : 'เพิ่มเข้าทีมศัตรู'}
            </button>
          </div>

          {/* Abilities */}
          <div className="pt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                สกิลประจำตัว ({selectedAgent.abilities.length})
              </h3>
              <span className="text-[10px] text-[#64748B]">ข้อมูลภาษาไทย · Riot Games</span>
            </div>
            <div className="space-y-2.5">
              {selectedAgent.abilities.map((ab) => (
                <div
                  key={ab.slot + ab.name}
                  className="border border-[#263145] bg-[#171E2B] p-3"
                >
                  <div className="flex items-center gap-2.5">
                    {ab.icon ? (
                      <img
                        src={ab.icon}
                        alt={ab.name}
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 shrink-0 bg-[#0B0E14] p-1 object-contain"
                      />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#0B0E14] font-mono-tabular text-xs font-bold text-[#94A3B8]">
                        {SLOT_KEY_LABEL[ab.slot] ?? '?'}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-semibold text-[#F1F5F9]">
                          {ab.name}
                        </span>
                        <span className="font-mono-tabular text-[11px] font-semibold text-[#94A3B8]">
                          {SLOT_KEY_LABEL[ab.slot] ?? ab.slot}
                        </span>
                      </div>
                    </div>
                  </div>
                  {ab.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-[#CBD5E1]">
                      {ab.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-[#64748B]">
                      กำลังใช้ข้อมูลสำรอง — เชื่อมต่ออินเทอร์เน็ตเพื่อโหลดคำอธิบายสกิลภาษาไทยจาก Riot
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
