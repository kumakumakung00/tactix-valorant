import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgentsRosterView } from './components/AgentsRosterView';
import { ExportModal } from './components/ExportModal';
import { Header } from './components/Header';
import { LiveMatchState, LiveMatchView } from './components/LiveMatchView';
import { MyProgressView } from './components/MyProgressView';
import { ProTrainingView } from './components/ProTrainingView';
import { StrategyPanel } from './components/StrategyPanel';
import { TacticalBoard } from './components/TacticalBoard';
import { TeamSidebar } from './components/TeamSidebar';
import {
  FALLBACK_AGENTS,
  FALLBACK_MAPS,
  PRESET_SEEDS,
  buildPlayFromPreset,
} from './data/valorantFallback';
import { getCompsForMapAndPlay } from './data/mapComps';
import { fetchValorantAssets } from './services/valorantApi';
import {
  Agent,
  AppView,
  BoardElements,
  Side,
  StrategyPlay,
  TactixPersistedState,
  ValorantMap,
} from './types/tactix';

const STORAGE_KEY = 'tactix:v3';
const LIVE_MATCH_STORAGE_KEY = 'tactix:livematch:v1';

const EMPTY_TEAM = (): (string | null)[] => [null, null, null, null, null];

const INITIAL_LIVE_MATCH = (): LiveMatchState => ({
  mapId: 'ascent',
  side: 'attack',
  economy: 'pistol',
  ourTeam: EMPTY_TEAM(),
  enemyTeam: EMPTY_TEAM(),
  problemId: null,
});

const INITIAL_PERSISTED: TactixPersistedState = {
  mapId: 'ascent',
  side: 'attack',
  ourTeam: ['jett', 'sova', 'omen', 'killjoy', 'kayo'],
  enemyTeam: EMPTY_TEAM(),
  customPlays: [],
  activePlayIdByKey: {},
  presetOverrides: {},
  showCallouts: true,
};

function updateTeamSlot(
  team: (string | null)[],
  slotIndex: number,
  agentId: string | null
): (string | null)[] {
  if (slotIndex < 0 || slotIndex >= 5) return team;
  const next = team.map((id) => (agentId !== null && id === agentId ? null : id));
  next[slotIndex] = agentId;
  return next;
}

