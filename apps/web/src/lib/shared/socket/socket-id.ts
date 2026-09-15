let currentSocketId: string | undefined;

export const getSocketId = () => currentSocketId;

export const setSocketId = (socketId?: string) => {
  currentSocketId = socketId;
};
