import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSession, useRoll, useCashout } from "../dao/slot.queries";

vi.mock("../dao/slot.dao", () => ({
  getSession: vi.fn(),
  postRoll: vi.fn(),
  postCashout: vi.fn(),
}));

import { getSession, postRoll, postCashout } from "../dao/slot.dao";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetches session and returns credits", async () => {
    vi.mocked(getSession).mockResolvedValue({
      data: { credits: 10 },
    } as never);

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ credits: 10 });
    expect(getSession).toHaveBeenCalledOnce();
  });

  test("surfaces error when fetch fails", async () => {
    vi.mocked(getSession).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("useRoll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls postRoll and returns roll result", async () => {
    const rollResponse = {
      symbols: ["C", "C", "C"],
      credits: 19,
      isWin: true,
      reward: 10,
    };
    vi.mocked(postRoll).mockResolvedValue({ data: rollResponse } as never);

    const { result } = renderHook(() => useRoll(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(rollResponse);
    expect(postRoll).toHaveBeenCalledOnce();
  });

  test("surfaces error when roll fails", async () => {
    vi.mocked(postRoll).mockRejectedValue(new Error("Bad request"));

    const { result } = renderHook(() => useRoll(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  test("does not update session cache on success", async () => {
    vi.mocked(getSession).mockResolvedValue({
      data: { credits: 10 },
    } as never);
    vi.mocked(postRoll).mockResolvedValue({
      data: {
        symbols: ["L", "L", "L"],
        credits: 29,
        isWin: true,
        reward: 20,
      },
    } as never);

    const wrapper = createWrapper();

    // First, populate session cache
    const { result: sessionResult } = renderHook(() => useSession(), {
      wrapper,
    });
    await waitFor(() => expect(sessionResult.current.isSuccess).toBe(true));
    expect(sessionResult.current.data?.credits).toBe(10);

    // Then, roll
    const { result: rollResult } = renderHook(() => useRoll(), { wrapper });
    rollResult.current.mutate();
    await waitFor(() => expect(rollResult.current.isSuccess).toBe(true));

    // Session cache should NOT be updated by DAO layer hook
    // (Credits are managed by higher-level hooks)
    expect(sessionResult.current.data?.credits).toBe(10);
  });
});

describe("useCashout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls postCashout and returns result", async () => {
    const cashoutResponse = {
      credits: 15,
      message: "Cashed out successfully",
    };
    vi.mocked(postCashout).mockResolvedValue({
      data: cashoutResponse,
    } as never);

    const { result } = renderHook(() => useCashout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(cashoutResponse);
    expect(postCashout).toHaveBeenCalledOnce();
  });

  test("surfaces error when cashout fails", async () => {
    vi.mocked(postCashout).mockRejectedValue(new Error("Bad request"));

    const { result } = renderHook(() => useCashout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  test("does not modify session cache on success", async () => {
    vi.mocked(getSession).mockResolvedValue({
      data: { credits: 10 },
    } as never);
    vi.mocked(postCashout).mockResolvedValue({
      data: { credits: 10, message: "Cashed out successfully" },
    } as never);

    const wrapper = createWrapper();

    // Populate session cache
    const { result: sessionResult } = renderHook(() => useSession(), {
      wrapper,
    });
    await waitFor(() => expect(sessionResult.current.isSuccess).toBe(true));

    // Cashout
    const { result: cashoutResult } = renderHook(() => useCashout(), {
      wrapper,
    });
    cashoutResult.current.mutate();
    await waitFor(() => expect(cashoutResult.current.isSuccess).toBe(true));

    // Session cache stays intact — page uses cashoutMutation.isSuccess for UI
    expect(sessionResult.current.data?.credits).toBe(10);
  });
});
