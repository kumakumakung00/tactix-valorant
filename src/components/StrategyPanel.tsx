import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckSquare,
  ClipboardList,
  Coins,
  Lightbulb,
  Plus,
  Square,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { ROUND_TYPES, getTipsForMap } from '../data/valorantFallback';
import { Agent, RoundType, Side, StrategyPlay, ValorantMap } from '../types/tactix';
import { getEconomyIglGuide } from '../utils/liveIgl';
import { AgentAvatar } from './AgentAvatar';

interface StrategyPanelProps {
  activeMap: ValorantMap;
  side: Side;
  agents: Agent[];
  ourTeam: (string | null)[];
  activePlay: StrategyPlay;
  recommendedDuties?: Record<string, string>;
  onUpdatePlay: (updated: StrategyPlay) => void;
}

const ECONOMY_TONE_STYLES: Record<
  'emerald' | 'amber' | 'rose' | 'cyan',
  { box: string; title: string; badge: string }
> = {
  amber: {
    box: 'border-[#FBBF24]/45 bg-[#FBBF24]/10',
    title: 'text-[#FDE68A]',
    badge: 'text-[#FBBF24]',
  },
  cyan: {
    box: 'border-[#22D3EE]/45 bg-[#22D3EE]/10',
    title: 'text-[#A5F3FC]',
    badge: 'text-[#22D3EE]',
  },
  rose: {
    box: 'border-[#FF4655]/45 bg-[#FF4655]/10',
    title: 'text-[#FECDD3]',
    badge: 'text-[#FF4655]',
  },
  emerald: {
    box: 'border-[#34D399]/40 bg-[#34D399]/10',
    title: 'text-[#A7F3D0]',
    badge: 'text-[#34D399]',
  },
};

