"use client";

import { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ResourceService } from "@/app/service/resourceService";

interface PolicyRow {
  id: string;
  resource_name: string;
  policy_name: string;
  policy_code: string;
  read_mode: string;
  crosschain_required: boolean;
  is_enabled: boolean;
}

const resourceService = new ResourceService();

const DEMO_POLICIES: PolicyRow[] = [
  { id: "1", resource_name: "肿瘤病例数据集", policy_name: "医生且认证医院", policy_code: "role=doctor AND org=verified_hospital", read_mode: "decrypted", crosschain_required: true, is_enabled: true },
  { id: "2", resource_name: "慢病随访数据", policy_name: "科研人员且伦理审批通过", policy_code: "role=research AND ethics_approved=true", read_mode: "aggregate", crosschain_required: false, is_enabled: true },
  { id: "3", resource_name: "脱敏统计文件", policy_name: "监管人员且审计用途", policy_code: "role=regulator AND purpose=audit", read_mode: "decrypted", crosschain_required: true, is_enabled: false },
];

const MODE_OPTIONS = [
  { label: "全部模式", value: "" },
  { label: "decrypted", value: "decrypted" },
  { label: "aggregate", value: "aggregate" },
];

export default function HospitalPoliciesPage() {
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [filterMode, setFilterMode] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        await resourceService.listResources();
        setPolicies(DEMO_POLICIES);
      } catch {
        setPolicies(DEMO_POLICIES);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = policies.filter((p) => {
    if (filterMode && p.read_mode !== filterMode) return false;
    if (search && !p.resource_name.includes(search) && !p.policy_name.includes(search)) return false;
    return true;
  });

  if (loading) return <Skeleton height="400px" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-surface-900">权限策略</h2>
        <Button icon="pi pi-plus" label="创建策略" severity="secondary" text disabled />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Dropdown value={filterMode} options={MODE_OPTIONS} onChange={(e) => setFilterMode(e.value)} placeholder="读取模式" className="w-full sm:w-40" />
          <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资源或策略名称..." className="w-full sm:w-60" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <i className="pi pi-shield text-5xl text-surface-300 mb-3" />
            <p className="text-surface-500">暂无绑定策略</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <Card key={p.id} pt={{ content: { className: "p-3" } }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-surface-800">{p.policy_name}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{p.resource_name}</p>
                    </div>
                    <Tag value={p.is_enabled ? "启用" : "禁用"} severity={p.is_enabled ? "success" : "danger"} />
                  </div>
                  <code className="text-xs bg-surface-100 px-2 py-0.5 rounded block mb-2">{p.policy_code}</code>
                  <div className="flex items-center gap-2">
                    <Tag value={p.read_mode} severity="info" />
                    <Tag value={p.crosschain_required ? "需跨链" : "不需跨链"} severity={p.crosschain_required ? "warning" : "info"} />
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden md:block">
              <DataTable value={filtered} size="small" className="text-sm" emptyMessage="暂无策略">
                <Column field="resource_name" header="关联资源" sortable />
                <Column field="policy_name" header="策略名称" />
                <Column field="policy_code" header="策略规则" body={(row: PolicyRow) => <code className="text-xs bg-surface-100 px-2 py-0.5 rounded">{row.policy_code}</code>} />
                <Column field="read_mode" header="读取模式" body={(row: PolicyRow) => <Tag value={row.read_mode} severity="info" />} />
                <Column field="crosschain_required" header="跨链" body={(row: PolicyRow) => <Tag value={row.crosschain_required ? "需要" : "不需要"} severity={row.crosschain_required ? "warning" : "info"} />} />
                <Column field="is_enabled" header="状态" body={(row: PolicyRow) => <Tag value={row.is_enabled ? "启用" : "禁用"} severity={row.is_enabled ? "success" : "danger"} />} />
              </DataTable>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
