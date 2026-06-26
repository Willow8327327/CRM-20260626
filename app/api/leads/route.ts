import { NextResponse } from "next/server";

import { createLead, readLeads } from "@/lib/lead-store";
import type { LeadInput } from "@/lib/types";

export async function GET() {
  const leads = await readLeads();
  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  const body = (await request.json()) as LeadInput;

  if (!body.name || !body.phone || !body.source || !body.owner || !body.priority) {
    return NextResponse.json(
      { message: "缺少必要字段" },
      { status: 400 }
    );
  }

  const lead = await createLead(body);
  return NextResponse.json(lead, { status: 201 });
}
