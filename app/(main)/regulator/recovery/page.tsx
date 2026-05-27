"use client";

import { useRef } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";

const DEMO_TRACES = [
  { id: "1", target: "did:medical:user001", reason: "医疗纠纷调查", status: "pending_votes", required: 2, approved: 1, created_at: "2026-05-26T08:00:00Z" },
  { id: "2", target: "did:medical:user002", reason: "异常访问行为追溯", status: "approved", required: 2, approved: 2, created_at: "2026-05-25T12:30:00Z" },
];

const STATUS_LABELS: Record<string, string> = {
  pending_votes: "待投票", approved: "已批准", rejected: "已拒绝", revealed: "已揭示",
};

const STATUS_SEVERITY: Record<string, "info" | "warning" | "success" | "danger"> = {
  pending_votes: "warning", approved: "success", rejected: "danger", revealed: "info",
};

const STATUS_ICONS: Record<string, string> = {
  pending_votes: "pi pi-clock", approved: "pi pi-check-circle", rejected: "pi pi-times-circle", revealed: "pi pi-eye",
};

export default function RegulatorRecoveryPage() {
  const toast = useRef<Toast>(null);

  return (
    <div className="space-y-4">
      <Toast ref={toast} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-surface-900">身份追溯</h2>
        <Button icon="pi pi-plus" label="新建追溯请求" onClick={() => toast.current?.show({ severity: "info", summary: "Demo 提示", detail: "新建追溯请求功能将在后续版本实现" })} />
      </div>

      {DEMO_TRACES.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <i className="pi pi-search text-5xl text-surface-300 mb-3" />
            <p className="text-surface-500">暂无追溯请求</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {DEMO_TRACES.map((t) => (
              <Card key={t.id} pt={{ content: { className: "p-4" } }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <i className={`${STATUS_ICONS[t.status] || "pi pi-search"} text-primary`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-surface-100 px-2 py-0.5 rounded">{t.target}</code>
                      <Tag value={STATUS_LABELS[t.status] || t.status} severity={STATUS_SEVERITY[t.status] || "info"} />
                    </div>
                    <p className="text-xs text-surface-500 mt-1.5">原因: {t.reason}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-surface-500">投票进度: {t.approved}/{t.required}</span>
                      <Button label="投票" size="small" text severity="info" disabled={t.status !== "pending_votes"} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="hidden md:block">
            <Card>
              <DataTable value={DEMO_TRACES} size="small" className="text-sm">
                <Column field="target" header="目标 DID" body={(row: { target: string }) => <code className="text-xs bg-surface-100 px-2 py-0.5 rounded">{row.target}</code>} />
                <Column field="reason" header="追溯原因" />
                <Column field="status" header="状态" body={(row: { status: string }) => <Tag value={STATUS_LABELS[row.status] || row.status} severity={STATUS_SEVERITY[row.status] || "info"} />} />
                <Column field="required" header="所需投票" body={(row: { required: number; approved: number }) => <span>{row.approved}/{row.required}</span>} />
                <Column field="created_at" header="创建时间" body={(r: { created_at: string }) => new Date(r.created_at).toLocaleString("zh-CN")} />
                <Column
                  header="操作"
                  body={(row: { status: string }) => (
                    <Button label="投票" size="small" text severity="info" disabled={row.status !== "pending_votes"} />
                  )}
                  className="w-24"
                />
              </DataTable>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
