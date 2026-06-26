import { NextResponse } from "next/server";

import { addFollowUp } from "@/lib/lead-store";
import { formatDateTime } from "@/lib/date";
import type { FollowUp } from "@/lib/types";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = context.params;
  const body = (await request.json()) as Pick<FollowUp, "note" | "by">;

  if (!body.note || !body.by) {
    return NextResponse.json(
      { message: "缺少跟进内容或跟进人" },
      { status: 400 }
    );
  }

  const lead = await addFollowUp(id, {
    time: formatDateTime(new Date()),
    note: body.note,
    by: body.by
  });

  if (!lead) {
    return NextResponse.json({ message: "线索不存在" }, { status: 404 });
  }

  return NextResponse.json(lead, { status: 201 });
}
