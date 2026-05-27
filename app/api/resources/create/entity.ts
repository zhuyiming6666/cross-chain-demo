export interface CreateResourceDto {
  name: string;
  description?: string;
  resource_type: string;
  chain_id: string;
  resource_hash?: string;
  storage_uri?: string;
  policy_template_ids?: string[];
}

export interface CreateResourceResponseDto {
  id: string;
  name: string;
}
