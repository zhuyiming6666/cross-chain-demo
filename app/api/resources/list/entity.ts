export interface ListResourcesDto {
  resource_type?: string;
  search?: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  description: string;
  resource_type: string;
  chain_name: string;
  chain_key: string;
  resource_hash: string;
  storage_uri: string;
  status: string;
  created_at: string;
}

export interface ListResourcesResponseDto {
  resources: ResourceItem[];
  total: number;
}
