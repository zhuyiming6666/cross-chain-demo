# Next.js + Supabase Demo 设计方案

## 1. 设计目标

本方案面向《跨链数据安全及隐私身份系统方案设计》中的 Demo 1：跨链医疗数据安全共享与隐私计算，使用 Next.js App Route + Supabase Postgres 重建一个可演示、可扩展的 Web Demo。

Demo 需要展示以下主线：

1. 医生或科研人员完成隐私身份认证。
2. 科研机构跨链申请访问医院数据资源。
3. 医院根据访问策略进行授权。
4. 数据密钥采用 CP-ABE 语义进行保护，Demo 中以密钥封装记录和授权状态模拟。
5. 多家医院通过隐私计算任务完成病例统计、风险评分或 PSI。
6. 计算结果返回科研机构。
7. 全流程生成访问、计算、身份和跨链审计日志。
8. 异常访问可由监管方发起身份恢复或身份追溯。

本方案优先保障演示闭环，不在第一版实现真实跨链桥、真实 ZKP、真实 MPC 和真实 CP-ABE。链上、跨链和密码学过程以“链配置、交易哈希、证明文本、密钥封装、事件状态机”的方式模拟，保留后续替换为真实模块的接口边界。

## 2. 技术框架约束

### 2.1 前端

- 使用 Next.js App Route。
- 使用 PrimeReact 作为 UI 组件库。
- 使用 Tailwind CSS 作为 atomic CSS 框架。
- 页面颜色优先使用 Tailwind 的 `primary` 色系。
- 文本和弱化信息使用 `text-surface-*`，不使用 `text-gray-*`。
- 所有加载态使用 PrimeReact `Skeleton` 或成组骨架屏，不使用简单的 `loading: true` 文本。
- 所有用户反馈使用 `toast`，不使用页面级 `setError` / `setMessage` 文本提示。
- 所有页面需要适配移动端：移动端侧边栏折叠，列表转卡片，表单单列布局，关键操作固定在内容区底部或卡片尾部。
- 前端不得直接访问 Supabase。所有业务请求都通过 `@/app/service` 调用 `@/app/api`。

### 2.2 后端

- 每个业务接口使用 App Route 的 `POST`。
- 返回结构严格为 `success`、`message`、`data`。
- `route.ts` 统一使用：
  - `import { NextResponse } from "next/server";`
  - `import supabase from "@/lib/supabaseClient";`
  - `import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";`
- 接口内优先通过 `getServerSession()` 获取用户、角色和机构信息，不在请求参数中传 `userId`。
- 每个接口目录下创建 `entity.ts`，并在 `route.ts` 中使用 `import type` 引入请求和响应类型。
- `@/app/service` 中的 service 方法与 `@/app/api` 一一对应，成员函数保持如下风格：

```typescript
async publishContent(reqData: PublishContentDto) {
    const res = await this.post<PublishContentResponseDto>('publish-content', reqData);
    if (res.data && res.data.success) {
        return res.data.data || null;
    }
}
```

### 2.3 Supabase

- Supabase 在本 Demo 中作为 Postgres 数据库和对象元数据存储。
- 鉴权使用 NextAuth，不使用前端 Supabase Auth 会话。
- 所有 Supabase 查询只允许在后端 API 或服务端工具中执行。
- 新建业务表按当前项目要求关闭 RLS：`ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;`
- 因为 RLS 关闭，接口层必须严格通过 `getServerSession()` 校验用户角色、机构归属和业务权限。

## 3. Demo 用户角色端

根据系统方案和 Web 设计，本 Demo 设计 4 个角色端，另提供公共系统看板。

### 3.1 医院端

医院端是数据资源方和隐私计算参与方，负责病例资源登记、策略配置、访问审批和计算任务确认。

主要能力：

- 查看本院数据资源和跨链可见资源。
- 创建病例资源、病例统计资源、文件类资源或列表类资源。
- 为资源配置访问策略和权限预设。
- 审批科研机构的数据访问请求。
- 参与跨链隐私计算任务，提交输入承诺和加密公钥。
- 查看本院资源的访问日志、计算日志和授权历史。

建议路由：

