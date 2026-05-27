import { NextResponse } from "next/server";
import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";
import type { ApiData } from "@/types/api";
import type { CreateComputeTaskDto, CreateComputeTaskResponseDto } from "./entity";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "未登录", data: null }, { status: 401 });
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const user = session.user as any;

  const body: CreateComputeTaskDto = await req.json();

  if (!body.name || !body.function_id || !body.source_chain_id) {
    return NextResponse.json({ success: false, message: "缺少必填字段", data: null }, { status: 400 });
  }

  const supabaseClient = await supabase();

  // Look up the profile UUID
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("nextauth_user_id", user.id)
    .single();

  const profileId = (profile as Record<string, unknown> | null)?.id;

  const { data: task, error } = await supabaseClient
    .from("compute_tasks")
    .insert({
      name: body.name,
      description: body.description || "",
      function_id: body.function_id,
      initiator_profile_id: profileId,
      initiator_organization_id: user.organizationId,
      source_chain_id: body.source_chain_id,
      target_chain_id: body.target_chain_id || body.source_chain_id,
      status: "draft",
      parameters: body.parameters || {},
      result_visibility: body.result_visibility || "initiator_only",
    })
    .select("id,name")
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: error.message, data: null }, { status: 500 });
  }

  // Link resources to the task
  if (body.resource_ids && body.resource_ids.length > 0) {
    const taskResources = body.resource_ids.map((resourceId) => ({
      task_id: (task as Record<string, unknown>).id,
      resource_id: resourceId,
      resource_chain_id: body.source_chain_id,
      role: "input",
    }));

    const { error: linkErr } = await supabaseClient
      .from("compute_task_resources")
      .insert(taskResources);

    if (linkErr) {
      /* eslint-disable-next-line no-console */
      console.error("Link resources failed:", linkErr.message);
    }
  }

  // Create initial event
  await supabaseClient.from("compute_task_events").insert({
    task_id: (task as Record<string, unknown>).id,
    event_type: "created",
    actor_profile_id: profileId,
    metadata: { name: body.name },
  });

  return NextResponse.json<ApiData<CreateComputeTaskResponseDto>>({
    success: true,
    message: "计算任务创建成功",
    data: {
      id: (task as Record<string, unknown>).id as string,
      name: (task as Record<string, unknown>).name as string,
    },
  });
}
