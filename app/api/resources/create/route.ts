import { NextResponse } from "next/server";
import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";
import type { ApiData } from "@/types/api";
import type { CreateResourceDto, CreateResourceResponseDto } from "./entity";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "未登录", data: null }, { status: 401 });
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const user = session.user as any;

  const body: CreateResourceDto = await req.json();

  if (!body.name || !body.resource_type || !body.chain_id) {
    return NextResponse.json({ success: false, message: "缺少必填字段", data: null }, { status: 400 });
  }

  const supabaseClient = await supabase();

  // Look up the profile UUID from nextauth user ID
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("nextauth_user_id", user.id)
    .single();

  const { data: resource, error } = await supabaseClient
    .from("resources")
    .insert({
      name: body.name,
      description: body.description || "",
      resource_type: body.resource_type,
      owner_organization_id: user.organizationId,
      chain_id: body.chain_id,
      resource_hash: body.resource_hash || "0x",
      storage_uri: body.storage_uri || "",
      status: "active",
      created_by: (profile as Record<string, unknown> | null)?.id || null,
    })
    .select("id,name")
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: error.message, data: null }, { status: 500 });
  }

  if (body.policy_template_ids && body.policy_template_ids.length > 0) {
    const policies = body.policy_template_ids.map((tid) => ({
      resource_id: (resource as Record<string, unknown>).id,
      template_id: tid,
      policy_name: "auto",
      policy_code: "auto",
      read_mode: "abe_encrypted",
      crosschain_required: true,
      is_enabled: true,
    }));

    const { error: policyErr } = await supabaseClient.from("resource_policies").insert(policies);
    if (policyErr) {
      /* eslint-disable-next-line no-console */
      console.error("Policy creation failed:", policyErr.message);
    }
  }

  return NextResponse.json<ApiData<CreateResourceResponseDto>>({
    success: true,
    message: "资源创建成功",
    data: { id: (resource as Record<string, unknown>).id as string, name: (resource as Record<string, unknown>).name as string },
  });
}
