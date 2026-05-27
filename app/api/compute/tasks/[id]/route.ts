import { NextResponse } from "next/server";
import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";
import type { ApiData } from "@/types/api";
import type { ComputeTaskDetailDto } from "./entity";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "未登录", data: null }, { status: 401 });
  }

  const { id } = await params;
  const supabaseClient = await supabase();

  const { data: task, error } = await supabaseClient
    .from("compute_tasks")
    .select("*, compute_functions!inner(name, function_key), source:chains!source_chain_id(name), target:chains!target_chain_id(name)")
    .eq("id", id)
    .single();

  if (error || !task) {
    return NextResponse.json({ success: false, message: "任务不存在", data: null }, { status: 404 });
  }

  const t = task as Record<string, unknown>;

  // Fetch linked resources with chain info
  const { data: taskResources } = await supabaseClient
    .from("compute_task_resources")
    .select("*, resources!inner(id, name, resource_type), chains!inner(name)")
    .eq("task_id", id);

  // Fetch task events
  const { data: events } = await supabaseClient
    .from("compute_task_events")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: true });

  const detail: ComputeTaskDetailDto = {
    id: t.id as string,
    name: t.name as string,
    description: (t.description as string) || "",
    function_id: t.function_id as string,
    function_name: ((t.compute_functions as Record<string, unknown>)?.name as string) || "-",
    function_key: ((t.compute_functions as Record<string, unknown>)?.function_key as string) || "-",
    source_chain_name: ((t.source as Record<string, unknown>)?.name as string) || "-",
    target_chain_name: ((t.target as Record<string, unknown>)?.name as string) || "-",
    status: t.status as string,
    parameters: (t.parameters as Record<string, unknown>) || {},
    result_visibility: (t.result_visibility as string) || "initiator_only",
    created_at: t.created_at as string,
    completed_at: (t.completed_at as string) || undefined,
    resources: (taskResources || []).map((tr: Record<string, unknown>) => ({
      id: (tr.resources as Record<string, unknown>)?.id as string,
      name: (tr.resources as Record<string, unknown>)?.name as string,
      resource_type: (tr.resources as Record<string, unknown>)?.resource_type as string,
      chain_name: (tr.chains as Record<string, unknown>)?.name as string,
    })),
    events: (events || []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      event_type: e.event_type as string,
      tx_hash: (e.tx_hash as string) || "",
      metadata: (e.metadata as Record<string, unknown>) || {},
      created_at: e.created_at as string,
    })),
  };

  return NextResponse.json<ApiData<ComputeTaskDetailDto>>({
    success: true,
    message: "ok",
    data: detail,
  });
}
