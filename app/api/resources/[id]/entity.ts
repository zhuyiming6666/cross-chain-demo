export interface ResourceDetailDto {
  id: string;
  name: string;
  description: string;
  resource_type: string;
  chain_id: string;
  chain_name: string;
  chain_key: string;
  owner_organization_id: string;
  org_name: string;
  resource_hash: string;
  storage_uri: string;
  status: string;
  created_at: string;
  policies: {
    id: string;
    policy_name: string;
    policy_code: string;
    read_mode: string;
    crosschain_required: boolean;
    is_enabled: boolean;
  }[];
  access_logs: {
    id: string;
    action: string;
    result: string;
    tx_hash: string;
    created_at: string;
  }[];
}
