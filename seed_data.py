"""Insert demo seed data into Supabase using fixed UUIDs."""
import os
import requests

BASE = os.getenv("SUPABASE_API_URL", "https://api.supabase.com/v1/projects/pgyzgrjkknfxrfpuetnk/database/query")
TOKEN = os.getenv("SUPABASE_TOKEN", "")
if not TOKEN:
    raise RuntimeError("SUPABASE_TOKEN environment variable is required")
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def run(sql):
    r = requests.post(BASE, headers=HEADERS, json={"query": sql})
    if r.status_code in (200, 201):
        print("OK")
    else:
        print(f"FAIL {r.status_code}: {r.text[:300]}")
        return False
    return True

# Fixed UUIDs
CH = "11111111-1111-1111-1111-111111111111"
CR = "22222222-2222-2222-2222-222222222222"
CG = "33333333-3333-3333-3333-333333333333"
OH = "aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
OI = "bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
OG = "cccc3333-cccc-cccc-cccc-cccccccccccc"

# Clean up existing data in reverse dependency order
for t in ["resource_policies","access_logs","access_requests","compute_results","compute_task_events","compute_task_participants","compute_task_resources","compute_tasks","compute_functions","policy_templates","resources","credential_proofs","credentials","credential_templates","identity_events","identity_dids","crosschain_messages","chain_contracts","profiles","organizations","chains"]:
    run(f"DELETE FROM {t}")

# Insert in dependency order
print("--- Chains ---")
run(f"""INSERT INTO chains (id, chain_key, name, chain_rpc_url, explorer_url, native_symbol) VALUES
('{CH}', 'chain_hospital', '医院链', 'http://127.0.0.1:18545', 'http://127.0.0.1:18545/explorer', 'ETH'),
('{CR}', 'chain_research', '科研机构链', 'http://127.0.0.1:28545', 'http://127.0.0.1:28545/explorer', 'ETH'),
('{CG}', 'chain_regulator', '监管链', NULL, NULL, 'ETH')""")

print("--- Organizations ---")
run(f"""INSERT INTO organizations (id, name, org_type, chain_id, did, status) VALUES
('{OH}', '江苏省人民医院', 'hospital', '{CH}', 'did:hospital:js001', 'active'),
('{OI}', '南京某科研院', 'research_institute', '{CR}', 'did:research:nj001', 'active'),
('{OG}', '江苏监管机构', 'regulator', '{CG}', 'did:regulator:js001', 'active')""")

print("--- Profiles ---")
run(f"""INSERT INTO profiles (nextauth_user_id, display_name, email, role, organization_id, is_admin) VALUES
('hospital_admin', '张伟', 'zhangwei@hospital.js.cn', 'hospital', '{OH}', false),
('doctor', '李医生', 'li@hospital.js.cn', 'doctor', '{OH}', false),
('researcher', '王研究员', 'wang@research.js.cn', 'research', '{OI}', false),
('regulator', '赵监管', 'zhao@regulator.js.cn', 'regulator', '{OG}', false),
('admin', '系统管理员', 'admin@system.cn', 'regulator', '{OG}', true)""")

print("--- Chain Contracts ---")
run(f"""INSERT INTO chain_contracts (chain_id, contract_type, contract_address, deployed_tx_hash) VALUES
('{CH}', 'gateway', '0x0000000000000000000000000000000000000001', '0xaaaa1111'),
('{CH}', 'resource_registry', '0x0000000000000000000000000000000000000002', '0xaaaa2222'),
('{CR}', 'gateway', '0x0000000000000000000000000000000000000003', '0xbbbb1111'),
('{CR}', 'compute_manager', '0x0000000000000000000000000000000000000004', '0xbbbb2222'),
('{CG}', 'identity_registry', '0x0000000000000000000000000000000000000005', '0xcccc1111')""")

print("--- Credential Templates ---")
run(f"""INSERT INTO credential_templates (name, credential_type, schema, issuer_organization_id) VALUES
('医生资格', 'doctor_license', '{{\"fields\":[\"name\",\"unit\",\"education\",\"title\",\"department\"]}}', '{OG}'),
('科研资质', 'research_qualification', '{{\"fields\":[\"name\",\"unit\",\"title\",\"project\"]}}', '{OG}'),
('伦理审批', 'ethics_approval', '{{\"fields\":[\"name\",\"unit\",\"project\",\"approval_number\"]}}', '{OG}')""")

print("--- Resources ---")
run(f"""INSERT INTO resources (name, description, resource_type, owner_organization_id, chain_id, resource_hash, storage_uri, status, created_by)
SELECT '肿瘤病例数据集', '肿瘤科真实病例数据（脱敏）', 'case_dataset',
       '{OH}', '{CH}', '0xabc123def456', 'ipfs://demo/tumor-cases', 'active',
       p.id FROM profiles p WHERE p.nextauth_user_id='hospital_admin'""")

run(f"""INSERT INTO resources (name, description, resource_type, owner_organization_id, chain_id, resource_hash, storage_uri, status, created_by)
SELECT '慢病随访列表', '慢病随访记录数据集', 'list',
       '{OH}', '{CH}', '0xdef789abc012', 'ipfs://demo/chronic-followup', 'active',
       p.id FROM profiles p WHERE p.nextauth_user_id='hospital_admin'""")

