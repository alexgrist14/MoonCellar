import { AxiosError } from "axios";
import { CSSProperties, FC } from "react";

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

export type ISvgColors =
  | "primary"
  | "secondary"
  | "accent"
  | "positive"
  | "negative"
  | "attention";
export interface ICommonProps {
  className?: string;
  style?: CSSProperties;
}

export type FCCLS = FC<ICommonProps>;

export type FCCLSC = FC<
  ICommonProps & {
    color?: ISvgColors;
  }
>;
