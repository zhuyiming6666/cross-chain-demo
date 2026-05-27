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
import { Timeline } from "primereact/timeline";
import { ComputeService } from "@/app/service/computeService";
import type { ComputeTaskDetailDto } from "@/app/api/compute/tasks/[id]/entity";

const computeService = new ComputeService();

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", ready: "就绪", running: "运行中",
  result_submitted: "结果已提交", completed: "已完成", failed: "失败",
};

const STATUS_SEVERITY: Record<string, "info" | "warning" | "success" | "danger"> = {
  draft: "info", ready: "warning", running: "warning",
  result_submitted: "info", completed: "success", failed: "danger",
};

const EVENT_LABELS: Record<string, string> = {
  created: "任务创建",
  ready: "准备就绪",
  running: "开始计算",
  result_submitted: "结果提交",
  completed: "计算完成",
  failed: "计算失败",
};

const TYPE_LABELS: Record<string, string> = {
  case_dataset: "病例数据集", file: "文件", list: "列表", commitment: "承诺",
};

export default function ResearchComputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<ComputeTaskDetailDto | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await computeService.getTaskDetail(id);
        if (result) setTask(result);
        else toast.current?.show({ severity: "error", summary: "加载失败", detail: "任务不存在" });
      } catch {
        toast.current?.show({ severity: "error", summary: "网络错误", detail: "" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <Skeleton height="400px" />;

  if (!task) {
    return (
      <div className="text-center py-12">
        <i className="pi pi-exclamation-triangle text-5xl text-surface-300 mb-3" />
        <p className="text-surface-500 mb-3">任务不存在</p>
        <Button label="返回列表" onClick={() => router.push("/research/compute")} />
      </div>
    );
  }

  const timelineEvents = task.events.map((e) => ({
    status: e.event_type,
    title: EVENT_LABELS[e.event_type] || e.event_type,
    detail: e.tx_hash ? `Tx: ${e.tx_hash.slice(0, 14)}...` : "",
    date: new Date(e.created_at).toLocaleString("zh-CN"),
    icon: e.event_type === "completed" ? "pi pi-check-circle" : e.event_type === "failed" ? "pi pi-times-circle" : "pi pi-circle",
    color: e.event_type === "completed" ? "#22c55e" : e.event_type === "failed" ? "#ef4444" : "#3b82f6",
  }));

  return (
    <div className="space-y-6">
      <Toast ref={toast} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => router.push("/research/compute")} />
          <h2 className="text-2xl font-bold text-surface-900">{task.name}</h2>
          <Tag value={STATUS_LABELS[task.status] || task.status} severity={STATUS_SEVERITY[task.status] || "info"} />
        </div>
      </div>

      <Card title="基本信息">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-surface-500">任务名称</span>
            <p className="text-surface-900 font-medium">{task.name}</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">计算函数</span>
            <p className="text-surface-900">{task.function_name} <code className="text-xs bg-surface-100 px-1 rounded">({task.function_key})</code></p>
          </div>
          <div>
            <span className="text-sm text-surface-500">源链</span>
            <p className="text-surface-900">{task.source_chain_name}</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">目标链</span>
            <p className="text-surface-900">{task.target_chain_name}</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">结果可见性</span>
            <p className="text-surface-900">{task.result_visibility === "initiator_only" ? "仅发起方" : task.result_visibility}</p>
          </div>
          <div>
            <span className="text-sm text-surface-500">创建时间</span>
            <p className="text-surface-700">{new Date(task.created_at).toLocaleString("zh-CN")}</p>
          </div>
          {task.description && (
            <div className="sm:col-span-2">
              <span className="text-sm text-surface-500">描述</span>
              <p className="text-surface-700">{task.description}</p>
            </div>
          )}
        </div>
      </Card>

      <Card title="关联资源">
        {task.resources.length === 0 ? (
          <p className="text-surface-500">暂无关联资源</p>
        ) : (
          <DataTable value={task.resources} size="small" className="text-sm">
            <Column field="name" header="资源名称" />
            <Column field="resource_type" header="类型" body={(row: { resource_type: string }) => <Tag value={TYPE_LABELS[row.resource_type] || row.resource_type} severity="info" />} />
            <Column field="chain_name" header="所在链" />
          </DataTable>
        )}
      </Card>

      <Card title="任务时间线">
        {task.events.length === 0 ? (
          <p className="text-surface-500">暂无事件记录</p>
        ) : (
          <Timeline
            value={timelineEvents}
            content={(item: { title: string; detail: string; date: string }) => (
              <div>
                <p className="font-medium text-surface-800">{item.title}</p>
                {item.detail && <p className="text-xs text-surface-500 font-mono">{item.detail}</p>}
                <p className="text-xs text-surface-400 mt-1">{item.date}</p>
              </div>
            )}
            marker={(item: { icon: string; color: string }) => (
              <span className="flex w-8 h-8 items-center justify-center rounded-full text-white text-sm" style={{ backgroundColor: item.color }}>
                <i className={item.icon} />
              </span>
            )}
          />
        )}
      </Card>
    </div>
  );
}
