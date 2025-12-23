import axios from "axios";

export const axiosInstance = axios.create({
  // baseURL: "https://api.studyhub.io.vn/api", 
  baseURL: "http://localhost:6789/api", 
  withCredentials: true, // send cookies to the server
});

export const axiosMessageErrorHandler = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "Server hiện không phản hồi";
  } else {
    return "Unexpected error occurred";
  }
};
