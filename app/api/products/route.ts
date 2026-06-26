import { NextResponse } from "next/server";

import { createProduct, readProducts } from "@/lib/product-store";
import type { ProductInput } from "@/lib/types";

export async function GET() {
  const products = await readProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ProductInput>;

  if (!body.code || !body.name || typeof body.price !== "number" || body.price <= 0) {
    return NextResponse.json(
      { message: "缺少必要字段或商品价格无效" },
      { status: 400 }
    );
  }

  const product = await createProduct({
    code: body.code,
    name: body.name,
    price: body.price
  });

  return NextResponse.json(product, { status: 201 });
}
