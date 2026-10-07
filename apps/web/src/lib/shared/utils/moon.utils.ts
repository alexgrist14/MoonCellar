const DAY_MS = 86_400_000;
const SYNODIC_MONTH_DAYS = 29.530588853;
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

const PHASE_NAMES = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
];

export const getMoonPhase = (timestampMs: number): number => {
  const cycles =
    (timestampMs - REFERENCE_NEW_MOON_MS) / DAY_MS / SYNODIC_MONTH_DAYS;

  return cycles - Math.floor(cycles);
};

export const getMoonPhaseName = (phase: number): string =>
  PHASE_NAMES[Math.round(phase * PHASE_NAMES.length) % PHASE_NAMES.length];

export const getMoonLitPath = (phase: number, radius: number): string => {
  const terminator = Math.cos(2 * Math.PI * phase);
  const terminatorRadius = (Math.abs(terminator) * radius).toFixed(3);
  const isWaxing = phase < 0.5;
  const limbSweep = isWaxing ? 1 : 0;
  const terminatorSweep = terminator > 0 === isWaxing ? 0 : 1;

  return `M0,${-radius} A${radius},${radius} 0 0 ${limbSweep} 0,${radius} A${terminatorRadius},${radius} 0 0 ${terminatorSweep} 0,${-radius} Z`;
};
