import { NextResponse } from "next/server";
import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";
import type { ApiData } from "@/types/api";
import type { ListComputeFunctionsResponseDto } from "./entity";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "未登录", data: null }, { status: 401 });
  }

  const supabaseClient = await supabase();

  const { data, error } = await supabaseClient
    .from("compute_functions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, message: error.message, data: null }, { status: 500 });
  }

  const functions = (data || []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    name: f.name as string,
    function_key: f.function_key as string,
    description: (f.description as string) || "",
    function_type: f.function_type as string,
    input_schema: (f.input_schema as Record<string, unknown>) || {},
    output_schema: (f.output_schema as Record<string, unknown>) || {},
    is_builtin: f.is_builtin as boolean,
    created_at: f.created_at as string,
  }));

  return NextResponse.json<ApiData<ListComputeFunctionsResponseDto>>({
    success: true,
    message: "ok",
    data: { functions },
  });
}
