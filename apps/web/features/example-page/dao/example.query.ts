"use client";
import { useQuery } from "@tanstack/react-query";
import { getExample } from "./example.dao";

export function useGetExample() {
  return useQuery({
    queryKey: ["example"],
    queryFn: async () => {
      const res = await getExample();
      return res.data;
    },
  });
}
