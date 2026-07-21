export const generateWheelColors = (
  count: number,
  hue: number = (200 + Math.random() * 30) ^ 0
): string[] => {
  const min = 10;
  const saturation = "60%";

  return Array.from({ length: count }, (_, i) => {
    const percent =
      i <= count / 2 ? (70 / count) * i : (70 / count) * (count - i + 1);

    const lightness = (percent > min ? percent : min) + "%";

    return `hsl(${hue}, ${saturation}, ${lightness})`;
  });
};
