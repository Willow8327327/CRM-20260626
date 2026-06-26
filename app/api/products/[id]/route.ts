import { NextResponse } from "next/server";

import { deleteProduct, updateProduct } from "@/lib/product-store";
import type { ProductInput } from "@/lib/types";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = context.params;
  const body = (await request.json()) as Partial<ProductInput>;

  if (body.price !== undefined && (typeof body.price !== "number" || body.price <= 0)) {
    return NextResponse.json({ message: "商品价格无效" }, { status: 400 });
  }

  const product = await updateProduct(id, body);

  if (!product) {
    return NextResponse.json({ message: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = context.params;
  const deleted = await deleteProduct(id);

  if (!deleted) {
    return NextResponse.json({ message: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
