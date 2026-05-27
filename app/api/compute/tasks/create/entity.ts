export interface CreateComputeTaskDto {
  name: string;
  description?: string;
  function_id: string;
  source_chain_id: string;
  target_chain_id?: string;
  parameters?: Record<string, unknown>;
  resource_ids: string[];
  result_visibility?: string;
}

export interface CreateComputeTaskResponseDto {
  id: string;
  name: string;
}
