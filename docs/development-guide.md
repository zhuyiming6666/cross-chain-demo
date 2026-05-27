# 开发指南

本文档详细介绍项目各模块结构、API 接口、开发规范和扩展方式，供后续开发参考。

## 目录

- [项目总览](#项目总览)
- [后端开发](#后端开发)
- [前端开发](#前端开发)
- [智能合约](#智能合约)
- [待实现接口清单](#待实现接口清单)
- [开发规范](#开发规范)

---

## 项目总览

```
jiangsu-crosschain-demo/
├── backend/        # Python FastAPI 后端（分层架构）
├── frontend/       # Vue 3 + TypeScript 前端（纯展示层）
├── contract/       # Foundry Solidity 智能合约
├── scripts/        # 部署与运维脚本
└── docs/           # 文档
```

### 启动命令

```bash
# 后端（端口 8100）
cd backend
python3 -m venv .venv          # 首次需要创建虚拟环境
source .venv/bin/activate
pip install -r requirements.txt # 首次或依赖变更时安装
uvicorn main:app --host 0.0.0.0 --port 8100 --reload

# 前端（默认端口 5173，代理 /api → :8100）
cd frontend
npm install                     # 首次或依赖变更时安装
npx vite --host

# 合约
cd contract
forge build && forge test
```

---

## 后端开发

### 分层架构

```
backend/
├── main.py          # 入口：注册路由 + 中间件，不写业务逻辑
├── api/             # 路由层
├── service/         # 业务逻辑层
├── model/           # 数据模型层
├── infra/           # 基础设施层
└── configs/         # 配置文件
```

### 各层职责与开发规则

#### api/ — 路由层

每个文件对应一个功能模块，只做三件事：
1. 定义路由路径和 HTTP 方法
2. 参数校验（通过 Pydantic model 自动完成）
3. 调用对应的 service 方法并返回结果

```python
# 示例：backend/api/identity.py
@router.post("/issue", response_model=IssueResponse)
def issue_credential(req: IssueRequest) -> IssueResponse:
    return get_service().issue(req)
```

新增模块时：
1. 在 `api/` 下创建 `xxx.py`
2. 定义 `router = APIRouter(prefix="/api/xxx", tags=["xxx"])`
3. 在 `main.py` 中 `app.include_router(xxx_router)`

#### service/ — 业务逻辑层

包含所有业务规则、流程编排、链交互协调。特点：
- 不依赖 FastAPI（可独立单元测试）
- 通过 `infra/blockchain.py` 的 `ChainClient` 与链交互
- 管理自己的状态存储

```python
# 示例：backend/service/identity_service.py
class IdentityService:
    def issue(self, req: IssueRequest) -> IssueResponse:
        # 业务校验 → 签名 → 存储 → 返回
```

#### model/ — 数据模型层

- 请求/响应模型：使用 Pydantic `BaseModel`
- 内部数据结构：使用 `@dataclass`
- 每个模块一个文件（identity.py、contract.py）

#### infra/ — 基础设施层

| 文件 | 职责 |
|------|------|
| `config.py` | 加载 YAML 配置、链网络信息 |
| `blockchain.py` | web3 连接管理、合约调用封装 |
| `exceptions.py` | 统一异常类（AppError、NotFoundError 等） |
| `middleware.py` | CORS、全局错误处理 |

### 已实现的 API 接口

#### 身份管理 `/api/identity/*`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/meta` | 元数据（链列表、凭证模板、监管方等） |
| POST | `/issue` | 颁发凭证 |
| POST | `/proof/generate` | 生成零知识证明 |
| POST | `/proof/verify` | 验证证明 |
| GET | `/events` | 事件列表（支持搜索和链过滤） |
| GET | `/events/{event_id}` | 事件详情 |
| POST | `/recovery/sign` | 监管方签名投票 |
| GET | `/recovery/status/{event_id}` | 恢复状态查询 |
| POST | `/recovery/reset/{event_id}` | 重置恢复状态 |
| GET | `/trace/{user_handle}` | 用户追溯 |
| POST | `/demo/reset` | 演示数据复位 |
| GET | `/demo/credentials` | 获取演示凭证 |

#### 合约升级 `/api/upgrade/*`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/contracts` | 列出已部署合约 |
| GET | `/contracts/{name}/source` | 获取合约模板源码 |
| GET | `/owner` | 获取管理员地址 |
| POST | `/contracts/{name}/check` | 编译检查 |
| POST | `/contracts/{name}/upgrade` | 执行升级 |
| POST | `/contracts/{name}/upload` | 上传文件升级 |

#### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 服务健康状态 |

### 如何新增一个后端模块

以新增「交易服务」模块为例：

```bash
# 1. 创建 model
touch backend/model/trading.py
# 定义 Pydantic 请求/响应模型

# 2. 创建 service
touch backend/service/trading_service.py
# 实现 TradingService 类，包含业务逻辑

# 3. 创建 api
touch backend/api/trading.py
# 定义路由，调用 TradingService

# 4. 注册路由
# 在 backend/main.py 中添加：
# from backend.api.trading import router as trading_router
# app.include_router(trading_router)
```

---

## 前端开发

### 目录结构

```
frontend/src/
├── api/             # HTTP 请求封装（不含业务逻辑）
├── types/           # TypeScript 类型定义
├── composables/     # Vue 组合式函数（可复用 UI 逻辑）
├── views/           # 页面组件
├── store/           # Pinia 状态管理（仅 UI 状态）
├── components/      # 公共组件
├── layout/          # 布局组件
├── router/          # 路由配置
├── utils/           # 工具函数（日期、字符串、权限等）
└── styles/          # SCSS 样式
```

### API 客户端规范

所有 API 请求通过 `api/http.ts` 统一发出：

```typescript
// api/http.ts 提供 http.get / http.post / http.put / http.delete
import { http } from './http'

// 各模块 API 文件只做请求封装
export const xxxApi = {
  getList: () => http.get<ListResponse>('/api/xxx/list'),
  create: (body: CreateReq) => http.post<Item>('/api/xxx', body),
}
```

### 如何新增前端模块

1. 在 `types/` 下创建类型定义文件
2. 在 `api/` 下创建 API 客户端文件（引用 http.ts）
3. 在 `views/` 下创建页面组件
4. 在 `router/` 中注册路由
5. 如有跨组件状态需求，在 `store/` 中添加 Pinia store

### 钱包连接

钱包连接保留在前端（`composables/useWallet.ts`），只做：
- MetaMask 连接/断开
- 消息签名（personal_sign）

签名后的数据提交给后端处理，前端不直接调用合约。

---

## 智能合约

### 目录结构

```
contract/
├── src/                 # 合约源码
│   ├── IdentityRegistry.sol      # 身份凭证锚点
│   ├── CrossChainGateway.sol     # 跨链网关
│   ├── CrossChainContext.sol     # 跨链上下文
│   └── CrossChainMessageState.sol
├── script/              # 部署脚本
├── test/                # Foundry 测试
├── lib/                 # 依赖（forge-std）
└── foundry.toml
```

### 常用命令

```bash
forge build              # 编译
forge test               # 运行测试
forge test -vvv          # 详细输出
forge script script/IdentityRegistry.s.sol:IdentityRegistryScript \
  --rpc-url http://127.0.0.1:8545 --broadcast --private-key $KEY
```

---

## 待实现接口清单

以下模块目前前端使用 mock 数据（`Promise.resolve`），需要后端补齐真实接口。

### 用户认证 `/api/auth/*`

| 方法 | 路径 | 说明 | 前端文件 |
|------|------|------|----------|
| POST | `/login` | 用户登录（返回 token） | `api/login.ts` |
| GET | `/captcha` | 获取验证码图片 | `api/login.ts` |
| GET | `/userinfo` | 获取当前用户信息 | `api/login.ts` |

实现建议：JWT token 认证，后端在 `infra/` 中添加 auth 中间件。

### 用户管理 `/api/user/*`

| 方法 | 路径 | 说明 | 前端文件 |
|------|------|------|----------|
| GET | `/statistics` | 平台统计数据（用户数、企业数等） | `api/user.ts` |
| GET | `/assets` | 用户数据资产列表（分页） | `api/user.ts` |
| GET | `/purchase-record` | 购买记录 | `api/user.ts` |

实现建议：创建 `backend/api/user.py` + `backend/service/user_service.py`，数据可先用 SQLite 或内存存储。

### 数据要素 `/api/data-element/*`

| 方法 | 路径 | 说明 | 前端文件 |
|------|------|------|----------|
| GET | `/list` | 数据要素列表（支持搜索） | `api/data-element.ts` |
| GET | `/{id}` | 数据要素详情 | `api/data-element.ts` |
| POST | `/` | 创建数据要素 | 待实现 |
| PUT | `/{id}` | 更新数据要素 | 待实现 |

实现建议：创建 `backend/api/data_element.py` + `backend/service/data_element_service.py`。

### 数字资源 `/api/digital-resource/*`

| 方法 | 路径 | 说明 | 前端文件 |
|------|------|------|----------|
| GET | `/list` | 数字资源列表 | `api/digital-resource.ts` |
| GET | `/{id}` | 资源详情 | `api/digital-resource.ts` |

实现建议：与数据要素类似，可共用部分数据结构。

### 交易服务 `/api/trading/*`

| 方法 | 路径 | 说明 | 前端文件 |
|------|------|------|----------|
| GET | `/auction/list` | 拍卖列表 | 待实现 |
| POST | `/auction/bid` | 出价 | 待实现 |
| GET | `/orderbook` | 订单簿 | 待实现 |
| POST | `/orderbook/order` | 下单 | 待实现 |
| GET | `/liquidity/pools` | 流动性池列表 | 待实现 |
| POST | `/liquidity/add` | 添加流动性 | 待实现 |

实现建议：交易逻辑需要与链上合约（DataAssetAuction、DataAssetOrderBook、DataAssetLiquidityPool）配合。

### 隐私计算 `/api/privacy/*`

| 方法 | 路径 | 说明 | 前端文件 |
|------|------|------|----------|
| GET | `/function/list` | 计算函数列表 | `api/privacy-compute.ts` |
| POST | `/task` | 创建计算任务 | `api/privacy-compute.ts` |
| GET | `/task/{taskId}/events` | 任务事件流 | `api/privacy-compute.ts` |
| POST | `/task/{taskId}/run` | 触发计算 | `api/privacy-compute.ts` |

实现建议：后端代理转发到 `mpc-management` 项目，创建 `backend/api/privacy_compute.py` + `backend/service/privacy_compute_service.py`。

### 钱包/账户 `/api/purse/*`

| 方法 | 路径 | 说明 | 前端文件 |
|------|------|------|----------|
| GET | `/balance` | 查询余额 | `api/purse.ts` |
| POST | `/transfer` | 转账 | `api/purse.ts` |

---

## 开发规范

### 后端规范

1. **异常处理**：业务错误统一抛出 `infra/exceptions.py` 中定义的异常类，中间件自动转为 HTTP 响应
2. **类型标注**：所有函数必须有完整的类型标注
3. **请求模型**：入参使用 Pydantic BaseModel，自动校验
4. **Service 单例**：每个 API 模块通过 `get_service()` 获取 service 实例（懒加载）
5. **配置管理**：所有配置文件放 `backend/configs/`，通过 `infra/config.py` 加载

### 前端规范

1. **API 调用**：所有请求通过 `api/http.ts`，不直接使用 fetch
2. **类型定义**：API 相关类型放 `types/` 目录，组件内部类型就近定义
3. **状态管理**：只有跨组件共享的 UI 状态放 Pinia，接口数据不放 store
4. **组合式函数**：可复用的 UI 逻辑抽取到 `composables/`
5. **不做链交互**：前端不直接调用合约，链上操作全部委托后端

### Git 规范

- 分支命名：`feature/xxx`、`fix/xxx`、`refactor/xxx`
- 提交信息：中文，简洁描述变更目的
- 每个功能模块一个 PR

### 接口迁移步骤（将 mock API 迁移到真实后端）

1. 后端：创建 model → service → api 三个文件
2. 后端：在 `main.py` 注册路由
3. 前端：将 `api/xxx.ts` 中的 `Promise.resolve` 替换为 `http.get/post` 调用
4. 前端：确保类型定义与后端响应一致
5. 测试：启动后端，验证接口联通
