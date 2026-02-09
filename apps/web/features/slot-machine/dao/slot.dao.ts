import type { AxiosResponse } from "axios";
import type { getSession_ResponseBody } from "@repo/network/session/getSession";
import type { postRoll_ResponseBody } from "@repo/network/slot/postRoll";
import type { postCashout_ResponseBody } from "@repo/network/slot/postCashout";
import getAxiosInstance from "@/capabilities/data-fetching/axiosInstanceFactory";

const axios = getAxiosInstance();

export function getSession(): Promise<AxiosResponse<getSession_ResponseBody>> {
  return axios.get<getSession_ResponseBody>("/api/slot/session");
}

export function postRoll(): Promise<AxiosResponse<postRoll_ResponseBody>> {
  return axios.post<postRoll_ResponseBody>("/api/slot/roll");
}

export function postCashout(): Promise<AxiosResponse<postCashout_ResponseBody>> {
  return axios.post<postCashout_ResponseBody>("/api/slot/cashout");
}