run(f"""INSERT INTO resources (name, description, resource_type, owner_organization_id, chain_id, resource_hash, storage_uri, status, created_by)
SELECT '脱敏统计文件', '医院各科室统计报告（脱敏）', 'file',
       '{OH}', '{CH}', '0x789012def345', 'ipfs://demo/stats-report', 'active',
       p.id FROM profiles p WHERE p.nextauth_user_id='hospital_admin'""")

print("--- Policy Templates ---")
run("""INSERT INTO policy_templates (name, description, policy_code, policy_schema, is_builtin, created_by)
SELECT '医生且认证医院', '是医生 AND 属于认证医院', 'role=doctor AND org=verified_hospital',
       '{"required_role":"doctor","required_org":"verified_hospital"}', true,
       p.id FROM profiles p WHERE p.nextauth_user_id='admin'""")

run("""INSERT INTO policy_templates (name, description, policy_code, policy_schema, is_builtin, created_by)
SELECT '科研人员且伦理审批通过', '科研人员 AND 伦理审批通过', 'role=research AND ethics_approved=true',
       '{"required_role":"research","require_ethics":true}', true,
       p.id FROM profiles p WHERE p.nextauth_user_id='admin'""")

run("""INSERT INTO policy_templates (name, description, policy_code, policy_schema, is_builtin, created_by)
SELECT '监管人员且审计用途', '监管人员 AND 用途=审计', 'role=regulator AND purpose=audit',
       '{"required_role":"regulator","allowed_purpose":"audit"}', true,
       p.id FROM profiles p WHERE p.nextauth_user_id='admin'""")

run("""INSERT INTO policy_templates (name, description, policy_code, policy_schema, is_builtin, created_by)
SELECT '认证医院且指定科室且访问窗口有效', '认证医院 AND 指定科室 AND 时间窗口有效',
       'org=verified_hospital AND department IN (oncology,cardiology) AND time_window_valid=true',
       '{"required_org":"verified_hospital","allowed_departments":["oncology","cardiology"],"require_time_window":true}', true,
       p.id FROM profiles p WHERE p.nextauth_user_id='admin'""")

print("--- Compute Functions ---")
run("""INSERT INTO compute_functions (name, function_key, description, function_type, code, input_schema, output_schema, is_builtin, created_by)
SELECT '病例数量统计', 'case_count', '统计多家医院的病例数量', 'statistics',
       '# 多方统计聚合 MPC 程序', '{"inputs":[{"type":"integer[]","label":"病例数列表"}]}',
       '{"outputs":[{"type":"integer","label":"总数"}]}', true,
       p.id FROM profiles p WHERE p.nextauth_user_id='admin'""")

run("""INSERT INTO compute_functions (name, function_key, description, function_type, code, input_schema, output_schema, is_builtin, created_by)
SELECT '风险评分计算', 'risk_score', '基于多院数据计算患者风险评分', 'risk_score',
       '# 风险评分 MPC 程序', '{"inputs":[{"type":"integer[]","label":"风险因子"}]}',
       '{"outputs":[{"type":"number","label":"风险评分"}]}', true,
       p.id FROM profiles p WHERE p.nextauth_user_id='admin'""")

run("""INSERT INTO compute_functions (name, function_key, description, function_type, code, input_schema, output_schema, is_builtin, created_by)
SELECT '相同患者 PSI', 'patient_psi', '隐私集合求交：跨院查找相同患者', 'psi',
       '# 隐私集合求交 MPC 程序', '{"inputs":[{"type":"string[]","label":"患者标识符集"}]}',
       '{"outputs":[{"type":"string[]","label":"交集结果"}]}', true,
       p.id FROM profiles p WHERE p.nextauth_user_id='admin'""")

print("--- Resource Policies ---")
run("""INSERT INTO resource_policies (resource_id, template_id, policy_name, policy_code, read_mode, crosschain_required, is_enabled)
SELECT r.id, pt.id, pt.name, pt.policy_code, 'abe_encrypted', true, true
FROM resources r, policy_templates pt
WHERE r.name = '肿瘤病例数据集' AND pt.name = '医生且认证医院'""")

run("""INSERT INTO resource_policies (resource_id, template_id, policy_name, policy_code, read_mode, crosschain_required, is_enabled)
SELECT r.id, pt.id, pt.name, pt.policy_code, 'abe_encrypted', true, true
FROM resources r, policy_templates pt
WHERE r.name = '慢病随访列表' AND pt.name = '科研人员且伦理审批通过'""")

run("""INSERT INTO resource_policies (resource_id, template_id, policy_name, policy_code, read_mode, crosschain_required, is_enabled)
SELECT r.id, pt.id, pt.name, pt.policy_code, 'abe_encrypted', true, true
FROM resources r, policy_templates pt
WHERE r.name = '脱敏统计文件' AND pt.name = '监管人员且审计用途'""")

print("\nAll seed data inserted successfully!")
