import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { getSession_ResponseBody } from "@repo/network/session/getSession";
import type { postRoll_ResponseBody } from "@repo/network/slot/postRoll";
import type { postCashout_ResponseBody } from "@repo/network/slot/postCashout";
import SlotMachinePage from "../pages/SlotMachinePage";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

// Mock the hooks module
vi.mock("../dao/slot.queries", () => ({
  useSession: vi.fn(),
  useRoll: vi.fn(),
  useCashout: vi.fn(),
}));

// Mock the custom hooks
vi.mock("../hooks/useRoll", () => ({
  useRoll: vi.fn(),
}));

vi.mock("../hooks/useScreens", () => ({
  useScreens: vi.fn(),
}));

import { useSession, useCashout } from "../dao/slot.queries";
import { useRoll } from "../hooks/useRoll";
import { useScreens } from "../hooks/useScreens";
import { toast } from "sonner";

type MutationResult<T> = {
  mutate: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  data: T | undefined;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
};

function mockUseSession(
  overrides: Partial<UseQueryResult<getSession_ResponseBody>> = {}
) {
  vi.mocked(useSession).mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
    isPending: false,
    status: "pending",
    fetchStatus: "idle",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    isFetched: false,
    isFetchedAfterMount: false,
    isRefetching: false,
    isStale: true,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isPlaceholderData: false,
    refetch: vi.fn(),
    ...overrides,
  } as UseQueryResult<getSession_ResponseBody>);
}

