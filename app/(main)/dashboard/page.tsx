"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Timeline } from "primereact/timeline";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { DashboardService } from "@/app/service/dashboardService";
import type { GetOverviewResponseDto } from "@/app/api/dashboard/get-overview/entity";

const dashboardService = new DashboardService();

const ROLE_STEPS: Record<string, string[]> = {
  regulator: ["签发医生/科研凭证", "查看审计事件", "对异常事件发起追溯", "多监管方投票达到阈值", "揭示原始身份"],
  hospital: ["创建病例资源", "绑定访问策略", "审批访问申请", "确认参与计算任务", "查看计算与访问审计"],
  research: ["浏览资源目录", "使用凭证申请访问", "创建隐私计算任务", "等待参与方确认", "启动计算并查看结果"],
  doctor: ["注册 DID 或绑定 Demo DID", "导入/查看资格凭证", "生成选择性披露证明", "使用证明登记医生身份", "参与医疗业务场景"],
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GetOverviewResponseDto | null>(null);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const user = session?.user as any;

  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await dashboardService.getOverview();
        if (result) setData(result);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height="28px" width="300px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} height="120px" />)}
        </div>
        <Skeleton height="200px" />
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="text-center py-12">
        <i className="pi pi-exclamation-triangle text-5xl text-surface-300 mb-3" />
        <p className="text-surface-500">看板数据加载失败，请检查网络或稍后重试</p>
      </div>
    );
  }

  const stats = data;
  const steps = ROLE_STEPS[user?.role] || ROLE_STEPS.doctor;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">
          欢迎，{user?.displayName || "用户"}
        </h2>
        <p className="text-surface-500 mt-1">当前角色：{user?.organizationName} · {user?.role === "hospital" ? "医院端" : user?.role === "research" ? "科研端" : user?.role === "doctor" ? "医生端" : "监管端"}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card pt={{ content: { className: "p-4" } }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500">数据资源</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{stats.resources}</p>
            </div>
            <i className="pi pi-database text-3xl text-primary/60" />
          </div>
        </Card>
        <Card pt={{ content: { className: "p-4" } }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500">访问申请</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{stats.accessRequests}</p>
            </div>
            <i className="pi pi-file-edit text-3xl text-amber-500/60" />
          </div>
        </Card>
        <Card pt={{ content: { className: "p-4" } }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500">计算任务</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{stats.computeTasks}</p>
            </div>
            <i className="pi pi-cog text-3xl text-emerald-500/60" />
          </div>
        </Card>
        <Card pt={{ content: { className: "p-4" } }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500">审计事件</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{stats.auditEvents}</p>
            </div>
            <i className="pi pi-shield text-3xl text-red-400/60" />
          </div>
        </Card>
      </div>

      {/* Chains & Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="链状态" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
          <div className="space-y-3">
            {stats.chains.length > 0 ? stats.chains.map((chain) => (
              <div key={chain.chain_key} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                <div>
                  <p className="font-medium text-surface-800">{chain.name}</p>
                  <p className="text-xs text-surface-400">{chain.chain_key}</p>
                </div>
                <Tag value={chain.status === "active" ? "运行中" : "异常"} severity={chain.status === "active" ? "success" : "danger"} />
              </div>
            )) : (
              <>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-surface-800">医院链</p>
                    <p className="text-xs text-surface-400">chain_hospital</p>
                  </div>
                  <Tag value="运行中" severity="success" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-surface-800">科研机构链</p>
                    <p className="text-xs text-surface-400">chain_research</p>
                  </div>
                  <Tag value="运行中" severity="success" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-surface-800">监管链</p>
                    <p className="text-xs text-surface-400">chain_regulator</p>
                  </div>
                  <Tag value="运行中" severity="success" />
                </div>
              </>
            )}
          </div>
        </Card>

        <Card title="Demo 操作指引" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
          <Timeline
            value={steps.map((s, i) => ({ step: s, index: i + 1 }))}
            content={(item) => (
              <div className="flex items-center gap-2">
                <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {item.index}
                </span>
                <span className="text-sm text-surface-700">{item.step}</span>
              </div>
            )}
          />
        </Card>
      </div>

      {/* Recent cross-chain messages */}
      <Card title="最近跨链消息" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
        {stats.recentMessages.length > 0 ? (
          <DataTable value={stats.recentMessages} size="small" className="text-sm">
            <Column field="business_type" header="业务类型" />
            <Column field="source" header="源链" />
            <Column field="target" header="目标链" />
            <Column field="status" header="状态" body={(row: { status: string }) => (
              <Tag value={row.status === "completed" ? "已完成" : "处理中"} severity={row.status === "completed" ? "success" : "warning"} />
            )} />
          </DataTable>
        ) : (
          <p className="text-sm text-surface-400 py-4 text-center">暂无跨链消息，完成 Demo 流程后自动产生</p>
        )}
      </Card>
    </div>
  );
}
