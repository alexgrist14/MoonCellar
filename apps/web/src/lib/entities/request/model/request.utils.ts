import { IContentRequest } from "@mooncellar/schemas";

export const getRequestTitle = (request: IContentRequest) =>
  request.targetName ??
  (typeof request.payload.name === "string" ? request.payload.name : "Untitled");
