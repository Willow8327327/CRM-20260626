import { promises as fs } from "node:fs";
import path from "node:path";

import { formatDateTime } from "@/lib/date";
import type { Product, ProductInput } from "@/lib/types";

const productsFilePath = path.join(process.cwd(), "data", "products.json");

async function writeProducts(products: Product[]) {
  await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), "utf8");
}

export async function readProducts(): Promise<Product[]> {
  const file = await fs.readFile(productsFilePath, "utf8");
  return JSON.parse(file) as Product[];
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const products = await readProducts();
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const nextId = `SP${datePart}${String(products.length + 1).padStart(3, "0")}`;

  const product: Product = {
    id: nextId,
    createdAt: formatDateTime(now),
    ...input
  };

  const nextProducts = [product, ...products];
  await writeProducts(nextProducts);
  return product;
}

export async function updateProduct(
  id: string,
  updates: Partial<ProductInput>
): Promise<Product | null> {
  const products = await readProducts();
  const index = products.findIndex((product) => product.id === id);

  if (index < 0) {
    return null;
  }

  const updatedProduct: Product = {
    ...products[index],
    ...updates
  };

  products[index] = updatedProduct;
  await writeProducts(products);
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await readProducts();
  const nextProducts = products.filter((product) => product.id !== id);

  if (nextProducts.length === products.length) {
    return false;
  }

  await writeProducts(nextProducts);
  return true;
}
