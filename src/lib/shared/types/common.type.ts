import { AxiosError } from "axios";

export interface INavigationLink {
  title: string;
  link?: string;
  callback?: () => void;
  target?: string;
}

export interface IErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export type IAxiosErrorResponse = AxiosError<IErrorResponse>;

export interface IImageData {
  imageMeta: HTMLImageElement;
  imageAR: number;
  imageBlob: Blob;
  imageBuffer: ArrayBuffer;
}
