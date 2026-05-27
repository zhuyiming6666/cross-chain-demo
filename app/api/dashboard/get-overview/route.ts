import { NextResponse } from "next/server";
import { getServerSession } from "../../auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";
import type { ApiData } from "@/types/api";
import type { GetOverviewDto, GetOverviewResponseDto } from "./entity";

export async function POST(_req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "未登录", data: null }, { status: 401 });
  }

  const supabaseClient = await supabase();

  const [resCount, reqCount, taskCount, auditCount, chainsData, messagesData] =
    await Promise.all([
      supabaseClient.from("resources").select("*", { count: "exact", head: true }),
      supabaseClient.from("access_requests").select("*", { count: "exact", head: true }),
      supabaseClient.from("compute_tasks").select("*", { count: "exact", head: true }),
      supabaseClient.from("audit_logs").select("*", { count: "exact", head: true }),
      supabaseClient.from("chains").select("name,chain_key,is_enabled"),
      supabaseClient
        .from("crosschain_messages")
        .select("id,business_type,source_chain_id,target_chain_id,status")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const chains = (chainsData.data || []).map((c: Record<string, unknown>) => ({
    name: c.name as string,
    chain_key: c.chain_key as string,
    status: c.is_enabled ? "active" : "inactive",
  }));

  const recentMessages = (messagesData.data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    business_type: m.business_type as string,
    source: (m.source_chain_id as string)?.substring(0, 8) || "?",
    target: (m.target_chain_id as string)?.substring(0, 8) || "?",
    status: m.status as string,
  }));

  return NextResponse.json<ApiData<GetOverviewResponseDto>>({
    success: true,
    message: "ok",
    data: {
      resources: resCount.count || 0,
      accessRequests: reqCount.count || 0,
      computeTasks: taskCount.count || 0,
      auditEvents: auditCount.count || 0,
      chains,
      recentMessages,
    },
  });
}