- `/hospital/resources`
- `/hospital/resources/create`
- `/hospital/resources/[id]`
- `/hospital/policies`
- `/hospital/policies/presets`
- `/hospital/compute`

### 3.2 科研端

科研端是资源访问方和计算任务发起方，负责申请数据访问、创建隐私计算任务并查看结果。

主要能力：

- 浏览多链医院资源目录。
- 使用身份凭证证明科研资格或伦理审批状态。
- 发起跨链访问申请。
- 创建多院隐私计算任务。
- 选择计算模板，如病例数量统计、风险评分、相同患者 PSI。
- 查看计算任务状态、参与方确认进度和结果摘要。

建议路由：

- `/research/templates`
- `/research/compute`
- `/research/compute/create`
- `/research/compute/[id]`

### 3.3 医生端

医生端是隐私身份持有者和医疗业务使用者，负责医生身份登记、凭证管理和医疗业务入口。

主要能力：

- 注册 DID 或绑定 Demo DID。
- 导入或查看医生资格凭证。
- 生成选择性披露证明，例如“我是认证医生”“属于某医院某科室”。
- 生成 nullifier，展示抗重复认证能力。
- 使用证明完成医生身份登记。
- 从医疗应用入口进入病例资源管理或多院病例共享。

建议路由：

- `/doctor/register`
- `/doctor/credentials`
- `/doctor/prove`

### 3.4 监管端

监管端是凭证签发方、审计方和追溯方，负责机构管理、凭证签发、异常事件追溯和审计。

主要能力：

- 管理可信机构、链配置和凭证模板。
- 为医生、科研人员或机构签发链下凭证。
- 查看访问、计算、身份和跨链事件。
- 对异常事件发起身份恢复或身份追溯。
- 模拟多监管方投票，达到阈值后展示原始身份。
- 查看某个身份的历史事件链路。

建议路由：

- `/regulator/issue`
- `/regulator/audit`
- `/regulator/recovery`

### 3.5 公共系统看板

系统看板不是独立业务角色端，而是登录后所有角色可见的公共入口。不同角色看到的数据范围不同。

主要能力：

- 展示链配置、合约地址、跨链消息数量、最近交易哈希。
- 展示资源数、访问申请数、计算任务数、异常审计事件数。
- 展示 Demo 流程进度和推荐下一步操作。

建议路由：

- `/dashboard`

## 4. 核心业务流程

### 4.1 身份凭证流程

1. 监管端选择用户和凭证模板。
2. 后端生成 Demo VC，并写入 `credentials`。
3. 医生端或科研端查看自己的凭证。
4. 用户选择证明模板，生成 proof 文本和 nullifier。
5. 后端验证 proof 格式、凭证状态和 nullifier 是否重复。
6. 验证事件写入 `identity_events` 和 `audit_logs`。

### 4.2 数字资源访问流程

1. 医院端创建数字资源，写入资源元数据、链信息、资源哈希和存储地址。
2. 医院端为资源绑定访问策略。
3. 科研端浏览资源目录并提交访问申请。
4. 后端检查科研端身份、用途、凭证证明和资源策略。
5. 医院端审批或拒绝申请。
6. 审批通过后生成密钥封装记录，科研端可查看密文地址和授权状态。
7. 全过程写入访问日志和审计日志。

### 4.3 跨链隐私计算流程

1. 科研端选择计算模板和参与资源。
2. 后端创建计算任务，写入任务状态 `draft` 或 `pending_participants`。
3. 医院端作为参与方确认任务，提交输入承诺、证明摘要和加密公钥。
4. 所有参与方确认后，任务进入 `ready`。
5. 科研端或后端模拟执行计算，任务进入 `running`。
6. 后端生成结果摘要、结果明文预览和链上提交哈希，任务进入 `completed`。
7. 结果事件写入 `compute_task_events`、`compute_results` 和 `crosschain_messages`。

### 4.4 监管追溯流程

1. 系统将异常访问、重复 nullifier、越权申请或失败计算标记为审计事件。
2. 监管端进入事件详情，发起恢复或追溯请求。
3. 多监管方提交签名或确认投票。
4. 达到阈值后，后端将事件关联的真实身份摘要展示给监管端。
5. 追溯记录写入 `trace_requests` 和 `audit_logs`。

