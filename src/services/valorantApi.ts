import {
  FALLBACK_AGENTS,
  FALLBACK_CALLOUTS,
  FALLBACK_MAPS,
  GENERIC_2SITE_GEOMETRY,
  MAP_FEATURES_TH,
  normalizeId,
} from '../data/valorantFallback';
import { Agent, AgentRole, MapCallout, ValorantMap } from '../types/tactix';

interface RawApiAgent {
  uuid: string;
  displayName: string;
  description?: string;
  displayIcon?: string;
  fullPortrait?: string;
  bustPortrait?: string;
  role?: { displayName: string; description?: string };
  abilities?: {
    slot: string;
    displayName: string;
    description: string;
    displayIcon?: string;
  }[];
}

interface RawApiMap {
  uuid: string;
  displayName: string;
  mapUrl?: string;
  tacticalDescription?: string;
  displayIcon?: string;
  splash?: string;
  xMultiplier: number;
  yMultiplier: number;
  xScalarToAdd: number;
  yScalarToAdd: number;
  callouts?: {
    regionName: string;
    superRegionName: string;
    location: { x: number; y: number };
  }[];
}

export interface ValorantAssetsPayload {
  agents: Agent[];
  maps: ValorantMap[];
  live: boolean;
}

const ROLE_MAP: Record<string, AgentRole> = {
  duelist: 'duelist',
  initiator: 'initiator',
  controller: 'controller',
  sentinel: 'sentinel',
};

const ABILITY_SLOT_ORDER: Record<string, number> = {
  Grenade: 0,
  Ability1: 1,
  Ability2: 2,
  Ultimate: 3,
  Passive: 4,
};

function cleanRiotText(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const COMP_PRIORITY = [
  'ascent',
  'haven',
  'bind',
  'split',
  'lotus',
  'sunset',
  'icebox',
  'pearl',
  'breeze',
  'fracture',
  'abyss',
  'corrode',
  'summit',
  'district',
  'kasbah',
  'drift',
  'glitch',
  'piazza',
];

export async function fetchValorantAssets(): Promise<ValorantAssetsPayload> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    const [agentsRes, mapsRes] = await Promise.all([
      fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=th-TH', {
        signal: controller.signal,
      }),
      fetch('https://valorant-api.com/v1/maps', { signal: controller.signal }),
    ]);

    window.clearTimeout(timeout);

    if (!agentsRes.ok || !mapsRes.ok) {
      throw new Error('Failed to fetch from valorant-api.com');
    }

    const agentsJson = (await agentsRes.json()) as { data?: RawApiAgent[] };
    const mapsJson = (await mapsRes.json()) as { data?: RawApiMap[] };

    const apiAgents = (agentsJson.data ?? [])
      .filter((a) => a.role?.displayName && ROLE_MAP[a.role.displayName.toLowerCase()])
      .map((a): Agent => {
        const role = ROLE_MAP[a.role!.displayName.toLowerCase()];
        const cleanName = a.displayName === 'NEON' ? 'Neon' : a.displayName;
        const abilities = (a.abilities ?? [])
          .filter((ab) => ab.displayName)
          .sort(
            (x, y) =>
              (ABILITY_SLOT_ORDER[x.slot] ?? 9) - (ABILITY_SLOT_ORDER[y.slot] ?? 9)
          )
          .slice(0, 5)
          .map((ab) => ({
            slot: ab.slot,
            name: ab.displayName,
            description: cleanRiotText(ab.description),
            icon: ab.displayIcon,
          }));
        return {
          id: normalizeId(cleanName),
          name: cleanName,
          role,
          icon: a.displayIcon,
          portrait: a.fullPortrait ?? a.bustPortrait,
          description: cleanRiotText(a.description),
          roleDescription: cleanRiotText(a.role?.description),
          abilities,
        };
      });

    const agentById = new Map<string, Agent>();
    FALLBACK_AGENTS.forEach((fa) => agentById.set(fa.id, fa));
    apiAgents.forEach((aa) => agentById.set(aa.id, aa));
    const mergedAgents = Array.from(agentById.values());

    const fallbackMapById = new Map(FALLBACK_MAPS.map((m) => [m.id, m]));
    const apiMapsRaw = (mapsJson.data ?? []).filter((m) => {
      if (!m.displayIcon) return false;
      const isStandard = Boolean(m.tacticalDescription && m.tacticalDescription.includes('Sites'));
      const isTdm = Boolean(m.mapUrl && m.mapUrl.includes('/HURM/'));
      return isStandard || isTdm;
    });

    const mergedMapsMap = new Map<string, ValorantMap>();
    FALLBACK_MAPS.forEach((fm) => mergedMapsMap.set(fm.id, fm));

    for (const rm of apiMapsRaw) {
      const id = normalizeId(rm.displayName);
      const isTdm = Boolean(rm.mapUrl && rm.mapUrl.includes('/HURM/'));
      const existing = fallbackMapById.get(id);
      const sites = isTdm
        ? ['TDM']
        : rm.tacticalDescription?.includes('A/B/C')
        ? ['A', 'B', 'C']
        : ['A', 'B'];

      const computedCallouts: MapCallout[] = (rm.callouts ?? []).map((c) => {
        const superShort = c.superRegionName
          .replace(' Side', '')
          .replace('Attacker', 'Atk')
          .replace('Defender', 'Def');
        const key = `${superShort} ${c.regionName}`.trim();
        const x = Number(((c.location.y * rm.xMultiplier + rm.xScalarToAdd) * 100).toFixed(1));
        const y = Number(((c.location.x * rm.yMultiplier + rm.yScalarToAdd) * 100).toFixed(1));
        return {
          key,
          group: superShort,
          name: c.regionName,
          x: Math.min(98, Math.max(2, x)),
          y: Math.min(98, Math.max(2, y)),
        };
      });

      const callouts =
        computedCallouts.length > 0 ? computedCallouts : FALLBACK_CALLOUTS[id] ?? existing?.callouts ?? [];

      mergedMapsMap.set(id, {
        id,
        uuid: rm.uuid,
        name: rm.displayName,
        category: isTdm ? 'tdm' : 'standard',
        sites,
        feature:
          MAP_FEATURES_TH[id] ??
          existing?.feature ??
          (isTdm ? 'Team Deathmatch · ปะทะเร็ว 5v5' : `${sites.length} ไซท์ (${sites.join('/')}) · แผนที่ยุทธวิธี`),
        displayIcon: rm.displayIcon,
        splash: rm.splash,
        callouts,
        fallbackGeometry: existing?.fallbackGeometry ?? GENERIC_2SITE_GEOMETRY,
      });
    }

    const sortedMaps = Array.from(mergedMapsMap.values()).sort((a, b) => {
      const ia = COMP_PRIORITY.indexOf(a.id);
      const ib = COMP_PRIORITY.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      agents: mergedAgents.length > 0 ? mergedAgents : FALLBACK_AGENTS,
      maps: sortedMaps.length > 0 ? sortedMaps : FALLBACK_MAPS,
      live: true,
    };
  } catch {
    return {
      agents: FALLBACK_AGENTS,
      maps: FALLBACK_MAPS,
      live: false,
    };
  }
}
