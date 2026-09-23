import { DragEvent, useState } from "react";
import { moveItem } from "@/src/lib/shared/utils/common.utils";

export const useDragSort = <T>(items: T[], onChange: (items: T[]) => void) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const getItemProps = (index: number) => ({
    draggable: true,
    onDragStart: () => setDragIndex(index),
    onDragEnd: reset,
    onDragEnter: () => setOverIndex(index),
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node)) return;

      setOverIndex((current) => (current === index ? null : current));
    },
    onDragOver: (event: DragEvent<HTMLElement>) => event.preventDefault(),
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();

      if (dragIndex !== null) onChange(moveItem(items, dragIndex, index));

      reset();
    },
  });

  return {
    dragIndex,
    overIndex: overIndex === dragIndex ? null : overIndex,
    getItemProps,
  };
};
