import { NextResponse } from "next/server";
import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";
import type { ApiData } from "@/types/api";
import type { ListComputeTasksResponseDto } from "./entity";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "未登录", data: null }, { status: 401 });
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const user = session.user as any;

  const supabaseClient = await supabase();

  const { data, error, count } = await supabaseClient
    .from("compute_tasks")
    .select("*, compute_functions!inner(name), source:chains!compute_tasks_source_chain_id_fkey(name), target:chains!compute_tasks_target_chain_id_fkey(name)", { count: "exact" })
    .eq("initiator_organization_id", user.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, message: error.message, data: null }, { status: 500 });
  }

  // Single aggregate query for resource counts instead of N+1
  const taskIds = data.map((t: Record<string, unknown>) => t.id as string);
  let resourceCounts: Record<string, number> = {};
  if (taskIds.length > 0) {
    const { data: counts } = await supabaseClient
      .from("compute_task_resources")
      .select("task_id")
      .in("task_id", taskIds);
    for (const row of (counts || [])) {
      const tid = row.task_id as string;
      resourceCounts[tid] = (resourceCounts[tid] || 0) + 1;
    }
  }

  const tasks = (data || []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    name: t.name as string,
    description: (t.description as string) || "",
    function_id: t.function_id as string,
    function_name: ((t.compute_functions as Record<string, unknown>)?.name as string) || "-",
    source_chain_name: ((t.source as Record<string, unknown>)?.name as string) || "-",
    target_chain_name: ((t.target as Record<string, unknown>)?.name as string) || "-",
    status: t.status as string,
    parameters: (t.parameters as Record<string, unknown>) || {},
    resource_count: resourceCounts[t.id as string] || 0,
    created_at: t.created_at as string,
  }));

  return NextResponse.json<ApiData<ListComputeTasksResponseDto>>({
    success: true,
    message: "ok",
    data: { tasks, total: count || 0 },
  });
}
