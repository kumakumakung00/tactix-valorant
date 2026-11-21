export type AgentRole = 'duelist' | 'initiator' | 'controller' | 'sentinel';

export type Side = 'attack' | 'defense';

export type RoundType = 'pistol' | 'eco' | 'bonus' | 'full' | 'retake';

export type LiveMatchEconomy = 'pistol' | 'eco' | 'bonus' | 'full';

export type LiveMatchProblemId =
  | 'atk_stuck_traps'
  | 'atk_op_locked'
  | 'atk_flanked'
  | 'atk_def_aggro'
  | 'atk_rotate_late'
  | 'def_fast_rush'
  | 'def_fake_heavy'
  | 'def_mid_control'
  | 'def_postplant_lose'
  | 'def_man_down';

export type AppView = 'board' | 'livematch' | 'agents' | 'training' | 'progress' | 'crosshairs';

export interface AgentAbility {
  slot: string;
  name: string;
  description: string;
  icon?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  icon?: string;
  portrait?: string;
  description?: string;
  roleDescription?: string;
  abilities: AgentAbility[];
}

export interface MapCallout {
  key: string;
  group: string;
  name: string;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
}

export interface FallbackRect {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

export interface FallbackMapGeometry {
  defenderSpawn: FallbackRect;
  attackerSpawn: FallbackRect;
  sites: FallbackRect[];
  floors: FallbackRect[];
  callouts: { x: number; y: number; text: string }[];
  teleporters?: { from: { x: number; y: number }; to: { x: number; y: number } };
}

export interface ValorantMap {
  id: string;
  uuid?: string;
  name: string;
  category?: 'standard' | 'tdm';
  sites: string[];
  feature: string;
  displayIcon?: string;
  splash?: string;
  callouts: MapCallout[];
  fallbackGeometry: FallbackMapGeometry;
}

export type DrawingTool =
  | 'select'
  | 'route'
  | 'freehand'
  | 'smoke'
  | 'flash'
  | 'recon'
  | 'molly'
  | 'wall'
  | 'spike'
  | 'pin';

export interface RouteStroke {
  id: string;
  kind: 'route' | 'freehand';
  points: { x: number; y: number }[];
  color: string;
  dashed?: boolean;
}

export type MarkerKind =
  | 'smoke'
  | 'flash'
  | 'recon'
  | 'molly'
  | 'wall'
  | 'spike'
  | 'pin'
  | 'agent'
  | 'position';

export interface BoardMarker {
  id: string;
  kind: MarkerKind;
  x: number; // 0 - 100
  y: number; // 0 - 100
  label?: string;
  agentId?: string;
  team?: 'our' | 'enemy';
  abilityName?: string;
  abilityIcon?: string;
  slotNumber?: number;
  roleTone?: 'attack' | 'defense' | 'lurk' | 'warning';
}

export interface BoardElements {
  strokes: RouteStroke[];
  markers: BoardMarker[];
}

export interface StrategyStep {
  id: string;
  text: string;
  done?: boolean;
}

export interface StrategyPlay {
  id: string;
  mapId: string;
  side: Side;
  name: string;
  roundType: RoundType;
  isPreset?: boolean;
  elements: BoardElements;
  steps: StrategyStep[];
  assignments: Record<string, string>; // slotIndex ("0".."4") -> duty string
  notes: string;
  updatedAt: number;
}

export interface PresetPlanSeed {
  id: string;
  mapId: string;
  side: Side;
  name: string;
  roundType: RoundType;
  smokes: (string | { x: number; y: number; label?: string })[];
  routes: (string | { x: number; y: number })[][];
  utilities?: {
    kind: 'flash' | 'recon' | 'molly' | 'wall' | 'spike';
    pos: string | { x: number; y: number };
    label?: string;
  }[];
  notes: string[];
}

export interface TactixPersistedState {
  mapId: string;
  side: Side;
  ourTeam: (string | null)[];
  enemyTeam: (string | null)[];
  customPlays: StrategyPlay[];
  activePlayIdByKey: Record<string, string>; // `${mapId}:${side}` -> playId
  presetOverrides: Record<string, StrategyPlay>; // playId -> modified copy
  showCallouts: boolean;
}

export interface ProDrillItem {
  id: string;
  title: string;
  mode: string;
  duration: string;
  goal: string;
  steps: string[];
}

export interface ProTrainingProfile {
  id: string;
  playerName: string;
  teamTag: string;
  roleFocus: string;
  primaryRole?: AgentRole;
  agentId?: string;
  specialty: string;
  philosophy: string;
  settingsNote: string;
  drills: ProDrillItem[];
  keyTakeaways: string[];
}

export type WarmupProgramId = 'standard' | 'tenz' | 'demon1' | 'custom';

export interface CustomWarmupItem {
  id: string;
  label: string;
  hint: string;
}

export interface MatchProgressLog {
  id: string;
  createdAt: number;
  mapId: string;
  mapName: string;
  agentId: string;
  agentName: string;
  result?: 'win' | 'loss';
  rating?: number;
  deathCauses: string[];
  note: string;
}

export interface MyProgressPersistedState {
  warmupProgramId: WarmupProgramId;
  warmupChecksByProgram: Record<string, Record<string, boolean>>;
  customWarmupItems: CustomWarmupItem[];
  customWarmupMinutes: number;
  warmupChecks: {
    bots: boolean;
    deathmatch: boolean;
    crosshair: boolean;
  };
  warmupCompletedDates: string[];
  dailyMission: string;
  dailyMissionDone: boolean;
  logs: MatchProgressLog[];
  roleMasteryRole?: AgentRole;
  roleMasteryChecks?: Record<AgentRole, Record<string, boolean>>;
}
