"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { Skeleton } from "primereact/skeleton";
import { ComputeService } from "@/app/service/computeService";
import { ResourceService } from "@/app/service/resourceService";
import type { ComputeFunctionItem } from "@/app/api/compute/functions/entity";
import type { ResourceItem } from "@/app/api/resources/list/entity";

const computeService = new ComputeService();
const resourceService = new ResourceService();

export default function ResearchComputeCreatePage() {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [functions, setFunctions] = useState<ComputeFunctionItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [functionId, setFunctionId] = useState("");
  const [sourceChain, setSourceChain] = useState("");
  const [targetChain, setTargetChain] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [funcResult, resResult] = await Promise.all([
          computeService.getFunctions(),
          resourceService.listResources(),
        ]);
        if (funcResult) setFunctions(funcResult.functions);
        if (resResult) setResources(resResult.resources);
      } catch { setFunctions([]); setResources([]); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  async function handleSubmit() {
    if (!name || !functionId || !sourceChain) {
      toast.current?.show({ severity: "warn", summary: "请填完必填字段", detail: "" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await computeService.createTask({
        name,
        description,
        function_id: functionId,
        source_chain_id: sourceChain,
        target_chain_id: targetChain || sourceChain,
        resource_ids: selectedResources,
      });
      if (result) {
        toast.current?.show({ severity: "success", summary: "创建成功", detail: `任务「${result.name}」已创建` });
        setTimeout(() => router.push("/research/compute"), 800);
      } else {
        toast.current?.show({ severity: "error", summary: "创建失败", detail: "" });
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "网络错误", detail: "" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Skeleton height="400px" />;

  return (
    <div className="space-y-6">
      <Toast ref={toast} />
      <h2 className="text-2xl font-bold text-surface-900">创建计算任务</h2>

      <Card title="基本信息">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-surface-700 block mb-1">任务名称 *</label>
            <InputText value={name} onChange={(e) => setName(e.target.value)} className="w-full" placeholder="如：跨院病例统计任务" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700 block mb-1">任务描述</label>
            <InputTextarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" rows={2} placeholder="任务描述..." />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700 block mb-1">计算函数 *</label>
            <Dropdown
              value={functionId}
              options={functions.map((f) => ({ label: `${f.name} (${f.function_key})`, value: f.id }))}
              onChange={(e) => setFunctionId(e.value)}
              className="w-full"
              placeholder="选择计算函数"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1">源链 *</label>
              <Dropdown
                value={sourceChain}
                options={[
                  { label: "医院链 (chain_hospital)", value: "11111111-1111-1111-1111-111111111111" },
                  { label: "科研机构链 (chain_research)", value: "22222222-2222-2222-2222-222222222222" },
                  { label: "监管链 (chain_regulator)", value: "33333333-3333-3333-3333-333333333333" },
                ]}
                onChange={(e) => setSourceChain(e.value)}
                className="w-full"
                placeholder="选择源链"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1">目标链</label>
              <Dropdown
                value={targetChain}
                options={[
                  { label: "医院链 (chain_hospital)", value: "11111111-1111-1111-1111-111111111111" },
                  { label: "科研机构链 (chain_research)", value: "22222222-2222-2222-2222-222222222222" },
                  { label: "监管链 (chain_regulator)", value: "33333333-3333-3333-3333-333333333333" },
                ]}
                onChange={(e) => setTargetChain(e.value)}
                className="w-full"
                placeholder="默认同源链"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="选择数据资源">
        {resources.length === 0 ? (
          <p className="text-surface-500">暂无可用资源</p>
        ) : (
          <DataTable value={resources} size="small" className="text-sm">
            <Column
              header="选择"
              body={(row: { id: string }) => (
                <Checkbox
                  checked={selectedResources.includes(row.id)}
                  onChange={(e) => {
                    if (e.checked) setSelectedResources([...selectedResources, row.id]);
                    else setSelectedResources(selectedResources.filter((id) => id !== row.id));
                  }}
                />
              )}
              className="w-20"
            />
            <Column field="name" header="资源名称" />
            <Column field="resource_type" header="资源类型" />
            <Column field="chain_name" header="链" />
          </DataTable>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <Button label="取消" severity="secondary" text onClick={() => router.push("/research/compute")} />
        <Button label={submitting ? "创建中..." : "创建任务"} loading={submitting} onClick={handleSubmit} />
      </div>
    </div>
  );
}
