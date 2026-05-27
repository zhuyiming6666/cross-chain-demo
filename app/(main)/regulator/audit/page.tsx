"use client";

import { useState } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";

const DEMO_LOGS = [
  { id: "1", module: "resources", action: "request", business_id: "肿瘤病例数据集", result: "granted", risk: "normal", created_at: "2026-05-26T10:30:00Z" },
  { id: "2", module: "credentials", action: "issue", business_id: "医生资格", result: "success", risk: "normal", created_at: "2026-05-26T09:15:00Z" },
  { id: "3", module: "compute", action: "create_task", business_id: "跨院病例统计", result: "success", risk: "normal", created_at: "2026-05-25T16:45:00Z" },
  { id: "4", module: "access", action: "denied", business_id: "脱敏统计文件", result: "denied", risk: "high", created_at: "2026-05-25T14:20:00Z" },
  { id: "5", module: "identity", action: "register_did", business_id: "did:medical:李医生", result: "success", risk: "normal", created_at: "2026-05-25T11:00:00Z" },
];

const MODULE_LABELS: Record<string, string> = {
  resources: "资源", credentials: "凭证", compute: "计算", access: "访问", identity: "身份",
};

const MODULE_ICONS: Record<string, string> = {
  resources: "pi pi-database", credentials: "pi pi-verified", compute: "pi pi-cog", access: "pi pi-lock", identity: "pi pi-id-card",
};

const ACTION_LABELS: Record<string, string> = {
  request: "请求访问", issue: "签发", create_task: "创建任务", denied: "拒绝访问", register_did: "注册DID",
};

const MODULE_OPTIONS = [
  { label: "全部模块", value: "" },
  { label: "资源", value: "resources" },
  { label: "凭证", value: "credentials" },
  { label: "计算", value: "compute" },
  { label: "访问", value: "access" },
  { label: "身份", value: "identity" },
];

const RISK_OPTIONS = [
  { label: "全部风险", value: "" },
  { label: "正常", value: "normal" },
  { label: "高风险", value: "high" },
];

export default function RegulatorAuditPage() {
  const [filterModule, setFilterModule] = useState("");
  const [filterRisk, setFilterRisk] = useState("");

  const filtered = DEMO_LOGS.filter((log) => {
    if (filterModule && log.module !== filterModule) return false;
    if (filterRisk && log.risk !== filterRisk) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-surface-900">审计日志</h2>
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Dropdown value={filterModule} options={MODULE_OPTIONS} onChange={(e) => setFilterModule(e.value)} placeholder="模块" className="w-full sm:w-36" />
          <Dropdown value={filterRisk} options={RISK_OPTIONS} onChange={(e) => setFilterRisk(e.value)} placeholder="风险级别" className="w-full sm:w-36" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <i className="pi pi-list text-5xl text-surface-300 mb-3" />
            <p className="text-surface-500">暂无匹配的审计日志</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {filtered.map((log) => (
                <Card key={log.id} pt={{ content: { className: "p-3" } }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <i className={`${MODULE_ICONS[log.module] || "pi pi-circle"} text-primary text-sm`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag value={MODULE_LABELS[log.module] || log.module} severity="info" />
                          <span className="text-sm font-medium text-surface-800">{ACTION_LABELS[log.action] || log.action}</span>
                        </div>
                        {log.risk === "high" && <Tag value="高风险" severity="danger" />}
                      </div>
                      <p className="text-xs text-surface-500 mt-1.5">对象: {log.business_id}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <Tag value={log.result} severity={log.result === "success" || log.result === "granted" ? "success" : log.result === "denied" ? "danger" : "warning"} />
                        <span className="text-xs text-surface-400">{new Date(log.created_at).toLocaleString("zh-CN")}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden md:block">
              <DataTable value={filtered} paginator rows={10} size="small" className="text-sm" emptyMessage="暂无审计日志">
                <Column field="module" header="模块" body={(row: { module: string }) => <Tag value={MODULE_LABELS[row.module] || row.module} severity="info" />} />
                <Column field="action" header="操作" body={(row: { action: string }) => ACTION_LABELS[row.action] || row.action} />
                <Column field="business_id" header="业务对象" />
                <Column field="result" header="结果" body={(row: { result: string }) => <Tag value={row.result} severity={row.result === "success" || row.result === "granted" ? "success" : row.result === "denied" ? "danger" : "warning"} />} />
                <Column field="risk" header="风险" body={(row: { risk: string }) => <Tag value={row.risk === "high" ? "高风险" : "正常"} severity={row.risk === "high" ? "danger" : "success"} />} />
                <Column field="created_at" header="时间" body={(r: { created_at: string }) => new Date(r.created_at).toLocaleString("zh-CN")} />
              </DataTable>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
