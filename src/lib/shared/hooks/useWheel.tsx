import { useCallback } from "react";
import { IGDBGameMinimal } from "../types/igdb";
import { getImageLink } from "../constants";
import { createImage } from "../utils/image";

export const useWheel = ({
  contrastColor = "white",
  fontFamily = "pentagra",
  primaryColor = "black",
  size = 290,
}: {
  primaryColor?: string;
  contrastColor?: string;
  fontFamily?: string;
  size?: number;
}) => {
  const drawWheel = useCallback(
    (images: HTMLImageElement[], wheelGames: IGDBGameMinimal[]) => {
      const canvas = document.getElementById(
        "wheel-canvas"
      ) as HTMLCanvasElement;
      const wheel = document.getElementById("wheel") as HTMLCanvasElement;

      const X = !!canvas ? canvas.width / 2 : undefined;
      const Y = !!canvas ? canvas.height / 2 : undefined;
      const ctx = !!canvas ? canvas.getContext("2d") : undefined;

      if (!wheelGames?.length || !ctx || !X || !Y) return;

      const generateRandomColors = (hue: number): string[] => {
        return (
          wheelGames?.map((_, i) => {
            const min = 10;
            const percent =
              i <= wheelGames.length / 2
                ? (70 / wheelGames.length) * i
                : (70 / wheelGames.length) * (wheelGames.length - i + 1);

            const lightness = (percent > min ? percent : min) + "%";
            const saturation = "60%";

            return `hsl(${hue}, ${saturation}, ${lightness})`;
          }) || []
        );
      };

      const segColors = generateRandomColors((200 + Math.random() * 30) ^ 0);

      const drawSegment = ({
        key,
        angle,
        lastAngle,
      }: {
        key: number;
        lastAngle: number;
        angle: number;
      }) => {
        const value = wheelGames[key].name;
        const text =
          value?.length > 19 ? value.slice(0, 20) + "..." : value || "";

        const pattern = !!images[key]
          ? ctx.createPattern(images[key], "no-repeat")
          : undefined;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(X, Y);
        ctx.arc(X, Y, size, lastAngle, angle, false);
        ctx.lineTo(X, Y);
        ctx.closePath();
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = pattern || segColors[key];
        ctx.fill();
        ctx.lineWidth = 0.4;
        ctx.save();
        ctx.translate(X, Y);
        ctx.rotate((lastAngle + angle) / 2);
        ctx.fillStyle = contrastColor;
        ctx.fillText(text, size / 2 + 20, 0);
        ctx.strokeStyle = primaryColor;
        ctx.strokeText(text, size / 2 + 20, 0);
        ctx.restore();
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const len = wheelGames.length;
      const PI2 = Math.PI * 2;

      let lastAngle = 0;
      console.log(canvas.width);

      canvas.width = wheel.getBoundingClientRect().width;
      canvas.height = wheel.getBoundingClientRect().height;

      ctx.lineWidth = 1;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "20px " + fontFamily;

      for (let i = 1; i <= len; i++) {
        const angle = PI2 * (i / len);

        drawSegment({ key: i - 1, lastAngle, angle });

        lastAngle = angle;
      }

      ctx.beginPath();
      ctx.arc(X, Y, size, 0, PI2, false);
      ctx.closePath();

      ctx.lineWidth = 3;
      ctx.strokeStyle = primaryColor;
      ctx.stroke();
    },
    [contrastColor, primaryColor, fontFamily, size]
  );

  const parseImages = useCallback(async (wheelGames: IGDBGameMinimal[]) => {
    const queries: Promise<HTMLImageElement>[] = [];

    wheelGames.forEach((game) => {
      const cover = !!game?.cover?.url
        ? getImageLink(game.cover.url, "720p")
        : "";

      queries.push(createImage(cover));
    });

    return Promise.all(queries);
  }, []);

  return { drawWheel, parseImages };
};
