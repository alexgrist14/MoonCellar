import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`;

const sparklePath = (cx: number, cy: number, r: number) => {
  const c = r * 0.3;

  return `M${cx} ${cy - r}C${cx} ${cy - c} ${cx + c} ${cy} ${cx + r} ${cy}C${cx + c} ${cy} ${cx} ${cy + c} ${cx} ${cy + r}C${cx} ${cy + c} ${cx - c} ${cy} ${cx - r} ${cy}C${cx - c} ${cy} ${cx} ${cy - c} ${cx} ${cy - r}z`;
};

const MOON: [number, number, number] = [100, 100, 52];

const CRATERS: [number, number, number][] = [
  [74, 78, 11],
  [124, 116, 7.5],
  [84, 124, 5],
  [126, 76, 4],
];

const SPARKLES: [number, number, number][] = [
  [170, 62, 7],
  [30, 56, 5],
  [38, 114, 3.5],
  [172, 138, 4],
  [48, 168, 4.5],
  [110, 24, 3.5],
];

export const SvgEmptyList: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 200 200">
      <Path d={circlePath(...MOON)} opacity={0.06} />
      <Path
        d={circlePath(...MOON)}
        type="stroke"
        strokeWidth={2}
        opacity={0.2}
      />
      {CRATERS.map(([cx, cy, r]) => (
        <Path key={`${cx}-${cy}`} d={circlePath(cx, cy, r)} opacity={0.1} />
      ))}
      {SPARKLES.map(([cx, cy, r]) => (
        <Path key={`${cx}-${cy}`} d={sparklePath(cx, cy, r)} opacity={0.45} />
      ))}
    </Svg>
  );
};
