"""One-shot script to create all Supabase demo tables via Management API."""
import requests
import json
import os

BASE = os.getenv("SUPABASE_API_URL", "https://api.supabase.com/v1/projects/pgyzgrjkknfxrfpuetnk/database/query")
TOKEN = os.getenv("SUPABASE_TOKEN", "")
if not TOKEN:
    raise RuntimeError("SUPABASE_TOKEN environment variable is required")
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

def run(sql: str):
    r = requests.post(BASE, headers=HEADERS, json={"query": sql})
    if r.status_code != 200:
        print(f"FAILED: {r.status_code} {r.text[:200]}")
    else:
        print("OK")

# ── Core tables ──
run("""
CREATE TABLE IF NOT EXISTS chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_key text UNIQUE NOT NULL,
  name text NOT NULL,
  chain_rpc_url text,
  explorer_url text,
  native_symbol text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_type text NOT NULL,
  chain_id uuid REFERENCES chains(id),
  did text,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nextauth_user_id text UNIQUE NOT NULL,
  display_name text NOT NULL,
  email text,
  role text NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  is_admin boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

# ── Chain contracts & crosschain ──
run("""
CREATE TABLE IF NOT EXISTS chain_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid REFERENCES chains(id),
  contract_type text NOT NULL,
  contract_address text NOT NULL,
  abi_version text,
  deployed_tx_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS crosschain_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_chain_id uuid REFERENCES chains(id),
  target_chain_id uuid REFERENCES chains(id),
  message_type text NOT NULL,
  business_type text NOT NULL,
  business_id uuid,
  nonce text,
  status text NOT NULL DEFAULT 'pending',
  request_tx_hash text,
  receipt_tx_hash text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

# ── Privacy Identity ──
run("""
CREATE TABLE IF NOT EXISTS identity_dids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  did text UNIQUE NOT NULL,
  did_document jsonb DEFAULT '{}'::jsonb,
  chain_id uuid REFERENCES chains(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS credential_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credential_type text NOT NULL,
  schema jsonb NOT NULL,
  issuer_organization_id uuid REFERENCES organizations(id),
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_profile_id uuid REFERENCES profiles(id),
  issuer_organization_id uuid REFERENCES organizations(id),
  template_id uuid REFERENCES credential_templates(id),
  credential_type text NOT NULL,
  claims jsonb NOT NULL,
  signature text,
  status text NOT NULL DEFAULT 'valid',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS credential_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid REFERENCES credentials(id),
  holder_profile_id uuid REFERENCES profiles(id),
  proof_type text NOT NULL,
  disclosed_claims jsonb DEFAULT '{}'::jsonb,
  proof_text text NOT NULL,
  nullifier text,
  business_scope text,
  status text NOT NULL DEFAULT 'generated',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS identity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  event_type text NOT NULL,
  business_id uuid,
  event_hash text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
)
""")

# ── Resources & Access Control ──
run("""
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  resource_type text NOT NULL,
  owner_organization_id uuid REFERENCES organizations(id),
  chain_id uuid REFERENCES chains(id),
  resource_hash text,
  storage_uri text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS policy_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  policy_code text NOT NULL,
  policy_schema jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES profiles(id),
  is_builtin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS resource_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id),
  template_id uuid REFERENCES policy_templates(id),
  policy_name text NOT NULL,
  policy_code text NOT NULL,
  policy_json jsonb DEFAULT '{}'::jsonb,
  read_mode text NOT NULL DEFAULT 'abe_encrypted',
  crosschain_required boolean DEFAULT true,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id),
  requester_profile_id uuid REFERENCES profiles(id),
  requester_organization_id uuid REFERENCES organizations(id),
  proof_id uuid REFERENCES credential_proofs(id),
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewer_profile_id uuid REFERENCES profiles(id),
  review_comment text,
  key_envelope jsonb DEFAULT '{}'::jsonb,
  requested_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id),
  access_request_id uuid REFERENCES access_requests(id),
  actor_profile_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  result text NOT NULL,
  tx_hash text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
)
""")

# ── Privacy Compute ──
run("""
CREATE TABLE IF NOT EXISTS compute_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  function_key text UNIQUE NOT NULL,
  description text,
  function_type text NOT NULL,
  code text,
  input_schema jsonb DEFAULT '{}'::jsonb,
  output_schema jsonb DEFAULT '{}'::jsonb,
  is_builtin boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS compute_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  function_id uuid REFERENCES compute_functions(id),
  initiator_profile_id uuid REFERENCES profiles(id),
  initiator_organization_id uuid REFERENCES organizations(id),
  source_chain_id uuid REFERENCES chains(id),
  target_chain_id uuid REFERENCES chains(id),
  status text NOT NULL DEFAULT 'draft',
  parameters jsonb DEFAULT '{}'::jsonb,
  result_visibility text NOT NULL DEFAULT 'initiator_only',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS compute_task_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES compute_tasks(id),
  resource_id uuid REFERENCES resources(id),
  resource_chain_id uuid REFERENCES chains(id),
  role text NOT NULL DEFAULT 'input',
  created_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS compute_task_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES compute_tasks(id),
  organization_id uuid REFERENCES organizations(id),
  profile_id uuid REFERENCES profiles(id),
  proof_id uuid REFERENCES credential_proofs(id),
  status text NOT NULL DEFAULT 'pending',
  input_commitment text,
  public_key text,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS compute_task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES compute_tasks(id),
  event_type text NOT NULL,
  actor_profile_id uuid REFERENCES profiles(id),
  tx_hash text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS compute_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES compute_tasks(id),
  result_hash text NOT NULL,
  result_data jsonb DEFAULT '{}'::jsonb,
  proof_summary text,
  submitted_tx_hash text,
  submitted_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

# ── Audit & Trace ──
run("""
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES profiles(id),
  actor_organization_id uuid REFERENCES organizations(id),
  module text NOT NULL,
  action text NOT NULL,
  business_id uuid,
  result text NOT NULL,
  risk_level text NOT NULL DEFAULT 'normal',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS trace_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid REFERENCES audit_logs(id),
  requested_by uuid REFERENCES profiles(id),
  target_profile_id uuid REFERENCES profiles(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending_votes',
  required_votes integer DEFAULT 2,
  approved_votes integer DEFAULT 0,
  revealed_identity jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
""")

run("""
CREATE TABLE IF NOT EXISTS trace_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_request_id uuid REFERENCES trace_requests(id),
  voter_profile_id uuid REFERENCES profiles(id),
  vote text NOT NULL,
  signature text,
  created_at timestamptz DEFAULT now()
)
""")

# ── INDEXES ──
run("CREATE INDEX IF NOT EXISTS idx_profiles_nextauth ON profiles(nextauth_user_id)")
run("CREATE INDEX IF NOT EXISTS idx_profiles_role_org ON profiles(role, organization_id)")
run("CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(org_type)")
run("CREATE INDEX IF NOT EXISTS idx_resources_owner ON resources(owner_organization_id, status)")
run("CREATE INDEX IF NOT EXISTS idx_resources_chain ON resources(chain_id, resource_type)")
run("CREATE INDEX IF NOT EXISTS idx_policies_resource ON resource_policies(resource_id, is_enabled)")
run("CREATE INDEX IF NOT EXISTS idx_access_req_resource ON access_requests(resource_id, status)")
run("CREATE INDEX IF NOT EXISTS idx_access_req_requester ON access_requests(requester_profile_id, status)")
run("CREATE INDEX IF NOT EXISTS idx_compute_tasks_init ON compute_tasks(initiator_profile_id, status)")
run("CREATE INDEX IF NOT EXISTS idx_compute_participants ON compute_task_participants(task_id, organization_id)")
run("CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module, business_id)")
run("CREATE INDEX IF NOT EXISTS idx_audit_risk ON audit_logs(risk_level, created_at)")
run("CREATE INDEX IF NOT EXISTS idx_crosschain_biz ON crosschain_messages(business_type, business_id)")
run("CREATE INDEX IF NOT EXISTS idx_proofs_nullifier ON credential_proofs(nullifier, business_scope)")

# ── DISABLE RLS per design spec ──
TABLES = [
    "chains", "organizations", "profiles",
    "chain_contracts", "crosschain_messages",
    "identity_dids", "credential_templates", "credentials", "credential_proofs", "identity_events",
    "resources", "policy_templates", "resource_policies", "access_requests", "access_logs",
    "compute_functions", "compute_tasks", "compute_task_resources",
    "compute_task_participants", "compute_task_events", "compute_results",
    "audit_logs", "trace_requests", "trace_votes",
]
for t in TABLES:
    run(f"ALTER TABLE {t} DISABLE ROW LEVEL SECURITY")

print("\nAll tables created and RLS disabled!")
