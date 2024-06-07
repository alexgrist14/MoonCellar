export interface IGame {
  _id?: string;
  id: number;
  name: string;
  url: string;
  image: string;
  platforms: (number | string)[];
  achievements?: number;
}
