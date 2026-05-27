import { NextResponse } from "next/server";
import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";
import type { ApiData } from "@/types/api";
import type { ResourceDetailDto } from "./entity";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "未登录", data: null }, { status: 401 });
  }

  const { id } = await params;
  const supabaseClient = await supabase();

  const { data: resource, error } = await supabaseClient
    .from("resources")
    .select("*, chains!inner(chain_key, name), organizations!inner(name)")
    .eq("id", id)
    .single();

  if (error || !resource) {
    return NextResponse.json({ success: false, message: "资源不存在", data: null }, { status: 404 });
  }

  const r = resource as Record<string, unknown>;
  const chains = r.chains as Record<string, unknown> | undefined;
  const orgs = r.organizations as Record<string, unknown> | undefined;

  const { data: policies } = await supabaseClient
    .from("resource_policies")
    .select("id, policy_name, policy_code, read_mode, crosschain_required, is_enabled")
    .eq("resource_id", id);

  const { data: accessLogs } = await supabaseClient
    .from("access_logs")
    .select("id, action, result, tx_hash, created_at")
    .eq("resource_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const detail: ResourceDetailDto = {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) || "",
    resource_type: r.resource_type as string,
    chain_id: r.chain_id as string,
    chain_name: (chains?.name as string) || "-",
    chain_key: (chains?.chain_key as string) || "-",
    owner_organization_id: r.owner_organization_id as string,
    org_name: (orgs?.name as string) || "-",
    resource_hash: (r.resource_hash as string) || "",
    storage_uri: (r.storage_uri as string) || "",
    status: r.status as string,
    created_at: r.created_at as string,
    policies: (policies || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      policy_name: p.policy_name as string,
      policy_code: p.policy_code as string,
      read_mode: p.read_mode as string,
      crosschain_required: p.crosschain_required as boolean,
      is_enabled: p.is_enabled as boolean,
    })),
    access_logs: (accessLogs || []).map((l: Record<string, unknown>) => ({
      id: l.id as string,
      action: l.action as string,
      result: l.result as string,
      tx_hash: (l.tx_hash as string) || "",
      created_at: l.created_at as string,
    })),
  };

  return NextResponse.json<ApiData<ResourceDetailDto>>({
    success: true,
    message: "ok",
    data: detail,
  });
}
