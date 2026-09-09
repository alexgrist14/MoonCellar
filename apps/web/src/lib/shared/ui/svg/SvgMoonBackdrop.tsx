import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

const round = (value: number) => Math.round(value * 100) / 100;

const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`;

const crescentPath = (
  cx: number,
  cy: number,
  r: number,
  width: number,
  angle: number
) => {
  const rad = (angle * Math.PI) / 180;
  const ox = -Math.cos(rad) * width;
  const oy = -Math.sin(rad) * width;
  const offset = width / 2;
  const half = Math.sqrt(r * r - offset * offset);
  const ux = ox / width;
  const uy = oy / width;
  const bx = cx + offset * ux;
  const by = cy + offset * uy;
  const startX = round(bx - uy * half);
  const startY = round(by + ux * half);
  const endX = round(bx + uy * half);
  const endY = round(by - ux * half);

  return `M${startX} ${startY}A${r} ${r} 0 1 1 ${endX} ${endY}A${r} ${r} 0 0 0 ${startX} ${startY}z`;
};

const sparklePath = (cx: number, cy: number, r: number) => {
  const c = r * 0.3;

  return `M${cx} ${cy - r}C${cx} ${cy - c} ${cx + c} ${cy} ${cx + r} ${cy}C${cx + c} ${cy} ${cx} ${cy + c} ${cx} ${cy + r}C${cx} ${cy + c} ${cx - c} ${cy} ${cx - r} ${cy}C${cx - c} ${cy} ${cx} ${cy - c} ${cx} ${cy - r}z`;
};

const MOON: [number, number, number] = [100, 82, 58];

const LIGHT_ANGLE = -45;

const SPARKLES: [number, number, number][] = [
  [26, 44, 6],
  [174, 40, 5],
  [22, 120, 4.5],
  [178, 128, 4],
  [40, 170, 3.5],
  [162, 168, 3.5],
  [30, 82, 3.5],
  [172, 88, 4],
];

export const SvgMoonBackdrop: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 200 200">
      <Path d={circlePath(...MOON)} opacity={0.07} />
      <Path
        d={circlePath(...MOON)}
        type="stroke"
        strokeWidth={2}
        opacity={0.1}
      />
      <Path d={crescentPath(...MOON, 20, LIGHT_ANGLE)} opacity={0.14} />
      <Path d={crescentPath(...MOON, 7, LIGHT_ANGLE)} opacity={0.45} />
      {SPARKLES.map(([cx, cy, r]) => (
        <Path key={`${cx}-${cy}`} d={sparklePath(cx, cy, r)} opacity={0.45} />
      ))}
    </Svg>
  );
};
