export interface ComputeTaskItem {
  id: string;
  name: string;
  description: string;
  function_id: string;
  function_name: string;
  source_chain_name: string;
  target_chain_name: string;
  status: string;
  parameters: Record<string, unknown>;
  resource_count: number;
  created_at: string;
}

export interface ListComputeTasksResponseDto {
  tasks: ComputeTaskItem[];
  total: number;
}
