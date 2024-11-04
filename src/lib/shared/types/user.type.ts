export type categoriesType =
  | 'completed'
  | 'wishlist'
  | 'dropped'
  | 'playing'
  | 'backlog';

export interface ILogs {
  date: Date;
  action: string;
  isAdd: boolean;
  rating?: number;
  gameId: number;
}
