export interface ComputeTaskDetailDto {
  id: string;
  name: string;
  description: string;
  function_id: string;
  function_name: string;
  function_key: string;
  source_chain_name: string;
  target_chain_name: string;
  status: string;
  parameters: Record<string, unknown>;
  result_visibility: string;
  result_hash?: string;
  compute_digest?: string;
  created_at: string;
  completed_at?: string;
  resources: {
    id: string;
    name: string;
    resource_type: string;
    chain_name: string;
  }[];
  events: {
    id: string;
    event_type: string;
    tx_hash: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];
}
