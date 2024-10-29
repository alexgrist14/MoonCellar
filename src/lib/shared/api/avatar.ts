import axios from "axios";
import { API_URL } from "../constants";

export const addAvatar = async (id: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData);
  const response = await axios.post(
    `${API_URL}/user/${id}/profile-picture`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "Access-Control-Allow-Credentials": true,
      },
      withCredentials: true,
    }
  );
  return response.data;
};

export const getAvatar = async (id: string): Promise<{ fileName: string }> => {
    const response = await axios.get(`${API_URL}/user/${id}/profile-picture`, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": true,
      },
      withCredentials: true,
    });
    return response.data;
};
