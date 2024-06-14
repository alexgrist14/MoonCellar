import axios from "axios";
import { LoginDto, SignUpDto } from "../types/auth";
import { API_URL } from "../constants";

export const signup = async (signUpDto: SignUpDto): Promise<void> => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/signup`,
      signUpDto,
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Credentials": true,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.message);
    } else {
      throw new Error("SignUp failed");
    }
  }
};

export const login = async (loginDto: LoginDto): Promise<void> => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      loginDto,
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Credentials": true,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.message);
    } else {
      throw new Error("Login failed");
    }
  }
};