## 5. 数据库设计

### 5.1 设计原则

- 所有主键使用 `uuid`。
- 所有表保留 `created_at` 和 `updated_at`。
- 业务状态字段使用枚举语义的 `text`，便于 Demo 迭代。
- 所有链上、跨链和密码学数据都保存“可演示摘要”，例如 `tx_hash`、`proof_text`、`commitment`、`ciphertext_uri`、`result_hash`。
- 新建表关闭 RLS，权限在 Next.js API 层完成。
- 关键业务表增加 `created_by`、`organization_id` 或 `owner_id`，方便后端做权限过滤。

### 5.2 用户与组织

#### `profiles`

用户资料表，与 NextAuth 用户绑定。

核心字段：

- `id uuid primary key`
- `nextauth_user_id text unique not null`
- `display_name text not null`
- `email text`
- `role text not null`：`doctor`、`hospital`、`research`、`regulator`
- `organization_id uuid references organizations(id)`
- `is_admin boolean default false`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `organizations`

机构表，表示医院、科研机构、监管机构。

核心字段：

- `id uuid primary key`
- `name text not null`
- `org_type text not null`：`hospital`、`research_institute`、`regulator`
- `chain_id uuid references chains(id)`
- `did text`
- `status text not null default 'active'`
- `metadata jsonb default '{}'::jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### 5.3 链与合约配置

#### `chains`

链配置表。

核心字段：

- `id uuid primary key`
- `chain_key text unique not null`
- `name text not null`
- `chain_rpc_url text`
- `explorer_url text`
- `native_symbol text`
- `is_enabled boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `chain_contracts`

合约地址表。

核心字段：

- `id uuid primary key`
- `chain_id uuid references chains(id)`
- `contract_type text not null`：`gateway`、`resource_registry`、`identity_registry`、`compute_manager`
- `contract_address text not null`
- `abi_version text`
- `deployed_tx_hash text`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `crosschain_messages`

跨链消息演示表。

核心字段：

- `id uuid primary key`
- `source_chain_id uuid references chains(id)`
- `target_chain_id uuid references chains(id)`
- `message_type text not null`
- `business_type text not null`：`resource_access`、`identity_proof`、`compute_task`
- `business_id uuid`
- `nonce text`
- `status text not null default 'pending'`
- `request_tx_hash text`
- `receipt_tx_hash text`
- `payload jsonb default '{}'::jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### 5.4 隐私身份

#### `identity_dids`

DID 登记表。

核心字段：

- `id uuid primary key`
- `profile_id uuid references profiles(id)`
- `organization_id uuid references organizations(id)`
- `did text unique not null`
- `did_document jsonb default '{}'::jsonb`
- `chain_id uuid references chains(id)`
- `status text not null default 'active'`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `credential_templates`

凭证模板表。

核心字段：

- `id uuid primary key`
- `name text not null`
- `credential_type text not null`
- `schema jsonb not null`
- `issuer_organization_id uuid references organizations(id)`
- `is_enabled boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `credentials`

凭证表。

核心字段：

