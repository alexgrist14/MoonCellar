export const generateWheelColors = (
  count: number,
  hue: number = (200 + Math.random() * 30) ^ 0
): string[] => {
  const saturation = "60%";
  const lightnessA = "30%";
  const lightnessB = "50%";

  return Array.from({ length: count }, (_, i) => {
    const lightness = i % 2 === 0 ? lightnessA : lightnessB;

    return `hsl(${hue}, ${saturation}, ${lightness})`;
  });
};
