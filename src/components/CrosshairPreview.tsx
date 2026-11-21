import { useMemo } from 'react';
import { CrosshairLineSettings, parseCrosshairCode } from '../utils/crosshairCode';

interface CrosshairPreviewProps {
  code: string;
  /** Half-width of the visible area in in-game pixels. */
  viewRadius?: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function armRects(line: CrosshairLineSettings): Rect[] {
  if (!line.show) return [];
  const { thickness: t, length, verticalLength, offset } = line;
  const rects: Rect[] = [];
  if (length > 0 && t > 0) {
    rects.push({ x: offset, y: -t / 2, width: length, height: t });
    rects.push({ x: -offset - length, y: -t / 2, width: length, height: t });
  }
  if (verticalLength > 0 && t > 0) {
    rects.push({ x: -t / 2, y: -offset - verticalLength, width: t, height: verticalLength });
    rects.push({ x: -t / 2, y: offset, width: t, height: verticalLength });
  }
  return rects;
}

export function CrosshairPreview({ code, viewRadius = 32 }: CrosshairPreviewProps) {
  const crosshair = useMemo(() => parseCrosshairCode(code), [code]);
  const outline = crosshair.outlines ? crosshair.outlineThickness : 0;

  const layers: { rects: Rect[]; opacity: number }[] = [
    { rects: armRects(crosshair.outer), opacity: crosshair.outer.opacity },
    { rects: armRects(crosshair.inner), opacity: crosshair.inner.opacity },
  ];

  if (crosshair.centerDot) {
    const z = crosshair.dotThickness;
    layers.push({
      rects: [{ x: -z / 2, y: -z / 2, width: z, height: z }],
      opacity: crosshair.dotOpacity,
    });
  }

  return (
    <svg
      viewBox={`${-viewRadius} ${-viewRadius} ${viewRadius * 2} ${viewRadius * 2}`}
      className="h-full w-full"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {layers.map((layer, layerIndex) => (
        <g key={layerIndex}>
          {outline > 0 &&
            layer.rects.map((r, i) => (
              <rect
                key={`o-${i}`}
                x={r.x - outline}
                y={r.y - outline}
                width={r.width + outline * 2}
                height={r.height + outline * 2}
                fill="#000"
                opacity={crosshair.outlineOpacity * layer.opacity}
              />
            ))}
          {layer.rects.map((r, i) => (
            <rect
              key={`f-${i}`}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              fill={crosshair.color}
              opacity={layer.opacity}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
