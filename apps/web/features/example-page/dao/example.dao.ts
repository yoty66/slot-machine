import type { getExample_ResponseBody } from "@repo/network/example/getExample";
import type { AxiosResponse } from "axios";
import getAxiosInstance from "@/capabilities/data-fetching/axiosInstanceFactory";

const axios = getAxiosInstance();

export function getExample(): Promise<AxiosResponse<getExample_ResponseBody>> {
  return axios.get<getExample_ResponseBody>("/api/example");
}
