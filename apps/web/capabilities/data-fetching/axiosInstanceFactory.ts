import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL must be set");
}

export default function getAxiosInstance() {
  const baseURL =
    process.env.NEXT_PUBLIC_API_URL ;
  const axiosBase = axios.create({
    baseURL,
    withCredentials: true,
  });

  axiosBase.interceptors.response.use(undefined, (error) => {
    if (error.response?.status === 401) {
      // Optional: redirect to auth when implemented
      // window.location.href = "/auth/unauthorized";
    }
    return Promise.reject(error);
  });
  return axiosBase;
}
