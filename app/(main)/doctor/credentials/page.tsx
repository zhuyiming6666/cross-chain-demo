"use client";

import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

const DEMO_CREDENTIALS = [
  { id: "1", type: "doctor_license", name: "医生资格", issuer: "江苏监管机构", status: "valid", issued: "2026-01-15", expires: "2029-01-14" },
  { id: "2", type: "ethics_approval", name: "伦理审批", issuer: "江苏监管机构", status: "valid", issued: "2026-03-20", expires: "2027-03-19" },
];

const TYPE_LABELS: Record<string, string> = { doctor_license: "医生资格", research_qualification: "科研资质", ethics_approval: "伦理审批" };

const TYPE_ICONS: Record<string, string> = { doctor_license: "pi pi-id-card", research_qualification: "pi pi-book", ethics_approval: "pi pi-check-circle" };

export default function DoctorCredentialsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-surface-900">我的凭证</h2>
        <Button icon="pi pi-plus" label="导入凭证" severity="secondary" text disabled />
      </div>

      {DEMO_CREDENTIALS.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <i className="pi pi-verified text-5xl text-surface-300 mb-3" />
            <p className="text-surface-500 mb-3">暂无凭证</p>
            <Button icon="pi pi-plus" label="导入凭证" severity="secondary" />
          </div>
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {DEMO_CREDENTIALS.map((c) => (
              <Card key={c.id} pt={{ content: { className: "p-4" } }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <i className={`${TYPE_ICONS[c.type] || "pi pi-verified"} text-primary`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-surface-800">{c.name}</p>
                      <Tag value="有效" severity="success" />
                    </div>
                    <p className="text-xs text-surface-500 mt-1">签发方: {c.issuer}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{c.issued} ~ {c.expires}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="hidden md:block">
            <Card>
              <DataTable value={DEMO_CREDENTIALS} size="small" className="text-sm">
                <Column field="name" header="凭证名称" />
                <Column field="type" header="类型" body={(row: { type: string }) => <Tag value={TYPE_LABELS[row.type] || row.type} severity="info" />} />
                <Column field="issuer" header="签发方" />
                <Column field="status" header="状态" body={(row: { status: string }) => <Tag value={row.status === "valid" ? "有效" : row.status} severity={row.status === "valid" ? "success" : "danger"} />} />
                <Column field="issued" header="签发日期" />
                <Column field="expires" header="过期日期" />
              </DataTable>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
