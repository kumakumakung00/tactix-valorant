import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bomb,
  ChevronDown,
  Compass,
  Eye,
  Flame,
  Hand,
  MapPin,
  Maximize2,
  Minimize2,
  MousePointer,
  PenTool,
  Plus,
  Radar,
  RotateCcw,
  Route,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Undo2,
  Redo2,
  Wind,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import {
  Agent,
  BoardElements,
  BoardMarker,
  DrawingTool,
  MapCallout,
  RouteStroke,
  Side,
  StrategyPlay,
  ValorantMap,
} from '../types/tactix';

interface TacticalBoardProps {
  maps: ValorantMap[];
  activeMap: ValorantMap;
  side: Side;
  agents: Agent[];
  plays: StrategyPlay[];
  activePlay: StrategyPlay;
  showCallouts: boolean;
  pendingAgentPlace: { agentId: string; team: 'our' | 'enemy' } | null;
  canUndo: boolean;
  canRedo: boolean;
  onMapChange: (mapId: string) => void;
  onSideChange: (side: Side) => void;
  onSelectPlay: (playId: string) => void;
  onCreatePlay: () => void;
  onDeletePlay: (playId: string) => void;
  onResetPreset: (playId: string) => void;
  onUpdateElements: (elements: BoardElements, recordHistory?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleCallouts: () => void;
  onCancelPendingAgent: () => void;
  isBoardFullscreen?: boolean;
  onToggleBoardFullscreen?: () => void;
}

const TOOL_BUTTONS: {
  id: DrawingTool;
  label: string;
  icon: typeof MousePointer;
  accent?: string;
}[] = [
  { id: 'select', label: 'เลือก/ย้าย', icon: MousePointer },
  { id: 'route', label: 'เส้นทาง', icon: Route, accent: 'text-[#34D399]' },
  { id: 'freehand', label: 'วาดอิสระ', icon: PenTool, accent: 'text-[#F1F5F9]' },
  { id: 'smoke', label: 'Smoke', icon: Wind, accent: 'text-[#A855F7]' },
  { id: 'flash', label: 'Flash', icon: Sparkles, accent: 'text-[#FBBF24]' },
  { id: 'recon', label: 'Recon', icon: Radar, accent: 'text-[#FACC15]' },
  { id: 'molly', label: 'Molly', icon: Flame, accent: 'text-[#FB7185]' },
  { id: 'wall', label: 'Wall', icon: Shield, accent: 'text-[#38BDF8]' },
  { id: 'spike', label: 'Spike', icon: Bomb, accent: 'text-[#FF4655]' },
  { id: 'pin', label: 'ปักหมุด', icon: MapPin, accent: 'text-[#E2E8F0]' },
];

const STROKE_COLORS = [
  { hex: '#34D399', label: 'เขียว (เส้นทางหลัก)' },
  { hex: '#FF4655', label: 'แดง (ฝั่งบุก/ปะทะ)' },
  { hex: '#22D3EE', label: 'ฟ้า (ฝั่งรับ/หมุน)' },
  { hex: '#FBBF24', label: 'เหลือง (หลอก/ระวัง)' },
];

function clampCoord(v: number): number {
  return Math.min(98, Math.max(2, Number(v.toFixed(1))));
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function TacticalBoard({
  maps,
  activeMap,
  side,
  agents,
  plays,
  activePlay,
  showCallouts,
  pendingAgentPlace,
  canUndo,
  canRedo,
  onMapChange,
  onSideChange,
  onSelectPlay,
  onCreatePlay,
  onDeletePlay,
  onResetPreset,
  onUpdateElements,
  onUndo,
  onRedo,
  onToggleCallouts,
  onCancelPendingAgent,
  isBoardFullscreen = false,
  onToggleBoardFullscreen,
}: TacticalBoardProps) {
  const [tool, setTool] = useState<DrawingTool>('select');
  const [strokeColor, setStrokeColor] = useState('#34D399');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [mapMenuOpen, setMapMenuOpen] = useState(false);

  // Route drawing state (multi-click waypoints)
  const [draftRoute, setDraftRoute] = useState<{ x: number; y: number }[]>([]);
  const [cursorPt, setCursorPt] = useState<{ x: number; y: number } | null>(null);

  // Freehand drawing state
  const [draftFreehand, setDraftFreehand] = useState<{ x: number; y: number }[] | null>(null);

  // Dragging marker state
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const dragInitialElementsRef = useRef<BoardElements | null>(null);

  // Selected marker for quick label edit or delete
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [pinLabelDraft, setPinLabelDraft] = useState('');

  const boardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const mapMenuRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

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

  useEffect(() => {
    setImgFailed(false);
    setDraftRoute([]);
    setDraftFreehand(null);
    setSelectedMarkerId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [activeMap.id, activeMap.displayIcon]);

  useEffect(() => {
    setSelectedMarkerId(null);
    setDraftRoute([]);
  }, [activePlay.id]);

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

  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);

  const nearestCallout = useMemo<MapCallout | null>(() => {
    if (!cursorPt || activeMap.callouts.length === 0) return null;
    let best: MapCallout | null = null;
    let bestDist = 14; // threshold in %
    for (const c of activeMap.callouts) {
      const d = Math.hypot(c.x - cursorPt.x, c.y - cursorPt.y);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }, [cursorPt, activeMap.callouts]);

  const getBoardPercent = useCallback((clientX: number, clientY: number) => {
    const el = boardRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: clampCoord(x), y: clampCoord(y) };
  }, []);

  const commitDraftRoute = useCallback(
    (points: { x: number; y: number }[]) => {
      if (points.length >= 2) {
        const nextStroke: RouteStroke = {
          id: uid('route'),
          kind: 'route',
          points,
          color: strokeColor,
          dashed: true,
        };
        onUpdateElements({
          ...activePlay.elements,
          strokes: [...activePlay.elements.strokes, nextStroke],
        });
      }
      setDraftRoute([]);
    },
    [activePlay.elements, onUpdateElements, strokeColor]
  );

  // Keyboard shortcuts (Escape cancels draft, Delete removes selected marker, Ctrl+Z/Y undo/redo)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        if (draftRoute.length > 0 || draftFreehand || selectedMarkerId || pendingAgentPlace) {
          setDraftRoute([]);
          setDraftFreehand(null);
          setSelectedMarkerId(null);
          onCancelPendingAgent();
        } else if (isBoardFullscreen && onToggleBoardFullscreen) {
          onToggleBoardFullscreen();
        }
      } else if (e.key === 'Enter' && draftRoute.length >= 2) {
        commitDraftRoute(draftRoute);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMarkerId) {
        e.preventDefault();
        onUpdateElements({
          ...activePlay.elements,
          markers: activePlay.elements.markers.filter((m) => m.id !== selectedMarkerId),
        });
        setSelectedMarkerId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activePlay.elements,
    commitDraftRoute,
    draftFreehand,
    draftRoute,
    isBoardFullscreen,
    onCancelPendingAgent,
    onRedo,
    onToggleBoardFullscreen,
    onUndo,
    onUpdateElements,
    pendingAgentPlace,
    selectedMarkerId,
  ]);

  const handlePointerDownBoard = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 1 || panMode) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }

    const pt = getBoardPercent(e.clientX, e.clientY);

    // Pending agent placement mode takes priority
    if (pendingAgentPlace) {
      const ag = agentById.get(pendingAgentPlace.agentId);
      const newMarker: BoardMarker = {
        id: uid('agent'),
        kind: 'agent',
        x: pt.x,
        y: pt.y,
        agentId: pendingAgentPlace.agentId,
        team: pendingAgentPlace.team,
        label: ag?.name,
      };
      onUpdateElements({
        ...activePlay.elements,
        markers: [...activePlay.elements.markers, newMarker],
      });
      onCancelPendingAgent();
      setSelectedMarkerId(newMarker.id);
      return;
    }

    if (tool === 'freehand') {
      setDraftFreehand([pt]);
      return;
    }

    if (tool === 'route') {
      setDraftRoute((prev) => [...prev, pt]);
      return;
    }

    if (
      tool === 'smoke' ||
      tool === 'flash' ||
      tool === 'recon' ||
      tool === 'molly' ||
      tool === 'wall' ||
      tool === 'spike' ||
      tool === 'pin'
    ) {
      const newMarker: BoardMarker = {
        id: uid(tool),
        kind: tool,
        x: pt.x,
        y: pt.y,
        label: tool === 'pin' ? nearestCallout?.key ?? 'จุดนัดหมาย' : nearestCallout?.key,
      };
      onUpdateElements({
        ...activePlay.elements,
        markers: [...activePlay.elements.markers, newMarker],
      });
      setSelectedMarkerId(newMarker.id);
      setPinLabelDraft(newMarker.label ?? '');
      return;
    }

    if (tool === 'select') {
      setSelectedMarkerId(null);
    }
  };

  const handlePointerMoveBoard = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panStartRef.current.px + dx, y: panStartRef.current.py + dy });
      return;
    }

    const pt = getBoardPercent(e.clientX, e.clientY);
    setCursorPt(pt);

    if (draggingMarkerId) {
      onUpdateElements(
        {
          ...activePlay.elements,
          markers: activePlay.elements.markers.map((m) =>
            m.id === draggingMarkerId ? { ...m, x: pt.x, y: pt.y } : m
          ),
        },
        false
      );
      return;
    }

    if (tool === 'freehand' && draftFreehand) {
      const last = draftFreehand[draftFreehand.length - 1];
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 0.8) {
        setDraftFreehand((prev) => (prev ? [...prev, pt] : [pt]));
      }
    }
  };

  const handlePointerUpBoard = () => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }

    if (draggingMarkerId) {
      setDraggingMarkerId(null);
      // Commit final position into undo stack by triggering history save
      if (dragInitialElementsRef.current) {
        onUpdateElements(activePlay.elements, true);
        dragInitialElementsRef.current = null;
      }
    }

    if (tool === 'freehand' && draftFreehand) {
      if (draftFreehand.length >= 2) {
        const stroke: RouteStroke = {
          id: uid('draw'),
          kind: 'freehand',
          points: draftFreehand,
          color: strokeColor,
          dashed: false,
        };
        onUpdateElements({
          ...activePlay.elements,
          strokes: [...activePlay.elements.strokes, stroke],
        });
      }
      setDraftFreehand(null);
    }
  };

  const handleDoubleClickBoard = () => {
    if (tool === 'route' && draftRoute.length >= 2) {
      commitDraftRoute(draftRoute);
    }
  };

  const handleRemoveStroke = (strokeId: string) => {
    onUpdateElements({
      ...activePlay.elements,
      strokes: activePlay.elements.strokes.filter((s) => s.id !== strokeId),
    });
  };

  const handleDeleteMarker = (markerId: string) => {
    onUpdateElements({
      ...activePlay.elements,
      markers: activePlay.elements.markers.filter((m) => m.id !== markerId),
    });
    if (selectedMarkerId === markerId) setSelectedMarkerId(null);
  };

  const handleUpdateMarkerLabel = (markerId: string, label: string) => {
    onUpdateElements({
      ...activePlay.elements,
      markers: activePlay.elements.markers.map((m) =>
        m.id === markerId ? { ...m, label } : m
      ),
    });
  };

  const handleClearCanvas = () => {
    onUpdateElements({ strokes: [], markers: [] });
    setDraftRoute([]);
    setSelectedMarkerId(null);
  };

  const selectedMarker = activePlay.elements.markers.find((m) => m.id === selectedMarkerId);
  const useLiveMapImg = !!activeMap.displayIcon && !imgFailed;
  const siteLabels = useMemo(
    () => activeMap.callouts.filter((c) => c.name === 'Site'),
    [activeMap.callouts]
  );
  const standardMaps = useMemo(() => maps.filter((m) => m.category !== 'tdm'), [maps]);
  const tdmMaps = useMemo(() => maps.filter((m) => m.category === 'tdm'), [maps]);
  const quickStripMaps = useMemo(() => {
    if (activeMap.category === 'tdm') {
      return [activeMap, ...standardMaps];
    }
    return standardMaps;
  }, [activeMap, standardMaps]);

  let smokeNumber = 0;
  const squareSize =
    stageSize.width > 0 && stageSize.height > 0
      ? Math.floor(Math.min(stageSize.width, stageSize.height))
      : 0;

  const mapFit = useMemo(() => {
    const pts = activeMap.callouts;
    if (pts.length === 0 || stageSize.width <= 0 || stageSize.height <= 0 || squareSize <= 0) {
      return { autoScale: 1.15, centerX: 50, centerY: 50 };
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
    const padMinX = Math.max(0, minX - 4);
    const padMaxX = Math.min(100, maxX + 4);
    const padMinY = Math.max(0, minY - 3);
    const padMaxY = Math.min(100, maxY + 2);
    const spanX = Math.max(20, padMaxX - padMinX);
    const spanY = Math.max(20, padMaxY - padMinY);
    const centerX = Math.min(62, Math.max(38, (padMinX + padMaxX) / 2));
    const centerY = Math.min(62, Math.max(38, (padMinY + padMaxY) / 2));
    const fitX = stageSize.width / (squareSize * (spanX / 100));
    const fitY = stageSize.height / (squareSize * (spanY / 100));
    const autoScale = Math.min(1.65, Math.max(1.15, Math.min(fitX, fitY)));
    return { autoScale, centerX, centerY };
  }, [activeMap.callouts, stageSize.width, stageSize.height, squareSize]);

  const effectiveScale = mapFit.autoScale * zoom;

  const handleWheelStage = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((z) => Math.min(2.6, Math.max(0.8, Number((z + delta).toFixed(2)))));
  };

  return (
    <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#0B0E14]">
      {/* Map & Side Control Strip */}
      <div className="flex items-center justify-between gap-2.5 border-b border-[#263145] bg-[#111620] px-3 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Map Dropdown Selector */}
          <div ref={mapMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMapMenuOpen((o) => !o)}
              className="clip-angle-sm flex items-center gap-2 border border-[#263145] bg-[#171E2B] px-3 py-1.5 text-left transition-colors hover:border-[#FF4655]"
            >
              <span className="font-display text-sm font-bold uppercase tracking-wider text-[#F1F5F9] whitespace-nowrap">
                {activeMap.name}
              </span>
              <span className="font-mono-tabular text-[11px] text-[#94A3B8] whitespace-nowrap">
                {activeMap.sites.join('/')}
              </span>
              <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
            </button>

            {mapMenuOpen && (
              <div className="absolute left-0 top-11 z-50 w-80 border border-[#2E3B52] bg-[#111620] p-1.5 shadow-2xl">
                <div className="scrollbar-thin max-h-96 overflow-y-auto">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    โหมดมาตรฐาน 5v5 ({standardMaps.length} แผนที่)
                  </div>
                  {standardMaps.map((m) => {
                    const active = m.id === activeMap.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onMapChange(m.id);
                          setMapMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-xs transition-colors ${
                          active
                            ? 'bg-[#FF4655]/15 text-[#F1F5F9]'
                            : 'text-[#CBD5E1] hover:bg-[#171E2B]'
                        }`}
                      >
                        <div className="h-8 w-8 shrink-0 overflow-hidden border border-[#263145] bg-[#0B0E14]">
                          {m.displayIcon || m.splash ? (
                            <img
                              src={m.displayIcon ?? m.splash}
                              alt={m.name}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-sm font-semibold uppercase">
                            {m.name}
                          </div>
                          <div className="line-clamp-1 text-[11px] text-[#64748B]">{m.feature}</div>
                        </div>
                        <span className="shrink-0 font-mono-tabular text-[11px] text-[#94A3B8]">
                          {m.sites.join('/')}
                        </span>
                      </button>
                    );
                  })}

                  {tdmMaps.length > 0 && (
                    <>
                      <div className="mt-1.5 border-t border-[#263145] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        Team Deathmatch ({tdmMaps.length} แผนที่)
                      </div>
                      {tdmMaps.map((m) => {
                        const active = m.id === activeMap.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onMapChange(m.id);
                              setMapMenuOpen(false);
                            }}
                            className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-xs transition-colors ${
                              active
                                ? 'bg-[#22D3EE]/15 text-[#F1F5F9]'
                                : 'text-[#CBD5E1] hover:bg-[#171E2B]'
                            }`}
                          >
                            <div className="h-8 w-8 shrink-0 overflow-hidden border border-[#263145] bg-[#0B0E14]">
                              {m.displayIcon || m.splash ? (
                                <img
                                  src={m.displayIcon ?? m.splash}
                                  alt={m.name}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-display text-sm font-semibold uppercase">
                                {m.name}
                              </div>
                              <div className="line-clamp-1 text-[11px] text-[#64748B]">
                                {m.feature}
                              </div>
                            </div>
                            <span className="shrink-0 font-mono-tabular text-[11px] text-[#22D3EE]">
                              TDM
                            </span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Quick Map Tabs (All Standard Maps) */}
          <div
            onWheel={(e) => {
              if (Math.abs(e.deltaY) > 0) e.currentTarget.scrollLeft += e.deltaY;
            }}
            className="no-scrollbar hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5 md:flex"
          >
            {quickStripMaps.map((m) => {
              const active = m.id === activeMap.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMapChange(m.id)}
                  className={`shrink-0 whitespace-nowrap px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider transition-colors ${
                    active
                      ? 'bg-[#263145] text-[#F1F5F9]'
                      : 'text-[#64748B] hover:bg-[#171E2B] hover:text-[#CBD5E1]'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Attack / Defense Toggle */}
        <div
          className="flex shrink-0 items-center border border-[#263145] bg-[#0B0E14] p-0.5"
          role="group"
          aria-label="เลือกฝั่งการเล่น"
        >
          <button
            type="button"
            onClick={() => onSideChange('attack')}
            aria-pressed={side === 'attack'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
              side === 'attack'
                ? 'bg-[#FF4655] text-white'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <Swords className="h-3.5 w-3.5" />
            ฝั่งบุก · ATTACK
          </button>
          <button
            type="button"
            onClick={() => onSideChange('defense')}
            aria-pressed={side === 'defense'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
              side === 'defense'
                ? 'bg-[#22D3EE] text-[#0B0E14]'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            ฝั่งรับ · DEFENSE
          </button>
        </div>
      </div>

      {/* Playbook Selector Strip */}
      <div
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > 0) e.currentTarget.scrollLeft += e.deltaY;
        }}
        className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-[#263145] bg-[#111620]/80 px-3 py-1.5"
      >
        <span className="shrink-0 text-xs font-medium text-[#94A3B8]">
          แผน ({plays.length}):
        </span>
        <div className="flex items-center gap-1.5">
          {plays.map((p) => {
            const isCurrent = p.id === activePlay.id;
            return (
              <div key={p.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectPlay(p.id)}
                  className={`flex items-center gap-1.5 border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    isCurrent
                      ? side === 'attack'
                        ? 'border-[#FF4655] bg-[#FF4655]/15 text-[#F1F5F9]'
                        : 'border-[#22D3EE] bg-[#22D3EE]/15 text-[#F1F5F9]'
                      : 'border-[#263145] bg-[#171E2B] text-[#94A3B8] hover:border-[#475569] hover:text-[#F1F5F9]'
                  }`}
                >
                  <span>{p.name}</span>
                </button>
                {isCurrent && !p.isPreset && (
                  <button
                    type="button"
                    onClick={() => onDeletePlay(p.id)}
                    title="ลบแผนนี้"
                    aria-label="ลบแผนนี้"
                    className="border border-l-0 border-[#263145] bg-[#171E2B] px-1.5 py-1 text-[#94A3B8] hover:text-[#FF4655]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {isCurrent && p.isPreset && (
                  <button
                    type="button"
                    onClick={() => onResetPreset(p.id)}
                    title="รีเซ็ตแผนต้นฉบับ"
                    aria-label="รีเซ็ตแผนต้นฉบับ"
                    className="border border-l-0 border-[#263145] bg-[#171E2B] px-1.5 py-1 text-[#94A3B8] hover:text-[#FBBF24]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCreatePlay}
          className="ml-auto flex shrink-0 items-center gap-1 border border-dashed border-[#475569] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-[#FF4655] hover:text-[#FF4655] whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          สร้างแผนใหม่
        </button>
      </div>

      {/* Interactive Drawing & Marker Toolbar (Single-row on Desktop) */}
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-[#263145] bg-[#111620] px-2.5 py-1">
        {TOOL_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          const active = tool === btn.id && !panMode && !pendingAgentPlace;
          return (
            <button
              key={btn.id}
              type="button"
              title={btn.label}
              onClick={() => {
                setTool(btn.id);
                setPanMode(false);
                onCancelPendingAgent();
                if (btn.id !== 'route') setDraftRoute([]);
              }}
              className={`flex shrink-0 items-center gap-1 border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'border-[#FF4655] bg-[#FF4655]/15 text-[#F1F5F9]'
                  : 'border-transparent bg-[#171E2B] text-[#94A3B8] hover:border-[#263145] hover:text-[#F1F5F9]'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${btn.accent ?? ''}`} />
              <span className="hidden xl:inline">{btn.label}</span>
            </button>
          );
        })}

        {/* Color Swatches for route / freehand */}
        {(tool === 'route' || tool === 'freehand') && (
          <div className="flex shrink-0 items-center gap-1 border-l border-[#263145] pl-1.5">
            {STROKE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.label}
                aria-label={c.label}
                onClick={() => setStrokeColor(c.hex)}
                className={`h-4 w-4 border transition-transform ${
                  strokeColor === c.hex ? 'scale-110 border-white' : 'border-transparent opacity-75 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 pl-2">
          <button
            type="button"
            onClick={onToggleCallouts}
            aria-pressed={showCallouts}
            title="แสดง/ซ่อนชื่อจุด Callouts"
            className={`flex items-center gap-1 border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
              showCallouts
                ? 'border-[#22D3EE]/50 bg-[#22D3EE]/15 text-[#22D3EE]'
                : 'border-[#263145] bg-[#171E2B] text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Callouts
          </button>

          <button
            type="button"
            onClick={() => setPanMode((p) => !p)}
            aria-pressed={panMode}
            title="เลื่อนแผนที่ (Pan)"
            className={`border p-1 transition-colors ${
              panMode
                ? 'border-[#FF4655] bg-[#FF4655]/20 text-white'
                : 'border-[#263145] bg-[#171E2B] text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <Hand className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(2))))}
            title="ซูมออก"
            aria-label="ซูมออก"
            className="border border-[#263145] bg-[#171E2B] p-1 text-[#94A3B8] hover:text-[#F1F5F9]"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="รีเซ็ตขนาดพอดีกรอบ"
            className="border border-[#263145] bg-[#171E2B] px-1.5 py-0.5 font-mono-tabular text-[11px] text-[#CBD5E1] hover:text-white whitespace-nowrap"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.6, Number((z + 0.2).toFixed(2))))}
            title="ซูมเข้า"
            aria-label="ซูมเข้า"
            className="border border-[#263145] bg-[#171E2B] p-1 text-[#94A3B8] hover:text-[#F1F5F9]"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-[#263145]" />

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="ย้อนกลับ (Ctrl+Z)"
            aria-label="ย้อนกลับ"
            className="border border-[#263145] bg-[#171E2B] p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] disabled:opacity-35"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="ทำซ้ำ (Ctrl+Shift+Z)"
            aria-label="ทำซ้ำ"
            className="border border-[#263145] bg-[#171E2B] p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] disabled:opacity-35"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClearCanvas}
            title="ล้างภาพวาดและสัญลักษณ์ทั้งหมด"
            aria-label="ล้างกระดาน"
            className="border border-[#263145] bg-[#171E2B] p-1.5 text-[#94A3B8] hover:border-[#FF4655]/50 hover:text-[#FF4655]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {onToggleBoardFullscreen && (
            <>
              <div className="mx-1 h-4 w-px bg-[#263145]" />
              <button
                type="button"
                onClick={onToggleBoardFullscreen}
                aria-pressed={isBoardFullscreen}
                title={isBoardFullscreen ? 'ออกจากโหมดฟลูสกรีน (ESC)' : 'ขยายกระดานเต็มจอ (ฟลูสกรีน)'}
                aria-label={isBoardFullscreen ? 'ออกจากโหมดฟลูสกรีน' : 'ขยายกระดานเต็มจอ'}
                className={`flex items-center gap-1 border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  isBoardFullscreen
                    ? 'border-[#22D3EE] bg-[#22D3EE]/15 text-[#22D3EE]'
                    : 'border-[#263145] bg-[#171E2B] text-[#CBD5E1] hover:border-[#475569] hover:text-white'
                }`}
              >
                {isBoardFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
                <span>{isBoardFullscreen ? 'ย่อกลับ' : 'เต็มจอ'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contextual Action Hints */}
      {(pendingAgentPlace || tool === 'route' || selectedMarker) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#263145] bg-[#171E2B] px-4 py-1.5 text-xs">
          {pendingAgentPlace ? (
            <div className="flex items-center gap-2 text-[#22D3EE]">
              <span>
                คลิกบนแผนที่เพื่อวางตำแหน่ง{' '}
                <strong className="font-semibold">
                  {agentById.get(pendingAgentPlace.agentId)?.name}
                </strong>{' '}
                ({pendingAgentPlace.team === 'our' ? 'ทีมเรา' : 'ทีมศัตรู'})
              </span>
              <button
                type="button"
                onClick={onCancelPendingAgent}
                className="border border-[#263145] bg-[#111620] px-2 py-0.5 text-[11px] text-[#CBD5E1] hover:text-white"
              >
                ยกเลิก
              </button>
            </div>
          ) : tool === 'route' ? (
            <div className="flex items-center gap-3 text-[#34D399]">
              <span>
                {draftRoute.length === 0
                  ? 'คลิกจุดเริ่มต้นและจุดถัดไปบนแผนที่เพื่อวาดเส้นทางเดิน (ดับเบิลคลิกหรือกด Enter เพื่อจบเส้น)'
                  : `กำลังวาดเส้นทาง (${draftRoute.length} จุด) — คลิกต่อ หรือกดจบเส้น`}
              </span>
              {draftRoute.length >= 2 && (
                <button
                  type="button"
                  onClick={() => commitDraftRoute(draftRoute)}
                  className="bg-[#34D399] px-2.5 py-0.5 text-[11px] font-semibold text-[#0B0E14]"
                >
                  จบเส้นทาง
                </button>
              )}
              {draftRoute.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraftRoute([])}
                  className="border border-[#263145] px-2 py-0.5 text-[11px] text-[#94A3B8] hover:text-white"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          ) : selectedMarker ? (
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[#94A3B8]">ป้ายกำกับหมุด:</span>
                <input
                  type="text"
                  value={pinLabelDraft}
                  onChange={(e) => {
                    setPinLabelDraft(e.target.value);
                    handleUpdateMarkerLabel(selectedMarker.id, e.target.value);
                  }}
                  placeholder="ระบุชื่อจุดหรือคำสั่ง..."
                  className="border border-[#263145] bg-[#0B0E14] px-2 py-0.5 text-xs text-[#F1F5F9] focus:border-[#FF4655] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteMarker(selectedMarker.id)}
                  className="flex items-center gap-1 border border-[#FF4655]/40 bg-[#FF4655]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#FF4655] hover:bg-[#FF4655] hover:text-white"
                >
                  <Trash2 className="h-3 w-3" />
                  ลบหมุดนี้
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMarkerId(null)}
                  className="text-[#94A3B8] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Main Interactive Map Canvas (Full-Bleed Interactive Stage) */}
      <div
        ref={stageRef}
        onWheel={handleWheelStage}
        onPointerDown={handlePointerDownBoard}
        onPointerMove={handlePointerMoveBoard}
        onPointerUp={handlePointerUpBoard}
        onPointerLeave={() => {
          setCursorPt(null);
          handlePointerUpBoard();
        }}
        onDoubleClick={handleDoubleClickBoard}
        className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden bg-[#0B0E14]"
        style={{
          cursor: panMode || isPanning ? 'grab' : tool === 'select' && !pendingAgentPlace ? 'default' : 'crosshair',
        }}
      >
        {/* Full-bleed Map Splash Artwork Backdrop Filling Side Zones */}
        {activeMap.splash && (
          <img
            src={activeMap.splash}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-25 saturate-75"
          />
        )}
        <div
          aria-hidden="true"
          className="bg-tactical-grid pointer-events-none absolute inset-0 opacity-45"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B0E14]/90 via-[#0B0E14]/45 to-[#0B0E14]/90"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B0E14]/55 via-transparent to-[#0B0E14]/70"
        />

        {/* Dynamic Auto-Fitted & Zoomable Square Coordinate Stage (Unclipped inside stageRef) */}
        <div
          className="relative z-10 aspect-square transition-transform duration-75"
          style={{
            width: squareSize > 0 ? `${squareSize}px` : '100%',
            height: squareSize > 0 ? `${squareSize}px` : '100%',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveScale}) translate(${(50 - mapFit.centerX).toFixed(2)}%, ${(50 - mapFit.centerY).toFixed(2)}%)`,
            transformOrigin: 'center center',
          }}
        >
          <div className="relative h-full w-full">
            <div ref={boardRef} className="relative h-full w-full">
            {/* Base Minimap (Live Image or Fallback Schematic SVG) */}
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
                <defs>
                  <pattern
                    id="site-hatch"
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,70,85,0.22)" strokeWidth="2" />
                  </pattern>
                </defs>
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
                    <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="url(#site-hatch)" />
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
                    >
                      {s.label}
                    </text>
                  </g>
                ))}
                {/* Spawns */}
                <rect
                  x={activeMap.fallbackGeometry.defenderSpawn.x}
                  y={activeMap.fallbackGeometry.defenderSpawn.y}
                  width={activeMap.fallbackGeometry.defenderSpawn.w}
                  height={activeMap.fallbackGeometry.defenderSpawn.h}
                  fill="rgba(34,211,238,0.14)"
                  stroke="#22D3EE"
                />
                <text
                  x={activeMap.fallbackGeometry.defenderSpawn.x + activeMap.fallbackGeometry.defenderSpawn.w / 2}
                  y={activeMap.fallbackGeometry.defenderSpawn.y + 40}
                  textAnchor="middle"
                  fill="#22D3EE"
                  className="font-display text-[12px] font-bold"
                >
                  DEFENDER SPAWN
                </text>
                <rect
                  x={activeMap.fallbackGeometry.attackerSpawn.x}
                  y={activeMap.fallbackGeometry.attackerSpawn.y}
                  width={activeMap.fallbackGeometry.attackerSpawn.w}
                  height={activeMap.fallbackGeometry.attackerSpawn.h}
                  fill="rgba(255,70,85,0.16)"
                  stroke="#FF4655"
                />
                <text
                  x={activeMap.fallbackGeometry.attackerSpawn.x + activeMap.fallbackGeometry.attackerSpawn.w / 2}
                  y={activeMap.fallbackGeometry.attackerSpawn.y + 40}
                  textAnchor="middle"
                  fill="#FF4655"
                  className="font-display text-[12px] font-bold"
                >
                  ATTACKER SPAWN
                </text>
              </svg>
            )}

            {/* SVG Tactical Overlay Layer */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <radialGradient id="smoke-grad">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0.22" />
                </radialGradient>
              </defs>

              {/* Site Labels (over live map image) */}
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
                    className="pointer-events-none font-display font-bold"
                    style={{
                      paintOrder: 'stroke',
                      stroke: 'rgba(11, 14, 20, 0.9)',
                      strokeWidth: '0.8',
                    }}
                  >
                    {sl.group}
                  </text>
                ))}

              {/* Callout Labels Directly on Map Image */}
              {showCallouts &&
                activeMap.callouts
                  .filter((c) => c.name !== 'Site')
                  .map((c) => {
                    const isAtk = c.group === 'Atk';
                    const isDef = c.group === 'Def';
                    const dotColor = isAtk ? '#FF4655' : isDef ? '#22D3EE' : '#94A3B8';
                    const textColor = isAtk ? '#FDA4AF' : isDef ? '#A5F3FC' : '#F1F5F9';
                    return (
                      <g key={c.key} className="pointer-events-none">
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r="0.55"
                          fill={dotColor}
                          stroke="#0B0E14"
                          strokeWidth="0.22"
                        />
                        <text
                          x={c.x}
                          y={c.y - 1.1}
                          textAnchor="middle"
                          fill={textColor}
                          fontSize="1.7"
                          className="font-display font-semibold"
                          style={{
                            paintOrder: 'stroke',
                            stroke: 'rgba(11, 14, 20, 0.94)',
                            strokeWidth: '0.55',
                            strokeLinejoin: 'round',
                          }}
                        >
                          {c.key}
                        </text>
                      </g>
                    );
                  })}

              {/* Committed Strokes */}
              {activePlay.elements.strokes.map((st) => {
                if (st.points.length < 2) return null;
                const ptsStr = st.points.map((p) => `${p.x},${p.y}`).join(' ');
                const last = st.points[st.points.length - 1];
                const prev = st.points[st.points.length - 2];
                const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
                const headSize = 1.9;
                const arrowPts =
                  st.kind === 'route'
                    ? `${last.x},${last.y} ${last.x - headSize * Math.cos(angle - Math.PI / 6)},${
                        last.y - headSize * Math.sin(angle - Math.PI / 6)
                      } ${last.x - headSize * Math.cos(angle + Math.PI / 6)},${
                        last.y - headSize * Math.sin(angle + Math.PI / 6)
                      }`
                    : '';

                return (
                  <g
                    key={st.id}
                    className={tool === 'select' ? 'cursor-pointer' : 'pointer-events-none'}
                    onClick={(ev) => {
                      if (tool === 'select') {
                        ev.stopPropagation();
                        handleRemoveStroke(st.id);
                      }
                    }}
                  >
                    <polyline
                      points={ptsStr}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="2.8"
                    />
                    <polyline
                      points={ptsStr}
                      fill="none"
                      stroke="#0B0E14"
                      strokeWidth={st.kind === 'route' ? '1.35' : '1.1'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.65"
                    />
                    <polyline
                      points={ptsStr}
                      fill="none"
                      stroke={st.color}
                      strokeWidth={st.kind === 'route' ? '0.8' : '0.65'}
                      strokeDasharray={st.dashed ? '2.1 1.1' : undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={st.dashed ? 'animate-route-dash' : undefined}
                    />
                    {st.kind === 'route' && (
                      <>
                        <circle cx={st.points[0].x} cy={st.points[0].y} r="0.85" fill={st.color} />
                        <polygon points={arrowPts} fill={st.color} />
                      </>
                    )}
                  </g>
                );
              })}

              {/* Draft Route Preview */}
              {draftRoute.length > 0 && (
                <g className="pointer-events-none">
                  <polyline
                    points={[...draftRoute, ...(cursorPt ? [cursorPt] : [])]
                      .map((p) => `${p.x},${p.y}`)
                      .join(' ')}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="0.8"
                    strokeDasharray="1.8 1"
                    opacity="0.85"
                  />
                  {draftRoute.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="0.9" fill={strokeColor} />
                  ))}
                </g>
              )}

              {/* Draft Freehand Preview */}
              {draftFreehand && draftFreehand.length >= 2 && (
                <polyline
                  points={draftFreehand.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="0.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none"
                />
              )}

              {/* Smoke Markers in SVG */}
              {activePlay.elements.markers
                .filter((m) => m.kind === 'smoke')
                .map((m) => {
                  smokeNumber += 1;
                  const isSel = selectedMarkerId === m.id;
                  return (
                    <g
                      key={m.id}
                      className="cursor-move"
                      onPointerDown={(ev) => {
                        if (tool !== 'select' && tool !== 'smoke') return;
                        ev.stopPropagation();
                        dragInitialElementsRef.current = activePlay.elements;
                        setDraggingMarkerId(m.id);
                        setSelectedMarkerId(m.id);
                        setPinLabelDraft(m.label ?? '');
                      }}
                    >
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r="3.8"
                        fill="url(#smoke-grad)"
                        stroke={isSel ? '#FFFFFF' : '#A855F7'}
                        strokeWidth={isSel ? '0.55' : '0.35'}
                      />
                      <text
                        x={m.x}
                        y={m.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#FFFFFF"
                        fontSize="2.4"
                        className="pointer-events-none font-display font-bold"
                      >
                        {smokeNumber}
                      </text>
                    </g>
                  );
                })}
            </svg>

            {/* HTML Interactive Overlay for Utility, Spike, Pin, and Agent Tokens */}
            {activePlay.elements.markers
              .filter((m) => m.kind !== 'smoke')
              .map((m) => {
                const isSel = selectedMarkerId === m.id;
                const ag = m.agentId ? agentById.get(m.agentId) : undefined;

                if (m.kind === 'agent' && ag) {
                  const borderCol = m.team === 'enemy' ? 'border-[#FB7185]' : 'border-[#22D3EE]';
                  return (
                    <div
                      key={m.id}
                      onPointerDown={(ev) => {
                        if (panMode) return;
                        ev.stopPropagation();
                        dragInitialElementsRef.current = activePlay.elements;
                        setDraggingMarkerId(m.id);
                        setSelectedMarkerId(m.id);
                        setPinLabelDraft(m.label ?? ag.name);
                      }}
                      style={{ left: `${m.x}%`, top: `${m.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move"
                      title={`${ag.name} (${m.team === 'enemy' ? 'ศัตรู' : 'ทีมเรา'})`}
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 bg-[#111620] shadow-lg ${borderCol} ${
                          isSel ? 'ring-2 ring-white' : ''
                        }`}
                      >
                        {ag.icon ? (
                          <img
                            src={ag.icon}
                            alt={ag.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover pointer-events-none"
                          />
                        ) : (
                          <span className="font-display text-[10px] font-bold text-white">
                            {ag.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                const iconConfig: Record<
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

                const cfg = iconConfig[m.kind] ?? iconConfig.pin;
                const Icon = cfg.Icon;

                return (
                  <div
                    key={m.id}
                    onPointerDown={(ev) => {
                      if (panMode) return;
                      ev.stopPropagation();
                      dragInitialElementsRef.current = activePlay.elements;
                      setDraggingMarkerId(m.id);
                      setSelectedMarkerId(m.id);
                      setPinLabelDraft(m.label ?? '');
                    }}
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move flex flex-col items-center"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border bg-[#111620]/95 shadow-md ${cfg.ring} ${
                        isSel ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    {m.label && (
                      <span className="mt-0.5 whitespace-nowrap border border-[#263145] bg-[#0B0E14]/90 px-1 py-0 text-[9px] font-medium text-[#F1F5F9]">
                        {m.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Non-overlapping Outer Stage HUDs */}
        <div className="pointer-events-none absolute right-2 top-2 z-20 flex items-center gap-1 border border-[#263145] bg-[#0B0E14]/85 px-2 py-0.5 font-mono-tabular text-[10px] text-[#94A3B8]">
          <Compass className="h-3 w-3 text-[#FF4655]" />
          N
        </div>

        {cursorPt && (
          <div className="pointer-events-none absolute bottom-2 right-2 z-20 border border-[#263145] bg-[#0B0E14]/85 px-2.5 py-1 font-mono-tabular text-[11px] text-[#CBD5E1]">
            {nearestCallout ? `${nearestCallout.key} · ` : ''}
            {cursorPt.x.toFixed(0)}, {cursorPt.y.toFixed(0)}
          </div>
        )}
      </div>
    </main>
  );
}
