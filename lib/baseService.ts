import type { ApiData } from "@/types/api";

export class BaseService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async post<T>(endpoint: string, data?: unknown): Promise<{ data: ApiData<T> }> {
    const res = await fetch(`${this.baseURL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? {}),
    });
    const json = await res.json();
    return { data: json };
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<{ data: ApiData<T> }> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`${this.baseURL}/${endpoint}${qs}`);
    const json = await res.json();
    return { data: json };
  }
}
