import { NextResponse } from "next/server";

import { createOrder, readOrders } from "@/lib/order-store";
import type { OrderInput } from "@/lib/types";

export async function GET() {
  const orders = await readOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<OrderInput>;

  if (!body.customerPhone || !body.productCode) {
    return NextResponse.json({ message: "缺少必要字段" }, { status: 400 });
  }

  try {
    const order = await createOrder({
      customerPhone: body.customerPhone,
      productCode: body.productCode
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "创建订单失败" },
      { status: 400 }
    );
  }
}
