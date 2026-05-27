"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { ResourceService } from "@/app/service/resourceService";
import type { ResourceDetailDto } from "@/app/api/resources/[id]/entity";

const resourceService = new ResourceService();

const TYPE_LABELS: Record<string, string> = {
  case_dataset: "病例数据集",
  file: "文件",
  list: "列表",
  commitment: "承诺",
};

const TYPE_SEVERITY: Record<string, "info" | "warning" | "success" | "danger"> = {
  case_dataset: "info",
  file: "warning",
  list: "success",
  commitment: "danger",
};

const ACTION_LABELS: Record<string, string> = {
  request: "请求访问",
  granted: "已授权",
  denied: "已拒绝",
  decrypted: "已解密",
  modified: "已修改",
};

const ACTION_SEVERITY: Record<string, "info" | "success" | "danger" | "warning"> = {
  request: "info",
  granted: "success",
  denied: "danger",
  decrypted: "warning",
  modified: "warning",
};

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState<ResourceDetailDto | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        const result = await resourceService.getResourceDetail(id);
        if (result) {
          setResource(result);
        } else {
          toast.current?.show({ severity: "error", summary: "加载失败", detail: "资源不存在" });
        }
      } catch {
        toast.current?.show({ severity: "error", summary: "网络错误", detail: "" });
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="40px" width="300px" />
        <Skeleton height="200px" />
        <Skeleton height="200px" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-12">
        <i className="pi pi-exclamation-triangle text-5xl text-surface-300 mb-3" />
        <p className="text-surface-500 mb-3">资源不存在或已删除</p>
        <Button label="返回列表" onClick={() => router.push("/hospital/resources")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => router.push("/hospital/resources")} />
          <h2 className="text-2xl font-bold text-surface-900">{resource.name}</h2>
          <Tag value={resource.status === "active" ? "激活" : "停用"} severity={resource.status === "active" ? "success" : "warning"} />
        </div>
        <div className="flex gap-2">
          <Button icon="pi pi-pencil" label="编辑" severity="secondary" text />
          <Button icon="pi pi-trash" label="删除" severity="danger" text />
        </div>
      </div>

      {/* Basic Info */}
      <Card title="基本信息" pt={{ content: { className: "p-0" } }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-surface-500">资源名称</span>
            <p className="text-surface-900 font-medium">{resource.name}</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">资源类型</span>
            <p>
              <Tag value={TYPE_LABELS[resource.resource_type] || resource.resource_type} severity={TYPE_SEVERITY[resource.resource_type] || "info"} />
            </p>
          </div>
          <div>
            <span className="text-sm text-surface-500">所属链</span>
            <p className="text-surface-900 font-mono text-sm">{resource.chain_name} ({resource.chain_key})</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">所属组织</span>
            <p className="text-surface-900">{resource.org_name}</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">资源哈希</span>
            <p className="text-surface-900 font-mono text-sm truncate max-w-xs" title={resource.resource_hash}>{resource.resource_hash || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">存储地址</span>
            <p className="text-surface-900 font-mono text-sm truncate max-w-xs" title={resource.storage_uri}>{resource.storage_uri || "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-sm text-surface-500">描述</span>
            <p className="text-surface-700">{resource.description || "暂无描述"}</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">创建时间</span>
            <p className="text-surface-700">{new Date(resource.created_at).toLocaleString("zh-CN")}</p>
          </div>
        </div>
      </Card>

      {/* Policies */}
      <Card title="访问策略">
        {resource.policies.length === 0 ? (
          <div className="text-center py-8">
            <i className="pi pi-shield text-4xl text-surface-300 mb-2" />
            <p className="text-surface-500">暂无绑定策略</p>
          </div>
        ) : (
          <DataTable value={resource.policies} size="small" className="text-sm" emptyMessage="暂无策略">
            <Column field="policy_name" header="策略名称" />
            <Column field="policy_code" header="策略规则" body={(row: { policy_code: string }) => <code className="text-xs bg-surface-100 px-2 py-0.5 rounded">{row.policy_code}</code>} />
            <Column field="read_mode" header="读取模式" />
            <Column field="crosschain_required" header="跨链" body={(row: { crosschain_required: boolean }) => <Tag value={row.crosschain_required ? "需要" : "不需要"} severity={row.crosschain_required ? "warning" : "info"} />} />
            <Column field="is_enabled" header="状态" body={(row: { is_enabled: boolean }) => <Tag value={row.is_enabled ? "启用" : "禁用"} severity={row.is_enabled ? "success" : "danger"} />} />
          </DataTable>
        )}
      </Card>

      {/* Access Logs */}
      <Card title="访问日志">
        {resource.access_logs.length === 0 ? (
          <div className="text-center py-8">
            <i className="pi pi-list text-4xl text-surface-300 mb-2" />
            <p className="text-surface-500">暂无访问记录</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {resource.access_logs.map((log) => (
                <Card key={log.id} pt={{ content: { className: "p-3" } }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <Tag value={ACTION_LABELS[log.action] || log.action} severity={ACTION_SEVERITY[log.action] || "info"} />
                      <p className="text-xs text-surface-500 mt-1">{new Date(log.created_at).toLocaleString("zh-CN")}</p>
                    </div>
                    <Tag value={log.result} severity={log.result === "success" ? "success" : "danger"} />
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden md:block">
              <DataTable value={resource.access_logs} size="small" className="text-sm" emptyMessage="暂无访问记录">
                <Column field="action" header="操作" body={(row: { action: string }) => <Tag value={ACTION_LABELS[row.action] || row.action} severity={ACTION_SEVERITY[row.action] || "info"} />} />
                <Column field="result" header="结果" body={(row: { result: string }) => <Tag value={row.result} severity={row.result === "success" ? "success" : "danger"} />} />
                <Column field="tx_hash" header="交易哈希" body={(row: { tx_hash: string }) => <span className="font-mono text-xs">{row.tx_hash ? `${row.tx_hash.slice(0, 10)}...` : "-"}</span>} />
                <Column field="created_at" header="时间" body={(row: { created_at: string }) => new Date(row.created_at).toLocaleString("zh-CN")} />
              </DataTable>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
