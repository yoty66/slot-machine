/**
 * Generic type for typed fetch Response
 * Extends the standard Response type to provide type safety for the json() method
 */
export type TypedResponse<T> = Response & {
  json(): Promise<T>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
  formData(): Promise<FormData>;
};

/**
 * Type for error responses
 */
export type ErrorResponse = {
  error: string;
  message?: string;
  status?: number;
};

/**
 * Union type for successful or error response
 */
export type ApiResponse<T> = T | ErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  if (response instanceof Response) {
    return !response.ok;
  }
  return (
    typeof response === "object" && response !== null && "error" in response
  );
}
