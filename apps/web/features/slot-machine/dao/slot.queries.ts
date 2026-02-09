"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { postRoll_ResponseBody } from "@repo/network/slot/postRoll";
import type { postCashout_ResponseBody } from "@repo/network/slot/postCashout";
import { getSession, postRoll, postCashout } from "./slot.dao";

const SESSION_QUERY_KEY = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const res = await getSession();
      return res.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
}

export function useRoll() {
  return useMutation<postRoll_ResponseBody>({
    mutationFn: async () => {
      const res = await postRoll();
      return res.data;
    },
  });
}

export function useUpdateCredits() {
  const queryClient = useQueryClient();
  return (credits: number) => {
    queryClient.setQueryData(SESSION_QUERY_KEY, { credits });
  };
}

export function useCashout() {
  return useMutation<postCashout_ResponseBody>({
    mutationFn: async () => {
      const res = await postCashout();
      return res.data;
    },
  });
}