- `id uuid primary key`
- `holder_profile_id uuid references profiles(id)`
- `issuer_organization_id uuid references organizations(id)`
- `template_id uuid references credential_templates(id)`
- `credential_type text not null`
- `claims jsonb not null`
- `signature text`
- `status text not null default 'valid'`
- `expires_at timestamptz`
- `revoked_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `credential_proofs`

证明记录表。

核心字段：

- `id uuid primary key`
- `credential_id uuid references credentials(id)`
- `holder_profile_id uuid references profiles(id)`
- `proof_type text not null`
- `disclosed_claims jsonb default '{}'::jsonb`
- `proof_text text not null`
- `nullifier text`
- `business_scope text`
- `status text not null default 'generated'`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `identity_events`

身份事件表。

核心字段：

- `id uuid primary key`
- `profile_id uuid references profiles(id)`
- `event_type text not null`：`did_registered`、`credential_issued`、`proof_generated`、`proof_verified`、`credential_revoked`
- `business_id uuid`
- `event_hash text`
- `metadata jsonb default '{}'::jsonb`
- `created_at timestamptz`

### 5.5 数字资源与访问控制

#### `resources`

数字资源表。

核心字段：

- `id uuid primary key`
- `name text not null`
- `description text`
- `resource_type text not null`：`commitment`、`file`、`list`、`case_dataset`
- `owner_organization_id uuid references organizations(id)`
- `chain_id uuid references chains(id)`
- `resource_hash text`
- `storage_uri text`
- `metadata jsonb default '{}'::jsonb`
- `status text not null default 'active'`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `policy_templates`

权限预设模板表。

核心字段：

- `id uuid primary key`
- `name text not null`
- `description text`
- `policy_code text not null`
- `policy_schema jsonb default '{}'::jsonb`
- `created_by uuid references profiles(id)`
- `is_builtin boolean default false`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `resource_policies`

资源策略表。

核心字段：

- `id uuid primary key`
- `resource_id uuid references resources(id)`
- `template_id uuid references policy_templates(id)`
- `policy_name text not null`
- `policy_code text not null`
- `policy_json jsonb default '{}'::jsonb`
- `read_mode text not null default 'abe_encrypted'`
- `crosschain_required boolean default true`
- `is_enabled boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `access_requests`

访问申请表。

核心字段：

- `id uuid primary key`
- `resource_id uuid references resources(id)`
- `requester_profile_id uuid references profiles(id)`
- `requester_organization_id uuid references organizations(id)`
- `proof_id uuid references credential_proofs(id)`
- `purpose text not null`
- `status text not null default 'pending'`：`pending`、`approved`、`rejected`、`expired`
- `reviewer_profile_id uuid references profiles(id)`
- `review_comment text`
- `key_envelope jsonb default '{}'::jsonb`
- `requested_at timestamptz`
- `reviewed_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `access_logs`

访问日志表。

核心字段：

- `id uuid primary key`
- `resource_id uuid references resources(id)`
- `access_request_id uuid references access_requests(id)`
- `actor_profile_id uuid references profiles(id)`
- `action text not null`：`apply`、`approve`、`reject`、`decrypt`、`download`、`policy_check_failed`
- `result text not null`：`success`、`failed`
- `tx_hash text`
- `metadata jsonb default '{}'::jsonb`
- `created_at timestamptz`

### 5.6 隐私计算

#### `compute_functions`

计算模板表。

核心字段：

- `id uuid primary key`
- `name text not null`
- `function_key text unique not null`
- `description text`
- `function_type text not null`：`sum`、`multiply`、`risk_score`、`statistics`、`psi`
- `code text`
- `input_schema jsonb default '{}'::jsonb`
- `output_schema jsonb default '{}'::jsonb`
- `is_builtin boolean default true`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `compute_tasks`

计算任务表。

核心字段：

- `id uuid primary key`
- `name text not null`
- `description text`
- `function_id uuid references compute_functions(id)`
- `initiator_profile_id uuid references profiles(id)`
- `initiator_organization_id uuid references organizations(id)`
- `source_chain_id uuid references chains(id)`
- `target_chain_id uuid references chains(id)`
- `status text not null default 'draft'`
- `parameters jsonb default '{}'::jsonb`
- `result_visibility text not null default 'initiator_only'`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `compute_task_resources`

计算任务资源关联表。

核心字段：

- `id uuid primary key`
- `task_id uuid references compute_tasks(id)`
- `resource_id uuid references resources(id)`
- `resource_chain_id uuid references chains(id)`
- `role text not null default 'input'`
- `created_at timestamptz`

#### `compute_task_participants`

计算参与方表。

核心字段：

- `id uuid primary key`
- `task_id uuid references compute_tasks(id)`
- `organization_id uuid references organizations(id)`
- `profile_id uuid references profiles(id)`
- `proof_id uuid references credential_proofs(id)`
- `status text not null default 'pending'`
- `input_commitment text`
- `public_key text`
- `confirmed_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `compute_task_events`

计算任务事件表。

核心字段：

- `id uuid primary key`
- `task_id uuid references compute_tasks(id)`
- `event_type text not null`
- `actor_profile_id uuid references profiles(id)`
- `tx_hash text`
- `metadata jsonb default '{}'::jsonb`
- `created_at timestamptz`

