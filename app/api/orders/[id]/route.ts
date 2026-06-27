import { NextResponse } from "next/server";

import { deleteOrder, updateOrder } from "@/lib/order-store";
import type { OrderInput } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as Partial<OrderInput>;

  if (!body.customerPhone && !body.productCode) {
    return NextResponse.json({ message: "缺少更新字段" }, { status: 400 });
  }

  try {
    const order = await updateOrder(id, body);

    if (!order) {
      return NextResponse.json({ message: "订单不存在" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "修改订单失败" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteOrder(id);

  if (!deleted) {
    return NextResponse.json({ message: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
