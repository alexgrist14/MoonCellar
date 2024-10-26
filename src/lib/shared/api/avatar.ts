import axios from "axios"
import { API_URL } from "../constants"

export const addAvatar = async (id: string, file: File): Promise<any>=>{
const response = await axios.post(`${API_URL}/user/${id}/profile-picture`,file,{
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Credentials": true,
    },
    withCredentials: true,
  })
  return response.data
}