#### `compute_results`

计算结果表。

核心字段：

- `id uuid primary key`
- `task_id uuid references compute_tasks(id)`
- `result_hash text not null`
- `result_data jsonb default '{}'::jsonb`
- `proof_summary text`
- `submitted_tx_hash text`
- `submitted_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

### 5.7 审计与追溯

#### `audit_logs`

统一审计日志表。

核心字段：

- `id uuid primary key`
- `actor_profile_id uuid references profiles(id)`
- `actor_organization_id uuid references organizations(id)`
- `module text not null`：`identity`、`resource`、`access`、`compute`、`crosschain`、`regulation`
- `action text not null`
- `business_id uuid`
- `result text not null`
- `risk_level text not null default 'normal'`
- `metadata jsonb default '{}'::jsonb`
- `created_at timestamptz`

#### `trace_requests`

身份追溯请求表。

核心字段：

- `id uuid primary key`
- `audit_log_id uuid references audit_logs(id)`
- `requested_by uuid references profiles(id)`
- `target_profile_id uuid references profiles(id)`
- `reason text not null`
- `status text not null default 'pending_votes'`
- `required_votes integer default 2`
- `approved_votes integer default 0`
- `revealed_identity jsonb default '{}'::jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `trace_votes`

追溯投票表。

核心字段：

- `id uuid primary key`
- `trace_request_id uuid references trace_requests(id)`
- `voter_profile_id uuid references profiles(id)`
- `vote text not null`：`approve`、`reject`
- `signature text`
- `created_at timestamptz`

### 5.8 推荐索引

建议增加以下索引：

- `profiles(nextauth_user_id)`
- `profiles(role, organization_id)`
- `organizations(org_type)`
- `resources(owner_organization_id, status)`
- `resources(chain_id, resource_type)`
- `resource_policies(resource_id, is_enabled)`
- `access_requests(resource_id, status)`
- `access_requests(requester_profile_id, status)`
- `compute_tasks(initiator_profile_id, status)`
- `compute_task_participants(task_id, organization_id)`
- `audit_logs(module, business_id)`
- `audit_logs(risk_level, created_at)`
- `crosschain_messages(business_type, business_id)`
- `credential_proofs(nullifier, business_scope)`

## 6. API 与 Service 设计

### 6.1 Service 分层

建议按业务域建立 service：

- `@/app/service/dashboardService.ts`
- `@/app/service/identityService.ts`
- `@/app/service/resourceService.ts`
- `@/app/service/policyService.ts`
- `@/app/service/accessLogService.ts`
- `@/app/service/computeService.ts`
- `@/app/service/credentialService.ts`
- `@/app/service/regulatorService.ts`

每个 service 继承统一 `BaseService`，并与对应 `@/app/api/<domain>/<action>/route.ts` 一一对应。

### 6.2 API 目录建议

#### Dashboard

- `POST /api/dashboard/get-overview`
- `POST /api/dashboard/get-chain-status`
- `POST /api/dashboard/get-recent-events`

#### Identity / Credential

- `POST /api/identity/register-did`
- `POST /api/identity/get-did`
- `POST /api/credentials/issue`
- `POST /api/credentials/list`
- `POST /api/credentials/generate-proof`
- `POST /api/credentials/verify-proof`
- `POST /api/identity/events/list`
- `POST /api/identity/trace/start`
- `POST /api/identity/trace/vote`
- `POST /api/identity/trace/detail`

#### Resource / Policy

- `POST /api/resources/list`
- `POST /api/resources/create`
- `POST /api/resources/detail`
- `POST /api/resources/update`
- `POST /api/policies/list-templates`
- `POST /api/policies/create-template`
- `POST /api/policies/bind-resource-policy`
- `POST /api/access/apply`
- `POST /api/access/review`
- `POST /api/access/list`
- `POST /api/access/logs`

#### Compute