export function StrategyPanel({
  activeMap,
  side,
  agents,
  ourTeam,
  activePlay,
  recommendedDuties,
  onUpdatePlay,
}: StrategyPanelProps) {
  const [newStepText, setNewStepText] = useState('');

  const tips = getTipsForMap(activeMap.id, side);
  const agentById = new Map(agents.map((a) => [a.id, a]));
  const economyGuide = getEconomyIglGuide(activePlay.roundType, side);
  const economyTone = ECONOMY_TONE_STYLES[economyGuide.accentTone];

  const handleAddStep = () => {
    const text = newStepText.trim();
    if (!text) return;
    onUpdatePlay({
      ...activePlay,
      steps: [
        ...activePlay.steps,
        { id: `step-${Date.now()}`, text, done: false },
      ],
      updatedAt: Date.now(),
    });
    setNewStepText('');
  };

  const handleToggleStep = (stepId: string) => {
    onUpdatePlay({
      ...activePlay,
      steps: activePlay.steps.map((s) =>
        s.id === stepId ? { ...s, done: !s.done } : s
      ),
      updatedAt: Date.now(),
    });
  };

  const handleRemoveStep = (stepId: string) => {
    onUpdatePlay({
      ...activePlay,
      steps: activePlay.steps.filter((s) => s.id !== stepId),
      updatedAt: Date.now(),
    });
  };

  const handleAppendTip = (tip: string) => {
    onUpdatePlay({
      ...activePlay,
      steps: [
        ...activePlay.steps,
        { id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, text: tip, done: false },
      ],
      updatedAt: Date.now(),
    });
  };

  const pickedSlots = ourTeam
    .map((id, idx) => ({ idx, agent: id ? agentById.get(id) : undefined }))
    .filter((entry): entry is { idx: number; agent: Agent } => !!entry.agent);

  return (
    <aside className="scrollbar-thin flex min-h-0 flex-col gap-5 overflow-y-auto border-l border-[#263145] bg-[#111620] p-4">
      {/* Play Header & Round Type */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#FF4655]" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
              รายละเอียดแผนการเล่น
            </h2>
          </div>
          <span className="text-[11px] text-[#94A3B8]">
            {activeMap.name} · {side === 'attack' ? 'บุก' : 'รับ'}
          </span>
        </div>

        <input
          type="text"
          value={activePlay.name}
          onChange={(e) =>
            onUpdatePlay({ ...activePlay, name: e.target.value, updatedAt: Date.now() })
          }
          placeholder="ตั้งชื่อแผนการเล่น..."
          aria-label="ชื่อแผนการเล่น"
          className="w-full border border-[#263145] bg-[#171E2B] px-3 py-2 font-display text-sm font-semibold text-[#F1F5F9] focus:border-[#FF4655] focus:outline-none"
        />

        {/* Round Economy Type Selector */}
        <div className="flex flex-wrap gap-1">
          {ROUND_TYPES.map((rt) => {
            const active = activePlay.roundType === rt.id;
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() =>
                  onUpdatePlay({
                    ...activePlay,
                    roundType: rt.id as RoundType,
                    updatedAt: Date.now(),
                  })
                }
                className={`border px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'border-[#FF4655] bg-[#FF4655]/15 text-[#F1F5F9]'
                    : 'border-[#263145] bg-[#171E2B] text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {rt.label}
              </button>
            );
          })}
        </div>
        {/* Economy Strategy & Warning Connected to Round Type */}
        <div className={`space-y-1.5 border p-2.5 ${economyTone.box}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`flex items-center gap-1.5 text-[11px] font-bold ${economyTone.title}`}>
              <Coins className={`h-3.5 w-3.5 shrink-0 ${economyTone.badge}`} />
              {economyGuide.title}
            </span>
          </div>
          <p className="flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-[#F1F5F9]">
            <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${economyTone.badge}`} />
            <span>{economyGuide.warning}</span>
          </p>
          <p className="text-[11px] leading-relaxed text-[#CBD5E1]">{economyGuide.tactic}</p>
        </div>
      </section>

      {/* Execution Steps Checklist */}
      <section className="space-y-2.5 border-t border-[#263145] pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            ลำดับการเดินแผน
          </h3>
          <span className="font-mono-tabular text-[11px] text-[#64748B]">
            {activePlay.steps.filter((s) => s.done).length}/{activePlay.steps.length}
          </span>
        </div>

        <div className="space-y-1.5">
          {activePlay.steps.length === 0 ? (
            <p className="border border-dashed border-[#263145] bg-[#171E2B]/50 p-3 text-center text-xs text-[#64748B]">
              ยังไม่มีขั้นตอนปฏิบัติ เพิ่มด้านล่างหรือกด + จากคำแนะนำ
            </p>
          ) : (
            activePlay.steps.map((step, i) => (
              <div
                key={step.id}
                className="group flex items-start gap-2 border border-[#263145] bg-[#171E2B] p-2.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => handleToggleStep(step.id)}
                  aria-label={step.done ? 'ยกเลิกเช็ค' : 'ทำเครื่องหมายเสร็จสิ้น'}
                  className="mt-0.5 shrink-0 text-[#94A3B8] hover:text-[#34D399]"
                >
                  {step.done ? (
                    <CheckSquare className="h-4 w-4 text-[#34D399]" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <span className="mt-0.5 font-mono-tabular text-[11px] text-[#64748B]">
                  {i + 1}.
                </span>
                <span
                  className={`flex-1 leading-relaxed ${
                    step.done ? 'line-through text-[#64748B]' : 'text-[#E2E8F0]'
                  }`}
                >
                  {step.text}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveStep(step.id)}
                  aria-label="ลบขั้นตอน"
                  className="shrink-0 text-[#64748B] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#FF4655]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-1.5">
          <input
            type="text"
            value={newStepText}
            onChange={(e) => setNewStepText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddStep();
            }}
            placeholder="เพิ่มขั้นตอน เช่น Smoke Heaven + เข้า A Main..."
            className="min-w-0 flex-1 border border-[#263145] bg-[#0B0E14] px-2.5 py-1.5 text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#FF4655] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddStep}
            aria-label="เพิ่มขั้นตอน"
            className="flex shrink-0 items-center justify-center border border-[#263145] bg-[#171E2B] px-2.5 text-[#CBD5E1] hover:border-[#FF4655] hover:text-[#FF4655]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Per-Agent Assignments */}
      <section className="space-y-2 border-t border-[#263145] pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-[#22D3EE]" />
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              หน้าที่รายบุคคล (ทีมเรา)
            </h3>
          </div>
          {recommendedDuties &&
            pickedSlots.some(
              ({ idx, agent }) =>
                recommendedDuties[agent.id] && !activePlay.assignments[String(idx)]
            ) && (
              <button
                type="button"
                onClick={() => {
                  const nextAssignments = { ...activePlay.assignments };
                  for (const { idx, agent } of pickedSlots) {
                    if (!nextAssignments[String(idx)] && recommendedDuties[agent.id]) {
                      nextAssignments[String(idx)] = recommendedDuties[agent.id];
                    }
                  }
                  onUpdatePlay({
                    ...activePlay,
                    assignments: nextAssignments,
                    updatedAt: Date.now(),
                  });
                }}
                className="text-[11px] font-medium text-[#22D3EE] hover:underline"
              >
                เติมหน้าที่แนะนำ
              </button>
            )}
        </div>

        {pickedSlots.length === 0 ? (
          <p className="text-xs text-[#64748B]">
            เลือกตัวละครในช่อง Team Lineup ด้านบน เพื่อกำหนดหน้าที่ในรอบนี้
          </p>
        ) : (
          <div className="space-y-1.5">
            {pickedSlots.map(({ idx, agent }) => (
              <div
                key={`${idx}-${agent.id}`}
                className="flex items-center gap-2 border border-[#263145] bg-[#171E2B] px-2.5 py-1.5"
              >
                <AgentAvatar agent={agent} size="xs" />
                <span className="w-16 shrink-0 truncate font-display text-xs font-semibold uppercase text-[#E2E8F0]">
                  {agent.name}
                </span>
                <input
                  type="text"
                  value={activePlay.assignments[String(idx)] ?? ''}
                  onChange={(e) =>
                    onUpdatePlay({
                      ...activePlay,
                      assignments: {
                        ...activePlay.assignments,
                        [String(idx)]: e.target.value,
                      },
                      updatedAt: Date.now(),
                    })
                  }
                  placeholder={recommendedDuties?.[agent.id] ?? 'หน้าที่ เช่น Entry / Smoke...'}
                  className="min-w-0 flex-1 bg-transparent text-xs text-[#CBD5E1] placeholder:text-[#64748B] focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Map Tips */}
      <section className="space-y-2 border-t border-[#263145] pt-4">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-[#FBBF24]" />
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            คำแนะนำประจำแผนที่
          </h3>
        </div>
        <ul className="space-y-1.5">
          {tips.map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-2 border border-[#263145] bg-[#171E2B] px-2.5 py-2 text-xs leading-relaxed text-[#CBD5E1]"
            >
              <span className="flex-1">{tip}</span>
              <button
                type="button"
                onClick={() => handleAppendTip(tip)}
                title="เพิ่มลงในลำดับเดินแผน"
                aria-label="เพิ่มคำแนะนำลงในลำดับเดินแผน"
                className="shrink-0 text-[#94A3B8] hover:text-[#FF4655]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Team Notes */}
      <section className="flex min-h-[170px] flex-1 flex-col space-y-2 border-t border-[#263145] pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            โน้ตกลยุทธ์เพิ่มเติม
          </h3>
          <span className="flex items-center gap-1 text-[11px] text-[#34D399]">
            <Check className="h-3 w-3" />
            บันทึกอัตโนมัติ
          </span>
        </div>

        <textarea
          value={activePlay.notes}
          onChange={(e) =>
            onUpdatePlay({ ...activePlay, notes: e.target.value, updatedAt: Date.now() })
          }
          placeholder={`จดบันทึกเพิ่มเติมสำหรับแผน ${activePlay.name} บน ${activeMap.name}...`}
          className="min-h-[120px] flex-1 resize-none border border-[#263145] bg-[#0B0E14] p-2.5 text-xs leading-relaxed text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#FF4655] focus:outline-none"
        />

        <div className="flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="font-mono-tabular">{activePlay.notes.length} ตัวอักษร</span>
          <button
            type="button"
            disabled={!activePlay.notes}
            onClick={() =>
              onUpdatePlay({ ...activePlay, notes: '', updatedAt: Date.now() })
            }
            className="text-[#94A3B8] hover:text-[#FF4655] disabled:opacity-35"
          >
            ล้างโน้ต
          </button>
        </div>
      </section>
    </aside>
  );
}
