import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:6789/api",
  withCredentials: true, // send cookies to the server
});
