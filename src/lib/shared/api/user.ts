import axios from "axios";
import { IUser } from "../types/auth";
import { API_URL } from "../constants";

export const getUserById = async (id: string): Promise<IUser> => {
  try {
    const response = await axios.get(`${API_URL}/user/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": true,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (err: any) {
    throw new Error(err.response.data.message);
  }
};

export const getUserByName = async (name:string):Promise<IUser>=>{
  try{
    const response = await axios.get(`${API_URL}/user/name?name=${name}`, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": true,
      },
      withCredentials: true,
    });
    return response.data;
  }catch (err: any) {
    throw new Error(err.response.data.message);
  }
}
