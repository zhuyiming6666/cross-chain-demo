import { NextResponse } from "next/server";
import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";
import type { ApiData } from "@/types/api";
import type { ListResourcesDto, ListResourcesResponseDto } from "./entity";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "未登录", data: null }, { status: 401 });
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const user = session.user as any;
  const orgId = user.organizationId as string;

  const supabaseClient = await supabase();
  const body: ListResourcesDto = await req.json().catch(() => ({}));

  let query = supabaseClient
    .from("resources")
    .select("*, chains!inner(chain_key, name)", { count: "exact" })
    .eq("owner_organization_id", orgId)
    .order("created_at", { ascending: false });

  if (body.resource_type) {
    query = query.eq("resource_type", body.resource_type);
  }
  if (body.search) {
    query = query.ilike("name", `%${body.search}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ success: false, message: error.message, data: null }, { status: 500 });
  }

  const resources = (data || []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) || "",
    resource_type: r.resource_type as string,
    chain_name: ((r.chains as Record<string, unknown>)?.name as string) || "-",
    chain_key: ((r.chains as Record<string, unknown>)?.chain_key as string) || "-",
    resource_hash: (r.resource_hash as string) || "",
    storage_uri: (r.storage_uri as string) || "",
    status: r.status as string,
    created_at: r.created_at as string,
  }));

  return NextResponse.json<ApiData<ListResourcesResponseDto>>({
    success: true,
    message: "ok",
    data: { resources, total: count || 0 },
  });
}
