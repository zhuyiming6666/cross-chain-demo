export interface GetOverviewDto {}

export interface GetOverviewResponseDto {
  resources: number;
  accessRequests: number;
  computeTasks: number;
  auditEvents: number;
  chains: { name: string; chain_key: string; status: string }[];
  recentMessages: {
    id: string;
    business_type: string;
    source: string;
    target: string;
    status: string;
  }[];
}
