import { API_URL } from "../constants";
import { IGetFileRequest, IGetFileResponse } from "../lib/schemas/files.schema";
import agent from "./agent.api";

const FILES_API = `${API_URL}/file`;

const getFile = (params: IGetFileRequest) => {
  return agent.get<IGetFileResponse>(`${FILES_API}/`, {
    params,
  });
};

const uploadObject = (object: string, key: string, bucketName: string) => {
  return agent.post<string>(`${FILES_API}/object`, undefined, {
    params: { key, bucketName, object },
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const uploadFile = (file: File, key: string, bucketName: string) => {
  const formData = new FormData();

  formData.append("file", file);

  return agent.post<string>(`${FILES_API}/`, formData, {
    params: { key, bucketName },
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const deleteFile = (key: string, bucketName: string) => {
  return agent.delete(`${FILES_API}/`, {
    params: { key, bucketName },
  });
};

const deleteFiles = (keys: string[], bucketName: string) => {
  return agent.delete(`${FILES_API}/multi`, {
    params: { keys, bucketName },
  });
};

const getBuckets = () => {
  return agent.get<string[]>(`${FILES_API}/buckets`);
};

const getBucketKeys = (bucketName: string, prefix?: string) => {
  return agent.get<string[]>(`${FILES_API}/bucket-keys`, {
    params: { bucketName, prefix },
  });
};

const clearBucket = (bucketName: string) => {
  return agent.delete(`${FILES_API}/clear-bucket`, {
    params: { bucketName },
  });
};

export const filesAPI = {
  getFile,
  uploadFile,
  deleteFile,
  deleteFiles,
  getBuckets,
  getBucketKeys,
  clearBucket,
  uploadObject,
};