function addAgentToFirstFreeSlot(team: (string | null)[], agentId: string): (string | null)[] {
  if (team.includes(agentId)) return team;
  const freeIdx = team.findIndex((id) => id === null);
  const targetIdx = freeIdx !== -1 ? freeIdx : 4;
  return updateTeamSlot(team, targetIdx, agentId);
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(FALLBACK_AGENTS);
  const [maps, setMaps] = useState<ValorantMap[]>(FALLBACK_MAPS);
  const [isLiveApi, setIsLiveApi] = useState<boolean | null>(null);

  const [state, setState] = useState<TactixPersistedState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('tactix:v2');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TactixPersistedState>;
        const isMigrated = !localStorage.getItem(STORAGE_KEY);
        return {
          ...INITIAL_PERSISTED,
          ...parsed,
          showCallouts: isMigrated ? true : parsed.showCallouts ?? true,
          ourTeam:
            Array.isArray(parsed.ourTeam) && parsed.ourTeam.length === 5
              ? parsed.ourTeam
              : INITIAL_PERSISTED.ourTeam,
          enemyTeam:
            Array.isArray(parsed.enemyTeam) && parsed.enemyTeam.length === 5
              ? parsed.enemyTeam
              : INITIAL_PERSISTED.enemyTeam,
          customPlays: Array.isArray(parsed.customPlays) ? parsed.customPlays : [],
          activePlayIdByKey: parsed.activePlayIdByKey ?? {},
          presetOverrides: parsed.presetOverrides ?? {},
        };
      }
    } catch {
      // Ignore invalid stored data
    }
    return INITIAL_PERSISTED;
  });

  const [liveMatchState, setLiveMatchState] = useState<LiveMatchState>(() => {
    try {
      const raw = localStorage.getItem(LIVE_MATCH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LiveMatchState>;
        return {
          ...INITIAL_LIVE_MATCH(),
          ...parsed,
          ourTeam:
            Array.isArray(parsed.ourTeam) && parsed.ourTeam.length === 5
              ? parsed.ourTeam
              : EMPTY_TEAM(),
          enemyTeam:
            Array.isArray(parsed.enemyTeam) && parsed.enemyTeam.length === 5
              ? parsed.enemyTeam
              : EMPTY_TEAM(),
        };
      }
    } catch {
      // Ignore invalid stored live match state
    }
    return INITIAL_LIVE_MATCH();
  });

  useEffect(() => {
    try {
      localStorage.setItem(LIVE_MATCH_STORAGE_KEY, JSON.stringify(liveMatchState));
    } catch {
      // Ignore storage quota errors
    }
  }, [liveMatchState]);

  const [activeView, setActiveView] = useState<AppView>('board');
  const [mobilePanel, setMobilePanel] = useState<'team' | 'board' | 'notes'>('board');
  const [exportOpen, setExportOpen] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isBoardFullscreen, setIsBoardFullscreen] = useState(false);
  const [pendingAgentPlace, setPendingAgentPlace] = useState<{
    agentId: string;
    team: 'our' | 'enemy';
  } | null>(null);

  // Undo / Redo stacks for canvas drawing elements
  const [historyPast, setHistoryPast] = useState<BoardElements[]>([]);
  const [historyFuture, setHistoryFuture] = useState<BoardElements[]>([]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleAppFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      setIsBoardFullscreen(false);
      return;
    }

    let enteredNative = false;
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        enteredNative = true;
      } catch {
        enteredNative = false;
      }
    }

    if (!enteredNative) {
      setIsBoardFullscreen((prev) => !prev);
      if (activeView !== 'board') {
        setActiveView('board');
      }
    }
  }, [activeView]);

  const handleToggleBoardFullscreen = useCallback(() => {
    setIsBoardFullscreen((prev) => {
      const next = !prev;
      if (next && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!next && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    fetchValorantAssets().then((payload) => {
      if (!active) return;
      setAgents(payload.agents);
      setMaps(payload.maps);
      setIsLiveApi(payload.live);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const activeMap = useMemo(
    () => maps.find((m) => m.id === state.mapId) ?? maps[0],
    [maps, state.mapId]
  );

  const key = `${activeMap.id}:${state.side}`;

  const playsForCurrentContext = useMemo<StrategyPlay[]>(() => {
    const presets = PRESET_SEEDS.filter(
      (s) => s.mapId === activeMap.id && s.side === state.side
    ).map((seed) => {
      const override = state.presetOverrides[seed.id];
      return override ?? buildPlayFromPreset(seed, activeMap);
    });

    const customs = state.customPlays.filter(
      (p) => p.mapId === activeMap.id && p.side === state.side
    );

    const combined = [...presets, ...customs];
    if (combined.length > 0) return combined;

    // Fallback default blank play if this map+side has no preset yet
    const fallbackId = `default-${activeMap.id}-${state.side}`;
    if (state.presetOverrides[fallbackId]) {
      return [state.presetOverrides[fallbackId]];
    }
    return [
      {
        id: fallbackId,
        mapId: activeMap.id,
        side: state.side,
        name: 'แผนหลัก (Default)',
        roundType: 'full',
        isPreset: true,
        elements: { strokes: [], markers: [] },
        steps: [],
        assignments: {},
        notes: '',
        updatedAt: 0,
      },
    ];
  }, [activeMap, state.side, state.customPlays, state.presetOverrides]);

  const activePlay = useMemo(() => {
    const chosenId = state.activePlayIdByKey[key];
    return playsForCurrentContext.find((p) => p.id === chosenId) ?? playsForCurrentContext[0];
  }, [playsForCurrentContext, state.activePlayIdByKey, key]);

  const topRecommendedComp = useMemo(
    () => getCompsForMapAndPlay(activeMap.id, state.side, activePlay)[0],
    [activeMap.id, state.side, activePlay]
  );

  // Clear undo/redo when switching active play
  useEffect(() => {
    setHistoryPast([]);
    setHistoryFuture([]);
  }, [activePlay.id]);

  const savePlayUpdate = useCallback((updated: StrategyPlay) => {
    setState((prev) => {
      if (updated.isPreset) {
        return {
          ...prev,
          presetOverrides: {
            ...prev.presetOverrides,
            [updated.id]: updated,
          },
        };
      }
      return {
        ...prev,
        customPlays: prev.customPlays.map((p) => (p.id === updated.id ? updated : p)),
      };
    });
  }, []);

  const handleUpdateElements = useCallback(
    (nextElements: BoardElements, recordHistory = true) => {
      if (recordHistory) {
        setHistoryPast((past) => [...past.slice(-24), activePlay.elements]);
        setHistoryFuture([]);
      }
      savePlayUpdate({
        ...activePlay,
        elements: nextElements,
        updatedAt: Date.now(),
      });
    },
    [activePlay, savePlayUpdate]
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((past) => past.slice(0, -1));
    setHistoryFuture((future) => [activePlay.elements, ...future]);
    savePlayUpdate({
      ...activePlay,
      elements: previous,
      updatedAt: Date.now(),
    });
  }, [activePlay, historyPast, savePlayUpdate]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [...past, activePlay.elements]);
    savePlayUpdate({
      ...activePlay,
      elements: next,
      updatedAt: Date.now(),
    });
  }, [activePlay, historyFuture, savePlayUpdate]);

  const handleCreatePlay = () => {
    const newId = `custom-${Date.now().toString(36)}`;
    const newPlay: StrategyPlay = {
      id: newId,
      mapId: activeMap.id,
      side: state.side,
      name: `แผนใหม่ ${playsForCurrentContext.length + 1}`,
      roundType: 'full',
      isPreset: false,
      elements: { strokes: [], markers: [] },
      steps: [],
      assignments: {},
      notes: '',
      updatedAt: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      customPlays: [...prev.customPlays, newPlay],
      activePlayIdByKey: {
        ...prev.activePlayIdByKey,
        [key]: newId,
      },
    }));
  };

  const handleDeletePlay = (playId: string) => {
    setState((prev) => {
      const nextCustom = prev.customPlays.filter((p) => p.id !== playId);
      const nextActive = { ...prev.activePlayIdByKey };
      if (nextActive[key] === playId) {
        delete nextActive[key];
      }
      return {
        ...prev,
        customPlays: nextCustom,
        activePlayIdByKey: nextActive,
      };
    });
  };

  const handleResetPreset = (playId: string) => {
    setState((prev) => {
      const nextOverrides = { ...prev.presetOverrides };
      delete nextOverrides[playId];
      return {
        ...prev,
        presetOverrides: nextOverrides,
      };
    });
  };

  const handleExportJson = () => JSON.stringify(state, null, 2);

  const handleImportJson = (raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as Partial<TactixPersistedState>;
      if (!parsed || typeof parsed !== 'object' || !parsed.mapId) return false;
      setState((prev) => ({
        ...prev,
        ...parsed,
        ourTeam:
          Array.isArray(parsed.ourTeam) && parsed.ourTeam.length === 5
            ? parsed.ourTeam
            : prev.ourTeam,
        enemyTeam:
          Array.isArray(parsed.enemyTeam) && parsed.enemyTeam.length === 5
            ? parsed.enemyTeam
            : prev.enemyTeam,
        customPlays: Array.isArray(parsed.customPlays) ? parsed.customPlays : prev.customPlays,
        presetOverrides: parsed.presetOverrides ?? prev.presetOverrides,
        activePlayIdByKey: parsed.activePlayIdByKey ?? prev.activePlayIdByKey,
      }));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0B0E14] text-[#F1F5F9]">
      <Header
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          if (view !== 'board') setIsBoardFullscreen(false);
        }}
        onOpenExport={() => setExportOpen(true)}
        isFullscreen={isNativeFullscreen || isBoardFullscreen}
        onToggleFullscreen={handleToggleAppFullscreen}
      />

      {activeView === 'board' && (
        <>
          {/* Mobile / Tablet Panel Switcher */}
          <div className="grid grid-cols-3 border-b border-[#263145] bg-[#111620] lg:hidden">
            {[
              { id: 'team', label: 'ทีม 5v5' },
              { id: 'board', label: 'กระดานแผนที่' },
              { id: 'notes', label: 'กลยุทธ์และโน้ต' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobilePanel(tab.id as 'team' | 'board' | 'notes')}
                className={`py-2.5 text-xs font-semibold transition-colors ${
                  mobilePanel === tab.id
                    ? 'border-b-2 border-[#FF4655] bg-[#171E2B] text-[#F1F5F9]'
                    : 'text-[#94A3B8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 3-Column Tactical Command Workspace */}
          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)_310px] xl:grid-cols-[264px_minmax(0,1fr)_328px]">
            <div className={`${mobilePanel === 'team' ? 'flex' : 'hidden'} min-h-0 flex-col lg:flex`}>
              <TeamSidebar
                agents={agents}
                activeMap={activeMap}
                activePlay={activePlay}
                side={state.side}
                ourTeam={state.ourTeam}
                enemyTeam={state.enemyTeam}
                pendingAgentPlace={pendingAgentPlace}
                onPickOur={(slot, id) =>
                  setState((prev) => ({
                    ...prev,
                    ourTeam: updateTeamSlot(prev.ourTeam, slot, id),
                  }))
                }
                onPickEnemy={(slot, id) =>
                  setState((prev) => ({
                    ...prev,
                    enemyTeam: updateTeamSlot(prev.enemyTeam, slot, id),
                  }))
                }
                onApplyOurComp={(agentIds, agentDuties) => {
                  const nextTeam = [0, 1, 2, 3, 4].map((idx) => agentIds[idx] ?? null);
                  setState((prev) => ({
                    ...prev,
                    ourTeam: nextTeam,
                  }));
                  if (agentDuties) {
                    const nextAssignments: Record<string, string> = {};
                    nextTeam.forEach((agId, idx) => {
                      if (agId && agentDuties[agId]) {
                        nextAssignments[String(idx)] = agentDuties[agId];
                      }
                    });
                    savePlayUpdate({
                      ...activePlay,
                      assignments: nextAssignments,
                      updatedAt: Date.now(),
                    });
                  }
                }}
                onResetTeams={() =>
                  setState((prev) => ({
                    ...prev,
                    ourTeam: EMPTY_TEAM(),
                    enemyTeam: EMPTY_TEAM(),
                  }))
                }
                onRequestPlaceAgent={(agentId, team) => {
                  setPendingAgentPlace({ agentId, team });
                  setMobilePanel('board');
                }}
              />
            </div>

            <div
              className={
                isBoardFullscreen
                  ? 'fixed inset-0 z-40 flex flex-col bg-[#0B0E14]'
                  : `${mobilePanel === 'board' ? 'flex' : 'hidden'} min-h-0 flex-col lg:flex`
              }
            >
              <TacticalBoard
                maps={maps}
                activeMap={activeMap}
                side={state.side}
                agents={agents}
                plays={playsForCurrentContext}
                activePlay={activePlay}
                showCallouts={state.showCallouts}
                pendingAgentPlace={pendingAgentPlace}
                canUndo={historyPast.length > 0}
                canRedo={historyFuture.length > 0}
                isBoardFullscreen={isBoardFullscreen}
                onToggleBoardFullscreen={handleToggleBoardFullscreen}
                onMapChange={(mapId) => {
                  setPendingAgentPlace(null);
                  setState((prev) => ({ ...prev, mapId }));
                }}
                onSideChange={(side: Side) => {
                  setPendingAgentPlace(null);
                  setState((prev) => ({ ...prev, side }));
                }}
                onSelectPlay={(playId) =>
                  setState((prev) => ({
                    ...prev,
                    activePlayIdByKey: { ...prev.activePlayIdByKey, [key]: playId },
                  }))
                }
                onCreatePlay={handleCreatePlay}
                onDeletePlay={handleDeletePlay}
                onResetPreset={handleResetPreset}
                onUpdateElements={handleUpdateElements}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onToggleCallouts={() =>
                  setState((prev) => ({ ...prev, showCallouts: !prev.showCallouts }))
                }
                onCancelPendingAgent={() => setPendingAgentPlace(null)}
              />
            </div>

            <div className={`${mobilePanel === 'notes' ? 'flex' : 'hidden'} min-h-0 flex-col lg:flex`}>
              <StrategyPanel
                activeMap={activeMap}
                side={state.side}
                agents={agents}
                ourTeam={state.ourTeam}
                activePlay={activePlay}
                recommendedDuties={topRecommendedComp?.agentDuties}
                onUpdatePlay={savePlayUpdate}
              />
            </div>
          </div>
        </>
      )}

      {activeView === 'livematch' && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <LiveMatchView
            maps={maps}
            agents={agents}
            matchState={liveMatchState}
            boardOurTeam={state.ourTeam}
            onChangeMatchState={(updater) => setLiveMatchState((prev) => updater(prev))}
            onResetMatch={() => setLiveMatchState(INITIAL_LIVE_MATCH())}
          />
        </div>
      )}

      {activeView === 'agents' && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <AgentsRosterView
            agents={agents}
            ourTeam={state.ourTeam}
            enemyTeam={state.enemyTeam}
            onAddToOurTeam={(agentId) =>
              setState((prev) => ({
                ...prev,
                ourTeam: addAgentToFirstFreeSlot(prev.ourTeam, agentId),
              }))
            }
            onAddToEnemyTeam={(agentId) =>
              setState((prev) => ({
                ...prev,
                enemyTeam: addAgentToFirstFreeSlot(prev.enemyTeam, agentId),
              }))
            }
          />
        </div>
      )}

      {activeView === 'training' && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <ProTrainingView agents={agents} />
        </div>
      )}

      {activeView === 'progress' && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <MyProgressView />
        </div>
      )}

      {isLiveApi === false && (
        <div className="border-t border-[#FBBF24]/30 bg-[#171E2B] px-4 py-1.5 text-center text-[11px] text-[#FDE68A]">
          เชื่อมต่อ valorant-api.com ไม่สำเร็จ — กำลังใช้งานแผนที่และรายชื่อตัวละครสำรองในเครื่อง
        </div>
      )}

      <footer className="shrink-0 border-t border-[#263145] bg-[#111620] px-4 py-1.5 text-center text-[11px] leading-snug text-[#64748B]">
        TACTIX isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of
        Riot Games or anyone officially involved in producing or managing Riot Games properties.
        Riot Games, and all associated properties are trademarks or registered trademarks of Riot
        Games, Inc.
      </footer>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        map={activeMap}
        side={state.side}
        play={activePlay}
        ourTeam={state.ourTeam}
        enemyTeam={state.enemyTeam}
        agents={agents}
        showCallouts={state.showCallouts}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />
    </div>
  );
}
