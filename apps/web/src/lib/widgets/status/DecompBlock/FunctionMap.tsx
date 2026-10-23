"use client";

import { FC, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { DECOMP_MAP_CELLS, IDecompUnit } from "@mooncellar/schemas";
import { useDecompFunctionsQuery } from "@/src/lib/entities/project/api";
import styles from "./DecompBlock.module.scss";

const MAX_HEIGHT = 360;
const MIN_CELL = 2;
const TIP_WIDTH = 320;
const TIP_OFFSET = 14;

/** The map's cell states in legend order: what each letter of `map` means and its color. */
export const MAP_CELL_STATES = [
  {
    cell: DECOMP_MAP_CELLS.done,
    label: "Done in main",
    token: "--color-positive",
  },
  {
    cell: DECOMP_MAP_CELLS.pending,
    label: "Done in a branch",
    token: "--status-pending-color",
  },
  { cell: DECOMP_MAP_CELLS.claimed, label: "Claimed", token: "--color-accent" },
  {
    cell: DECOMP_MAP_CELLS.todo,
    label: "Not started",
    token: "--color-bg-tertiary",
  },
];

const STATE_BY_CELL = Object.fromEntries(
  MAP_CELL_STATES.map((state) => [state.cell, state])
);

const getMapGeometry = (width: number, cells: number, maxCell: number) => {
  const fit = Math.floor(Math.sqrt((width * MAX_HEIGHT) / Math.max(cells, 1)));
  const gap = fit > 5 ? 2 : 1;
  const cell = Math.max(MIN_CELL, Math.min(maxCell, fit - gap));
  const columns = Math.max(1, Math.floor((width + gap) / (cell + gap)));
  const rows = Math.ceil(cells / columns);
  return { cell, gap, columns, height: Math.max(rows * (cell + gap) - gap, 0) };
};

export type IFunctionMapOrder = "status" | "address";

/** Display position -> position in `map` (address order); grouped by state, stable inside. */
const getStatusOrder = (map: string) => {
  const rank = Object.fromEntries(
    MAP_CELL_STATES.map(({ cell }, index) => [cell, index])
  );
  const last = MAP_CELL_STATES.length;
  return Array.from(map, (_, index) => index).sort(
    (a, b) => (rank[map[a]] ?? last) - (rank[map[b]] ?? last) || a - b
  );
};

const formatAddress = (address: number) =>
  `0x${address.toString(16).padStart(8, "0")}`;

interface ITip {
  index: number;
  x: number;
  y: number;
  isAbove: boolean;
  isPinned: boolean;
}

interface IFunctionMapProps {
  slug: string;
  map: string;
  units: IDecompUnit[];
  order: IFunctionMapOrder;
}

export const FunctionMap: FC<IFunctionMapProps> = ({
  slug,
  map,
  units,
  order,
}) => {
  const positions = useMemo(
    () => (order === "status" ? getStatusOrder(map) : null),
    [map, order]
  );
  const { width = 0, ref } = useResizeDetector({ handleHeight: false });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geometryRef = useRef({ cell: 0, gap: 0, columns: 1, height: 0 });
  const [tip, setTip] = useState<ITip | null>(null);
  const [wantsFunctions, setWantsFunctions] = useState(false);
  const { data: catalog, isLoading } = useDecompFunctionsQuery(
    slug,
    wantsFunctions
  );
  const functions =
    catalog && catalog.functions.length === map.length ? catalog : undefined;
  const unitsById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit])),
    [units]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    const style = getComputedStyle(canvas);
    const maxCell =
      parseFloat(style.getPropertyValue("--status-map-cell")) || 9;
    const geometry = getMapGeometry(width, map.length, maxCell);
    const { cell, gap, columns, height } = geometry;
    geometryRef.current = geometry;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const probe = document.createElement("span");
    canvas.parentElement?.appendChild(probe);
    const colors = Object.fromEntries(
      MAP_CELL_STATES.map(({ cell: key, token }) => {
        probe.style.color = `var(${token})`;
        return [key, getComputedStyle(probe).color];
      })
    );
    probe.remove();
    for (let index = 0; index < map.length; index++) {
      const value = map[positions ? positions[index] : index];
      context.fillStyle = colors[value] ?? colors[DECOMP_MAP_CELLS.todo];
      context.fillRect(
        (index % columns) * (cell + gap),
        Math.floor(index / columns) * (cell + gap),
        cell,
        cell
      );
    }
  }, [map, positions, width]);

  useEffect(() => setTip(null), [order, map]);

  useEffect(() => {
    if (!tip?.isPinned) return;
    const close = (event: globalThis.PointerEvent) => {
      if (event.target !== canvasRef.current) setTip(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [tip?.isPinned]);

  const showAt = (
    event: PointerEvent<HTMLCanvasElement>,
    isPinned: boolean
  ) => {
    setWantsFunctions(true);
    const { cell, gap, columns, height } = geometryRef.current;
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    const column = Math.floor(x / (cell + gap));
    const display = Math.floor(y / (cell + gap)) * columns + column;
    if (column >= columns || display < 0 || display >= map.length) {
      if (!isPinned) setTip(null);
      return;
    }
    setTip({
      index: positions ? positions[display] : display,
      x:
        x + TIP_OFFSET + TIP_WIDTH > width
          ? Math.max(0, x - TIP_OFFSET - TIP_WIDTH)
          : x + TIP_OFFSET,
      y,
      isAbove: y > height / 2,
      isPinned,
    });
  };

  const count = (key: string) => map.split(key).length - 1;
  const fn = tip ? functions?.functions[tip.index] : undefined;
  const cell = tip ? map[tip.index] : undefined;
  const file = fn ? functions?.units[fn[2]] : undefined;
  const owner =
    file && cell !== DECOMP_MAP_CELLS.done
      ? unitsById.get(file)?.claimedBy
      : undefined;

  return (
    <div ref={ref} className={styles.map}>
      <canvas
        ref={canvasRef}
        className={styles.map__canvas}
        role="img"
        aria-label={`${map.length} functions ${order === "status" ? "grouped by status" : "in address order"}: ${count(DECOMP_MAP_CELLS.done)} done in main, ${count(DECOMP_MAP_CELLS.pending)} done in a branch, ${count(DECOMP_MAP_CELLS.claimed)} claimed`}
        onPointerMove={(event) => {
          if (event.pointerType === "mouse") showAt(event, false);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setTip(null);
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse") showAt(event, true);
        }}
      />
      {tip && (
        <div
          className={styles.map__tip}
          style={{
            left: tip.x,
            ...(tip.isAbove
              ? { bottom: `calc(100% - ${tip.y - TIP_OFFSET}px)` }
              : { top: tip.y + TIP_OFFSET }),
          }}
          aria-hidden
        >
          {fn ? (
            <b className={styles.map__tipName}>{fn[3]}</b>
          ) : (
            <span className={styles.map__tipMuted}>
              {isLoading ? "Loading names…" : "No function names uploaded"}
            </span>
          )}
          <span className={styles.map__tipMeta}>
            {fn && `${formatAddress(fn[0])} · ${fn[1]} bytes · `}
            {(cell && STATE_BY_CELL[cell]?.label) ?? "Not started"}
            {owner && ` · ${owner}`}
          </span>
          {file && <span className={styles.map__tipFile}>{file}</span>}
        </div>
      )}
    </div>
  );
};
