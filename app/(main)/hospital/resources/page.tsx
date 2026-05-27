"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { ResourceService } from "@/app/service/resourceService";
import type { ResourceItem } from "@/app/api/resources/list/entity";

const resourceService = new ResourceService();

const TYPE_OPTIONS = [
  { label: "全部", value: "" },
  { label: "病例数据集", value: "case_dataset" },
  { label: "文件", value: "file" },
  { label: "列表", value: "list" },
  { label: "承诺", value: "commitment" },
];

const TYPE_SEVERITY: Record<string, "info" | "warning" | "success" | "danger"> = {
  case_dataset: "info",
  file: "warning",
  list: "success",
  commitment: "danger",
};

const TYPE_LABELS: Record<string, string> = {
  case_dataset: "病例数据集",
  file: "文件",
  list: "列表",
  commitment: "承诺",
};

export default function HospitalResourcesPage() {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async (type?: string, searchTerm?: string) => {
    setLoading(true);
    try {
      const result = await resourceService.listResources({ resource_type: type || undefined, search: searchTerm || undefined });
      if (result) {
        setResources(result.resources);
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "网络错误", detail: "无法加载资源列表" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function onFilter() {
    fetchData(filterType, search);
  }

  const typeBody = (row: { resource_type: string }) => (
    <Tag value={TYPE_LABELS[row.resource_type] || row.resource_type} severity={TYPE_SEVERITY[row.resource_type] || "info"} />
  );

  const statusBody = (row: { status: string }) => (
    <Tag value={row.status === "active" ? "激活" : "停用"} severity={row.status === "active" ? "success" : "warning"} />
  );

  const actionBody = (row: { id: string }) => (
    <Button icon="pi pi-eye" text rounded severity="info" tooltip="查看详情" onClick={() => router.push(`/hospital/resources/${row.id}`)} />
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-surface-900">数字资源管理</h2>
        <Skeleton height="400px" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toast ref={toast} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-surface-900">数字资源管理</h2>
        <Button icon="pi pi-plus" label="创建资源" onClick={() => router.push("/hospital/resources/create")} />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Dropdown value={filterType} options={TYPE_OPTIONS} onChange={(e) => setFilterType(e.value)} placeholder="资源类型" className="w-full sm:w-40" />
          <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资源名称..." className="w-full sm:w-60" />
          <Button icon="pi pi-search" label="搜索" onClick={onFilter} severity="secondary" />
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-12">
            <i className="pi pi-inbox text-5xl text-surface-300 mb-3" />
            <p className="text-surface-500 mb-3">暂无数据资源</p>
            <Button icon="pi pi-plus" label="创建第一个资源" onClick={() => router.push("/hospital/resources/create")} />
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
              {resources.map((r) => (
                <Card key={r.id} pt={{ content: { className: "p-3" } }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-surface-800">{r.name}</p>
                      <p className="text-xs text-surface-500 mt-1">{TYPE_LABELS[r.resource_type] || r.resource_type} · {r.chain_name}</p>
                    </div>
                    <Tag value={r.status === "active" ? "激活" : "停用"} severity={r.status === "active" ? "success" : "warning"} />
                  </div>
                </Card>
              ))}
            </div>
            {/* Desktop: data table */}
            <div className="hidden md:block">
              <DataTable value={resources} paginator rows={10} size="small" className="text-sm" emptyMessage="暂无数据">
                <Column field="name" header="资源名称" sortable />
                <Column field="resource_type" header="资源类型" body={typeBody} />
                <Column field="chain_name" header="链" />
                <Column field="status" header="状态" body={statusBody} />
                <Column field="created_at" header="创建时间" body={(r: { created_at: string }) => new Date(r.created_at).toLocaleDateString("zh-CN")} />
                <Column header="操作" body={actionBody} className="w-20" />
              </DataTable>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