- `POST /api/compute/functions/list`
- `POST /api/compute/functions/create`
- `POST /api/compute/tasks/list`
- `POST /api/compute/tasks/create`
- `POST /api/compute/tasks/detail`
- `POST /api/compute/tasks/confirm-participant`
- `POST /api/compute/tasks/start`
- `POST /api/compute/tasks/submit-result`
- `POST /api/compute/tasks/events`

### 6.3 接口权限规则

- 医院端接口只允许 `role = hospital` 或同机构医生在授权场景下访问。
- 科研端接口只允许 `role = research` 创建访问申请和计算任务。
- 医生端接口只允许用户访问自己的 DID、凭证和证明。
- 监管端接口只允许 `role = regulator` 签发凭证、查看追溯详情和投票。
- 公共看板根据角色过滤数据，不返回其他机构的敏感详情。
- `is_admin` 仅用于 Demo 初始化、字典配置和异常修复，不作为业务默认权限。

## 7. 前端页面设计

### 7.1 整体布局

使用统一后台布局：

- 顶部 Header：系统名称、当前角色、机构、链切换器、用户菜单。
- 左侧 Sidebar：按角色展示菜单。
- 主内容区：使用 PrimeReact `Card`、`DataTable`、`TabView`、`Steps`、`Timeline`、`Dialog`。
- 移动端：Sidebar 变为抽屉，表格列表改为卡片列表，详情页操作按钮下沉。

页面视觉风格参考 `docs/web设计.md` 的四个一级标题：

- 数字资源管理
- 跨链隐私计算
- 隐私身份管理
- 医疗管理应用

另增加“系统看板”作为首页。

### 7.2 系统看板

展示模块：

- 指标卡片：资源数、访问申请、计算任务、审计事件。
- 链状态卡片：医院链、科研链、监管链状态。
- 最近跨链消息：来源链、目标链、业务类型、状态。
- Demo 下一步：根据角色给出操作入口。

PrimeReact 组件：

- `Card`
- `Tag`
- `Timeline`
- `DataTable`
- `Button`
- `Skeleton`

### 7.3 数字资源管理

资源列表：

- 顶部链切换器。
- 筛选项：资源类型、所属机构、授权状态。
- 桌面端使用 `DataTable`。
- 移动端使用资源卡片。

资源创建：

- 使用 `Steps` 分三步：基础信息、资源内容、访问策略。
- 策略选择支持模板和代码编辑文本框。
- 创建成功后 toast 提示，并跳转资源详情。

资源详情：

- 展示元数据、资源哈希、链信息、策略、访问日志。
- 如果资源为 ABE 读加密，展示“申请访问”或“解密查看”按钮。
- 无权限操作时通过 toast 提示，不直接暴露错误对象。

### 7.4 跨链隐私计算

计算任务列表：

- 展示任务名称、模板、发起方、参与方数量、状态、结果摘要。
- 状态使用 `Tag` 区分：草稿、等待确认、可执行、执行中、已完成、失败。

创建计算任务：

- 选择计算模板。
- 选择参与资源，资源标识包含链 ID 和资源 ID。
- 选择参与方条件，例如认证医院、肿瘤科、伦理审批通过。
- 提交后进入任务详情。

任务详情：

- 使用 `Timeline` 展示任务状态推进。
- 医院参与方看到“确认参与”表单。
- 发起方在全部确认后看到“开始执行”按钮。
- 完成后展示结果摘要、链上提交哈希和跨链回执。

模板管理：

- 卡片展示内置模板。
- 支持新增模板，输入模板说明、参数 schema 和 MPC 代码片段。

### 7.5 隐私身份管理

监管端凭证签发：

- 选择用户、凭证模板、有效期。
- 填写 claims，例如姓名、单位、学历、职务、科室。
- 后端签发 Demo 凭证。

医生端/科研端凭证信息：

- 展示凭证状态、签发方、有效期和可披露字段。
- 支持导入 Demo 凭证文本。

凭证使用：

- 选择证明模板。
- 选择披露字段。
- 生成 proof 文本和 nullifier。

凭证验证：

- 输入 proof 文本。
- 展示验证结果、披露字段和对应事件。

监管端恢复与追溯：

- 审计事件列表支持搜索。
- 事件详情展示事件上下文。
- 发起追溯后展示投票进度。
- 达到阈值后展示真实身份摘要和历史事件。

