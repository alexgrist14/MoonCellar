export const formatHltbHours = (hours?: number | null): string | null => {
  if (hours == null || hours <= 0) {
    return null;
  }

  const whole = Math.floor(hours);
  const fraction = hours - whole;

  if (Math.abs(fraction - 0.5) < 0.01) {
    return whole > 0 ? `${whole}½ Hours` : "½ Hour";
  }

  const rounded = Math.round(hours * 10) / 10;
  const label = rounded === 1 ? "Hour" : "Hours";

  return `${rounded} ${label}`;
};
