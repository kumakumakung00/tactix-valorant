import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapCallout, Side } from '../types/tactix';

export const ROTATION_TRANSITION = '500ms cubic-bezier(0.22, 1, 0.36, 1)';

export function normalizeAngle(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/** Snapped rotation (multiple of 90°) that puts the selected side's spawn at the bottom of the screen. */
export function getAutoRotation(callouts: MapCallout[], side: Side): number {
  const atkSpawn = callouts.find((c) => c.group === 'Atk' && c.name === 'Spawn');
  const defSpawn = callouts.find((c) => c.group === 'Def' && c.name === 'Spawn');
  const target = side === 'attack' ? atkSpawn : defSpawn;
  const opposite = side === 'attack' ? defSpawn : atkSpawn;
  if (!target) return side === 'attack' ? -90 : 90;
  const from = opposite ?? { x: 50, y: 50 };
  const theta = (Math.atan2(target.y - from.y, target.x - from.x) * 180) / Math.PI;
  return normalizeAngle(Math.round((90 - theta) / 90) * 90);
}

export function useMapOrientation(callouts: MapCallout[], side: Side, mapId: string) {
  const [manualQuarterTurns, setManualQuarterTurns] = useState(0);

  const autoRotation = useMemo(() => getAutoRotation(callouts, side), [callouts, side]);
  const rotation = normalizeAngle(autoRotation + manualQuarterTurns * 90);

  // Continuous angle for CSS so transitions always take the shortest path.
  const [displayRotation, setDisplayRotation] = useState(rotation);
  useEffect(() => {
    setDisplayRotation((prev) => prev + normalizeAngle(rotation - prev));
  }, [rotation]);

  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;

  useEffect(() => {
    setManualQuarterTurns(0);
  }, [side, mapId]);

  const rotateManually = useCallback(() => {
    setManualQuarterTurns((t) => (t + 1) % 4);
  }, []);

  const isSideways = Math.abs(rotation) % 180 === 90;

  /** Translate (in % of the board) that keeps a focus point centered after rotating. */
  const getCenterOffset = useCallback(
    (centerX: number, centerY: number) => {
      const rad = (rotation * Math.PI) / 180;
      const dx = centerX - 50;
      const dy = centerY - 50;
      return {
        x: -(dx * Math.cos(rad) - dy * Math.sin(rad)),
        y: -(dx * Math.sin(rad) + dy * Math.cos(rad)),
      };
    },
    [rotation]
  );

  const counterRotateSvg = useCallback(
    (x: number, y: number): CSSProperties => ({
      transform: `rotate(${-displayRotation}deg)`,
      transformOrigin: `${x}px ${y}px`,
      transformBox: 'view-box',
      transition: `transform ${ROTATION_TRANSITION}`,
    }),
    [displayRotation]
  );

  const counterRotateHtml: CSSProperties = {
    rotate: `${-displayRotation}deg`,
    transition: `rotate ${ROTATION_TRANSITION}`,
  };

  return {
    rotation,
    displayRotation,
    rotationRef,
    manualQuarterTurns,
    rotateManually,
    isSideways,
    getCenterOffset,
    counterRotateSvg,
    counterRotateHtml,
  };
}