### 7.6 医疗管理应用

医生身份登记：

- 引导医生生成“姓名 + 单位 + 学历 + 职务 + 科室”的选择性披露证明。
- 提交后完成医生登记。
- 重复登记时通过 nullifier 展示抗女巫能力。

医院病例管理：

- 快速进入本院病例资源列表。
- 支持创建病例数据集资源。

多院病例共享：

- 提供两个预设入口：
  - 相同患者 PSI。
  - 病例症状统计。
- 选择资源后跳转创建隐私计算任务。

## 8. Demo 初始数据

建议内置以下数据，保证开箱可演示：

- 三条链：医院链、科研机构链、监管链。
- 三类机构：江苏省人民医院、南京某科研院、江苏监管机构。
- 四类用户：医院管理员、科研人员、医生、监管人员。
- 三个凭证模板：医生资格、科研资质、伦理审批。
- 三个资源：肿瘤病例数据集、慢病随访列表、脱敏统计文件。
- 四个策略模板：
  - 医生 AND 认证医院。
  - 科研人员 AND 伦理审批通过。
  - 监管人员 AND 审计用途。
  - 认证医院 AND 指定科室 AND 访问窗口有效。
- 三个计算模板：
  - 多院病例数量统计。
  - 风险评分计算。
  - 相同患者 PSI。

## 9. 实施顺序建议

### 阶段一：基础框架

完成 Next.js App Route、PrimeReact、Tailwind、NextAuth、Supabase Client、BaseService、统一布局和角色菜单。

验收标准：

- 4 个角色可登录并进入不同菜单。
- Dashboard 可展示 Mock 或数据库聚合数据。
- 前端无直接 Supabase 查询。

### 阶段二：数据库与基础 API

完成用户、组织、链配置、资源、策略、凭证、计算和审计核心表。

验收标准：

- 所有新建表 RLS 关闭。
- 后端 API 可通过 session 识别用户角色。
- 每个 API 均返回 `success`、`message`、`data`。

### 阶段三：身份与资源闭环

完成凭证签发、证明生成、资源创建、策略绑定和访问申请。

验收标准：

- 监管端可签发医生或科研凭证。
- 用户可生成 proof。
- 科研端可申请访问医院资源。
- 医院端可审批访问申请。

### 阶段四：计算与审计闭环

完成计算模板、计算任务、参与方确认、模拟执行、结果提交和审计日志。

验收标准：

- 科研端可创建多院计算任务。
- 医院端可确认参与。
- 任务可从等待确认推进到已完成。
- 监管端可看到计算和访问审计事件。

### 阶段五：移动端与演示优化

完成移动端适配、骨架屏、toast、空状态、错误态和 Demo 引导。

验收标准：

- 核心页面在手机宽度下可操作。
- 所有加载态使用 Skeleton。
- 所有错误和成功提示使用 toast。
- Demo 主流程可在 5 分钟内演示完成。

## 10. 风险与取舍

- 第一版关闭 RLS 后，后端接口权限检查必须完整，否则会出现越权风险。
- 真实 MPC、ZKP、CP-ABE 和跨链桥暂不在第一版实现，文档和字段需要明确为 Demo 模拟，避免误导。
- 资源内容如果涉及大文件，不建议直接存数据库，应存对象存储或本地文件服务，数据库只保存 URI、哈希和元数据。
- 凭证 claims 包含敏感身份信息，前端只展示当前用户或监管授权后的必要字段。
- 如果后续接入真实 Supabase Auth，需要重新设计 NextAuth 与 Supabase JWT 的关系。

## 11. 成功标准

本 Demo 完成后，应能按如下脚本演示：

1. 监管端签发医生资格和科研资质凭证。
2. 医生端生成选择性披露证明并完成医生身份登记。
3. 医院端创建病例资源并绑定访问策略。
4. 科研端使用凭证证明申请访问资源。
5. 医院端审批访问申请。
6. 科研端基于多个医院资源创建隐私计算任务。
7. 医院端确认参与并提交输入承诺。
8. 科研端启动计算并查看结果摘要。
9. 监管端查看全流程审计，并对异常事件发起追溯。

