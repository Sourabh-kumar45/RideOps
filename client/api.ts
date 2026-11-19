/**
 * Typed browser client for the API routes in app/api.
 *
 * Components call `api.*` instead of `fetch`, so request and response types
 * come from shared/types.ts and every failure arrives as an `ApiError` carrying
 * the server's message.
 */
import type {
  ApiErrorBody,
  CatalogResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  DecisionRequest,
  DecisionResponse,
  GateAssessment,
  QueueResponse,
  ScorecardResponse,
  SuggestResponse,
} from "@/shared/types";

/** An API failure with a message that is safe to show. */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/** Fetches JSON; throws `ApiError` on network failure or a non-2xx response. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Can't reach the server. Is `npm run dev` running?");
  }
  const body = (await res.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!res.ok) {
    const message = body && typeof body === "object" && "error" in body ? body.error : `Request failed (${res.status}).`;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
const ticketPath = (id: string) => `/api/tickets/${encodeURIComponent(id)}`;

export const api = {
  catalog: () => request<CatalogResponse>("/api/catalog"),
  queue: () => request<QueueResponse>("/api/tickets"),
  createTicket: (body: CreateTicketRequest) => request<CreateTicketResponse>("/api/tickets", post(body)),
  assessment: (ticketId: string) => request<GateAssessment>(`${ticketPath(ticketId)}/assessment`),
  decide: (ticketId: string, body: DecisionRequest) => request<DecisionResponse>(`${ticketPath(ticketId)}/decision`, post(body)),
  suggest: (text: string, signal?: AbortSignal) =>
    request<SuggestResponse>(`/api/suggest?text=${encodeURIComponent(text)}`, { signal }),
  scorecard: () => request<ScorecardResponse>("/api/scorecard"),
};
