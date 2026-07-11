const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");
export const API_URL = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/$/, "").replace(/\/api\/v1$/, "")}/api/v1`
  : "/api/v1";

interface FetchOptions extends RequestInit {
  demoUserId?: number;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: Array<{ loc?: Array<string | number>; msg?: string }>) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { demoUserId, headers, ...rest } = options;
  
  const defaultHeaders: Record<string, string> = {};

  if (rest.body) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (demoUserId) {
    defaultHeaders["X-Demo-User-Id"] = demoUserId.toString();
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = typeof errorData.detail === "string"
      ? errorData.detail
      : Array.isArray(errorData.detail)
        ? errorData.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join("; ")
        : `API error: ${response.status}`;
    throw new ApiError(detail, response.status, Array.isArray(errorData.detail) ? errorData.detail : undefined);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