function createMockMutation<T>(
  overrides: Partial<MutationResult<T>> = {}
): MutationResult<T> {
  return {
    mutate: vi.fn(),
    reset: vi.fn(),
    data: undefined,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

describe("SlotMachinePage", () => {
  let mockRollMutation: MutationResult<postRoll_ResponseBody>;
  let mockCashoutMutation: MutationResult<postCashout_ResponseBody>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRollMutation = createMockMutation<postRoll_ResponseBody>();
    mockCashoutMutation = createMockMutation<postCashout_ResponseBody>();

    // Mock useRoll hook from hooks/useRoll
    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: [null, null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 10,
      isSpinning: false,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);

    // Mock useScreens hook
    vi.mocked(useScreens).mockReturnValue("playing" as never);

    vi.mocked(useCashout).mockReturnValue(mockCashoutMutation as never);
  });

  test("shows loading screen while session is loading", () => {
    mockUseSession({ isLoading: true, isPending: true, status: "pending" });
    vi.mocked(useScreens).mockReturnValue("loading" as never);

    render(<SlotMachinePage />);
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  });

  test("shows error screen when session request fails", () => {
    mockUseSession({
      isError: true,
      error: new Error("Network error"),
      status: "error",
    });
    vi.mocked(useScreens).mockReturnValue("error" as never);

    render(<SlotMachinePage />);
    expect(screen.getByTestId("error-screen")).toBeInTheDocument();
    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
  });

  test("retries session fetch when Retry is clicked", () => {
    const mockRefetch = vi.fn();
    mockUseSession({
      isError: true,
      error: new Error("Network error"),
      status: "error",
      refetch: mockRefetch,
    } as never);
    vi.mocked(useScreens).mockReturnValue("error" as never);

    render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("retry-button"));
    expect(mockRefetch).toHaveBeenCalled();
  });

  test("shows playing state with credits after session loads", () => {
    mockUseSession({
      data: { credits: 10 },
      isSuccess: true,
      status: "success",
    });

    render(<SlotMachinePage />);
    expect(screen.getByTestId("credit-display")).toBeInTheDocument();
    expect(screen.getByTestId("credit-value")).toHaveTextContent("10");
    expect(screen.getByTestId("roll-button")).toBeEnabled();
    expect(screen.getByTestId("cashout-button")).toBeEnabled();
    expect(screen.getByTestId("slot-reel")).toBeInTheDocument();
  });

  test("calls roll mutation when Roll button is clicked", () => {
    mockUseSession({
      data: { credits: 10 },
      isSuccess: true,
      status: "success",
    });
    const mockHandleRoll = vi.fn();
    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: [null, null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 10,
      isSpinning: false,
      handleRoll: mockHandleRoll,
      reset: vi.fn(),
    } as never);

    render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("roll-button"));
    expect(mockHandleRoll).toHaveBeenCalled();
  });

  test("disables Roll button during spinning", () => {
    mockUseSession({
      data: { credits: 9 },
      isSuccess: true,
      status: "success",
    });
    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: [null, null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 9,
      isSpinning: true,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);
    vi.mocked(useScreens).mockReturnValue("spinning" as never);

    render(<SlotMachinePage />);
    expect(screen.getByTestId("roll-button")).toBeDisabled();
  });

  test("disables Cashout button during spinning", () => {
    mockUseSession({
      data: { credits: 9 },
      isSuccess: true,
      status: "success",
    });
    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: [null, null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 9,
      isSpinning: true,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);
    vi.mocked(useScreens).mockReturnValue("spinning" as never);
    mockCashoutMutation.isPending = false;

    render(<SlotMachinePage />);
    expect(screen.getByTestId("cashout-button")).toBeDisabled();
  });

  test("reveals blocks sequentially after roll success", () => {
    vi.useFakeTimers();

    mockUseSession({
      data: { credits: 9 },
      isSuccess: true,
      status: "success",
    });

    // Mock useRoll to return progressive symbol states
    // Stage 1: Initial - all null, spinning
    vi.mocked(useRoll).mockReturnValueOnce({
      delayedSymbols: [null, null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 9,
      isSpinning: true,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);

    const { rerender } = render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("roll-button"));

    let blocks = screen.getAllByTestId("slot-block");
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toHaveTextContent("X");
    expect(blocks[1]).toHaveTextContent("X");
    expect(blocks[2]).toHaveTextContent("X");

    // Stage 2: After 1s - first symbol set (will display after SlotReel's 1s delay)
    vi.mocked(useRoll).mockReturnValueOnce({
      delayedSymbols: ["C", null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 9,
      isSpinning: true,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);

    act(() => { vi.advanceTimersByTime(1000); });
    rerender(<SlotMachinePage />);
    // After SlotReel's 1s delay, first symbol should display
    act(() => { vi.advanceTimersByTime(1000); });
    blocks = screen.getAllByTestId("slot-block");
    expect(blocks[0]).toHaveTextContent("C");
    expect(blocks[1]).toHaveTextContent("X");

    // Stage 3: After 2s - second symbol set
    vi.mocked(useRoll).mockReturnValueOnce({
      delayedSymbols: ["C", "L", null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 9,
      isSpinning: true,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);

    act(() => { vi.advanceTimersByTime(1000); });
    rerender(<SlotMachinePage />);
    // After SlotReel's 1s delay, second symbol should display
    act(() => { vi.advanceTimersByTime(1000); });
    blocks = screen.getAllByTestId("slot-block");
    expect(blocks[1]).toHaveTextContent("L");
    expect(blocks[2]).toHaveTextContent("X");

    // Stage 4: After 3s - third symbol set, rollResult available
    vi.mocked(useRoll).mockReturnValueOnce({
      delayedSymbols: ["C", "L", "O"] as [string | null, string | null, string | null],
      rollResult: {
        symbols: ["C", "L", "O"] as [string, string, string],
        credits: 9,
        isWin: false,
        reward: 0,
      },
      credits: 9,
      isSpinning: false,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);

    act(() => { vi.advanceTimersByTime(1000); });
    rerender(<SlotMachinePage />);
    // After SlotReel's 1s delay, third symbol should display
    act(() => { vi.advanceTimersByTime(1000); });
    blocks = screen.getAllByTestId("slot-block");
    expect(blocks[2]).toHaveTextContent("O");

    vi.useRealTimers();
  });

  test("shows win feedback after all blocks revealed on a win", () => {
    vi.useFakeTimers();

    mockUseSession({
      data: { credits: 19 },
      isSuccess: true,
      status: "success",
    });

    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: ["C", "C", "C"] as [string | null, string | null, string | null],
      rollResult: {
        symbols: ["C", "C", "C"] as [string, string, string],
        credits: 19,
        isWin: true,
        reward: 10,
      },
      credits: 19,
      isSpinning: false,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);

    render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("roll-button"));

    act(() => { vi.advanceTimersByTime(3000); });

    expect(screen.getByTestId("result-feedback")).toHaveTextContent(
      "You won 10 credits!"
    );

    vi.useRealTimers();
  });

  test("shows loss feedback after all blocks revealed on a loss", () => {
    vi.useFakeTimers();

    mockUseSession({
      data: { credits: 9 },
      isSuccess: true,
      status: "success",
    });

    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: ["C", "L", "O"] as [string | null, string | null, string | null],
      rollResult: {
        symbols: ["C", "L", "O"] as [string, string, string],
        credits: 9,
        isWin: false,
        reward: 0,
      },
      credits: 9,
      isSpinning: false,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);

    render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("roll-button"));

    act(() => { vi.advanceTimersByTime(3000); });

    expect(screen.getByTestId("result-feedback")).toHaveTextContent(
      "No luck this time."
    );

    vi.useRealTimers();
  });

  test("shows Game Over screen when credits reach 0", () => {
    mockUseSession({
      data: { credits: 0 },
      isSuccess: true,
      status: "success",
    });
    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: [null, null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 0,
      isSpinning: false,
      handleRoll: vi.fn(),
      reset: vi.fn(),
    } as never);
    vi.mocked(useScreens).mockReturnValue("gameOver" as never);

    render(<SlotMachinePage />);
    expect(screen.getByTestId("game-over-screen")).toBeInTheDocument();
    expect(screen.getByTestId("new-game-button")).toBeInTheDocument();
  });

  test("shows Cashed Out screen after successful cashout", () => {
    mockUseSession({
      data: { credits: 15 },
      isSuccess: true,
      status: "success",
    });

    mockCashoutMutation.isSuccess = true;
    mockCashoutMutation.data = {
      credits: 15,
      message: "Cashed out successfully",
    };
    vi.mocked(useCashout).mockReturnValue(mockCashoutMutation as never);
    vi.mocked(useScreens).mockReturnValue("cashedOut" as never);

    render(<SlotMachinePage />);
    expect(screen.getByTestId("cashed-out-screen")).toBeInTheDocument();
    expect(screen.getByTestId("cashout-credits")).toHaveTextContent("15");
    expect(screen.getByTestId("play-again-button")).toBeInTheDocument();
  });

  test("calls cashout mutation when Cash Out is clicked", () => {
    mockUseSession({
      data: { credits: 10 },
      isSuccess: true,
      status: "success",
    });

    render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("cashout-button"));
    expect(mockCashoutMutation.mutate).toHaveBeenCalled();
  });

  test("shows toast on roll error", () => {
    mockUseSession({
      data: { credits: 10 },
      isSuccess: true,
      status: "success",
    });

    const mockReset = vi.fn();
    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: [null, null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 10,
      isSpinning: false,
      handleRoll: vi.fn(() => {
        // Simulate error - reset is called
        mockReset();
        toast.error("Something went wrong. Please try again.");
      }),
      reset: mockReset,
    } as never);

    render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("roll-button"));

    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again."
    );
    expect(mockReset).toHaveBeenCalled();
  });

  test("shows toast on cashout error", () => {
    mockUseSession({
      data: { credits: 10 },
      isSuccess: true,
      status: "success",
    });

    mockCashoutMutation.mutate = vi.fn((_, options) => {
      options?.onError?.(new Error("Network error"));
    });
    vi.mocked(useCashout).mockReturnValue(mockCashoutMutation as never);

    render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("cashout-button"));

    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again."
    );
  });

  test("resets state on New Game click from Game Over", () => {
    const mockRefetch = vi.fn();
    mockUseSession({
      data: { credits: 0 },
      isSuccess: true,
      status: "success",
      refetch: mockRefetch,
    } as never);
    vi.mocked(useScreens).mockReturnValue("gameOver" as never);

    const mockResetRoll = vi.fn();
    vi.mocked(useRoll).mockReturnValue({
      delayedSymbols: [null, null, null] as [string | null, string | null, string | null],
      rollResult: null,
      credits: 0,
      isSpinning: false,
      handleRoll: vi.fn(),
      reset: mockResetRoll,
    } as never);

    render(<SlotMachinePage />);
    fireEvent.click(screen.getByTestId("new-game-button"));

    expect(mockRefetch).toHaveBeenCalled();
    expect(mockResetRoll).toHaveBeenCalled();
    expect(mockCashoutMutation.reset).toHaveBeenCalled();
  });
});
