export interface ApiData<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}
