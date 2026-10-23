"use client";

import { FC, useEffect, useMemo, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { DECOMP_MAP_CELLS } from "@mooncellar/schemas";
import styles from "./DecompBlock.module.scss";

const MAX_HEIGHT = 360;
const MIN_CELL = 2;

const CELL_COLORS: Record<string, string> = {
  [DECOMP_MAP_CELLS.done]: "--color-positive",
  [DECOMP_MAP_CELLS.pending]: "--status-pending-color",
  [DECOMP_MAP_CELLS.claimed]: "--color-accent",
  [DECOMP_MAP_CELLS.todo]: "--color-bg-tertiary",
};

const getMapGeometry = (width: number, cells: number, maxCell: number) => {
  const fit = Math.floor(Math.sqrt((width * MAX_HEIGHT) / Math.max(cells, 1)));
  const gap = fit > 5 ? 2 : 1;
  const cell = Math.max(MIN_CELL, Math.min(maxCell, fit - gap));
  const columns = Math.max(1, Math.floor((width + gap) / (cell + gap)));
  const rows = Math.ceil(cells / columns);
  return { cell, gap, columns, height: Math.max(rows * (cell + gap) - gap, 0) };
};

export type IFunctionMapOrder = "status" | "address";

const STATUS_ORDER = [
  DECOMP_MAP_CELLS.done,
  DECOMP_MAP_CELLS.pending,
  DECOMP_MAP_CELLS.claimed,
  DECOMP_MAP_CELLS.todo,
];

const byStatus = (map: string) =>
  STATUS_ORDER.map((cell) => cell.repeat(map.split(cell).length - 1)).join("");

interface IFunctionMapProps {
  map: string;
  order: IFunctionMapOrder;
}

export const FunctionMap: FC<IFunctionMapProps> = ({ map: source, order }) => {
  const map = useMemo(
    () => (order === "status" ? byStatus(source) : source),
    [source, order]
  );
  const { width = 0, ref } = useResizeDetector({ handleHeight: false });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    const style = getComputedStyle(canvas);
    const maxCell =
      parseFloat(style.getPropertyValue("--status-map-cell")) || 9;
    const { cell, gap, columns, height } = getMapGeometry(
      width,
      map.length,
      maxCell
    );
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
      Object.entries(CELL_COLORS).map(([key, token]) => {
        probe.style.color = `var(${token})`;
        return [key, getComputedStyle(probe).color];
      })
    );
    probe.remove();
    for (let index = 0; index < map.length; index++) {
      context.fillStyle = colors[map[index]] ?? colors[DECOMP_MAP_CELLS.todo];
      context.fillRect(
        (index % columns) * (cell + gap),
        Math.floor(index / columns) * (cell + gap),
        cell,
        cell
      );
    }
  }, [map, width]);

  const count = (key: string) => map.split(key).length - 1;

  return (
    <div ref={ref} className={styles.map}>
      <canvas
        ref={canvasRef}
        className={styles.map__canvas}
        role="img"
        aria-label={`${map.length} functions ${order === "status" ? "grouped by status" : "in address order"}: ${count(DECOMP_MAP_CELLS.done)} done in main, ${count(DECOMP_MAP_CELLS.pending)} done in a branch, ${count(DECOMP_MAP_CELLS.claimed)} claimed`}
      />
    </div>
  );
};
