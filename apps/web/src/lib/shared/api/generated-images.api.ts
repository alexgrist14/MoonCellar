import {
  IGenerateImageRequest,
  IGenerateImageResponse,
  IGeneratedImage,
  ISaveGeneratedImageRequest,
  ISuggestImageElementsRequest,
  ISuggestImageElementsResponse,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const IMAGES_URL = `${API_URL}/admin/images`;

const list = () => {
  return agent.get<IGeneratedImage[]>(IMAGES_URL);
};

const generate = (data: IGenerateImageRequest) => {
  return agent.post<IGenerateImageResponse>(`${IMAGES_URL}/generate`, data);
};

const suggestElements = (data: ISuggestImageElementsRequest) => {
  return agent.post<ISuggestImageElementsResponse>(
    `${IMAGES_URL}/elements`,
    data
  );
};

const save = (data: ISaveGeneratedImageRequest) => {
  return agent.post<IGeneratedImage>(IMAGES_URL, data);
};

const remove = (id: string) => {
  return agent.delete<{ _id: string }>(`${IMAGES_URL}/${id}`);
};

export const generatedImagesApi = {
  list,
  generate,
  suggestElements,
  save,
  remove,
};
