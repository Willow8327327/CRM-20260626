import { promises as fs } from "node:fs";
import path from "node:path";

import { formatDateTime } from "@/lib/date";
import { readLeads } from "@/lib/lead-store";
import { readProducts } from "@/lib/product-store";
import type { Lead, Order, OrderInput, Product } from "@/lib/types";

const ordersFilePath = path.join(process.cwd(), "data", "orders.json");

async function writeOrders(orders: Order[]) {
  await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), "utf8");
}

export async function readOrders(): Promise<Order[]> {
  const file = await fs.readFile(ordersFilePath, "utf8");
  return JSON.parse(file) as Order[];
}

function resolveCustomer(leads: Lead[], customerPhone: string) {
  return leads.find((lead) => lead.phone === customerPhone) ?? null;
}

function resolveProduct(products: Product[], productCode: string) {
  return products.find((product) => product.code === productCode) ?? null;
}

async function buildOrderPayload(input: OrderInput) {
  const [leads, products] = await Promise.all([readLeads(), readProducts()]);
  const customer = resolveCustomer(leads, input.customerPhone);
  const product = resolveProduct(products, input.productCode);

  if (!customer) {
    throw new Error("客户线索不存在");
  }

  if (!product) {
    throw new Error("商品不存在");
  }

  return {
    customerName: customer.name,
    customerPhone: customer.phone,
    productCode: product.code,
    productName: product.name,
    amount: product.price
  };
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const orders = await readOrders();
  const payload = await buildOrderPayload(input);
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const nextId = `DD${datePart}${String(orders.length + 1).padStart(3, "0")}`;

  const order: Order = {
    id: nextId,
    createdAt: formatDateTime(now),
    ...payload
  };

  const nextOrders = [order, ...orders];
  await writeOrders(nextOrders);
  return order;
}

export async function updateOrder(
  id: string,
  updates: Partial<OrderInput>
): Promise<Order | null> {
  const orders = await readOrders();
  const index = orders.findIndex((order) => order.id === id);

  if (index < 0) {
    return null;
  }

  const current = orders[index];
  const payload = await buildOrderPayload({
    customerPhone: updates.customerPhone ?? current.customerPhone,
    productCode: updates.productCode ?? current.productCode
  });

  const updatedOrder: Order = {
    ...current,
    ...payload
  };

  orders[index] = updatedOrder;
  await writeOrders(orders);
  return updatedOrder;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const orders = await readOrders();
  const nextOrders = orders.filter((order) => order.id !== id);

  if (nextOrders.length === orders.length) {
    return false;
  }

  await writeOrders(nextOrders);
  return true;
}
