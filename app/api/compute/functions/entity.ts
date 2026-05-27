export interface ComputeFunctionItem {
  id: string;
  name: string;
  function_key: string;
  description: string;
  function_type: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  is_builtin: boolean;
  created_at: string;
}

export interface ListComputeFunctionsResponseDto {
  functions: ComputeFunctionItem[];
}
