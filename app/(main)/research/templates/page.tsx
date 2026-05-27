"use client";

import { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";
import { ComputeService } from "@/app/service/computeService";
import type { ComputeFunctionItem } from "@/app/api/compute/functions/entity";

const computeService = new ComputeService();

const TYPE_LABELS: Record<string, string> = {
  statistics: "统计分析",
  risk_score: "风险评分",
  psi: "隐私求交",
};

const TYPE_ICONS: Record<string, string> = {
  statistics: "pi pi-chart-bar",
  risk_score: "pi pi-exclamation-triangle",
  psi: "pi pi-users",
};

const TYPE_OPTIONS = [
  { label: "全部类型", value: "" },
  { label: "统计分析", value: "statistics" },
  { label: "风险评分", value: "risk_score" },
  { label: "隐私求交", value: "psi" },
];

export default function ResearchTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [functions, setFunctions] = useState<ComputeFunctionItem[]>([]);
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await computeService.getFunctions();
        if (result) setFunctions(result.functions);
      } catch { setFunctions([]); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const filtered = filterType ? functions.filter((f) => f.function_type === filterType) : functions;

  if (loading) return <Skeleton height="400px" />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-surface-900">计算模板</h2>
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Dropdown value={filterType} options={TYPE_OPTIONS} onChange={(e) => setFilterType(e.value)} placeholder="函数类型" className="w-full sm:w-44" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <i className="pi pi-file-code text-5xl text-surface-300 mb-3" />
            <p className="text-surface-500">暂无计算模板</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {filtered.map((f) => (
                <Card key={f.id} pt={{ content: { className: "p-4" } }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <i className={`${TYPE_ICONS[f.function_type] || "pi pi-code"} text-primary`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-surface-800">{f.name}</p>
                        <Tag value={f.is_builtin ? "内置" : "自定义"} severity={f.is_builtin ? "success" : "warning"} />
                      </div>
                      <code className="text-xs bg-surface-100 px-1.5 py-0.5 rounded mt-1 inline-block">{f.function_key}</code>
                      <p className="text-xs text-surface-500 mt-1">{f.description || "暂无描述"}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden md:block">
              <DataTable value={filtered} size="small" className="text-sm" emptyMessage="暂无模板">
                <Column field="name" header="名称" sortable />
                <Column field="function_key" header="标识" body={(row: { function_key: string }) => <code className="text-xs bg-surface-100 px-2 py-0.5 rounded">{row.function_key}</code>} />
                <Column field="function_type" header="类型" body={(row: { function_type: string }) => <Tag value={TYPE_LABELS[row.function_type] || row.function_type} severity="info" />} />
                <Column field="description" header="描述" />
                <Column field="is_builtin" header="来源" body={(row: { is_builtin: boolean }) => <Tag value={row.is_builtin ? "内置" : "自定义"} severity={row.is_builtin ? "success" : "warning"} />} />
              </DataTable>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
