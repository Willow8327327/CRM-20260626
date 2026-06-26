import { NextResponse } from "next/server";

import { updateLead } from "@/lib/lead-store";
import type { LeadInput } from "@/lib/types";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = context.params;
  const body = (await request.json()) as Partial<LeadInput>;
  const lead = await updateLead(id, body);

  if (!lead) {
    return NextResponse.json({ message: "线索不存在" }, { status: 404 });
  }

  return NextResponse.json(lead);
}
