export const getScreenWidth = () => {
  if (typeof window === "undefined") return 0;
  return window.innerWidth;
};

export const mediaMax = (max: number) => max >= getScreenWidth();
export const mediaMin = (min: number) => min < getScreenWidth();
