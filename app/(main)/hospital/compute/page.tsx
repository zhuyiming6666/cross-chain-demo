"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import { ComputeService } from "@/app/service/computeService";
import type { ComputeTaskItem } from "@/app/api/compute/tasks/list/entity";

const computeService = new ComputeService();

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", ready: "就绪", running: "运行中",
  result_submitted: "结果已提交", completed: "已完成", failed: "失败",
};

const STATUS_SEVERITY: Record<string, "info" | "warning" | "success" | "danger"> = {
  draft: "info", ready: "warning", running: "warning",
  result_submitted: "info", completed: "success", failed: "danger",
};

export default function HospitalComputePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ComputeTaskItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await computeService.listTasks();
        if (result) setTasks(result.tasks);
      } catch { setTasks([]); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) return <Skeleton height="400px" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-surface-900">计算任务</h2>
        <Button icon="pi pi-plus" label="创建任务" onClick={() => router.push("/research/compute/create")} />
      </div>
      <Card>
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <i className="pi pi-cog text-5xl text-surface-300 mb-3" />
            <p className="text-surface-500">暂无计算任务</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {tasks.map((t) => (
                <Card key={t.id} pt={{ content: { className: "p-3" } }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-surface-800">{t.name}</p>
                      <p className="text-xs text-surface-500 mt-1">{t.function_name} · {t.resource_count} 个资源</p>
                    </div>
                    <Tag value={STATUS_LABELS[t.status] || t.status} severity={STATUS_SEVERITY[t.status] || "info"} />
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden md:block">
              <DataTable value={tasks} paginator rows={10} size="small" className="text-sm" emptyMessage="暂无计算任务">
                <Column field="name" header="任务名称" sortable />
                <Column field="function_name" header="计算函数" />
                <Column field="source_chain_name" header="源链" />
                <Column field="target_chain_name" header="目标链" />
                <Column field="status" header="状态" body={(row: { status: string }) => <Tag value={STATUS_LABELS[row.status] || row.status} severity={STATUS_SEVERITY[row.status] || "info"} />} />
                <Column field="resource_count" header="资源数" />
                <Column field="created_at" header="创建时间" body={(r: { created_at: string }) => new Date(r.created_at).toLocaleDateString("zh-CN")} />
                <Column header="操作" body={(row: { id: string }) => <Button icon="pi pi-eye" text rounded severity="info" tooltip="查看详情" onClick={() => router.push(`/research/compute/${row.id}`)} />} className="w-20" />
              </DataTable>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
