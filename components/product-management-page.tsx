"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import type { Product } from "@/lib/types";

const pageSize = 5;

const emptyFilters = {
  date: "",
  code: "",
  name: ""
};

const emptyForm = {
  code: "",
  name: "",
  price: ""
};

type ProductFilters = typeof emptyFilters;
type ProductFormState = typeof emptyForm;
type DrawerMode = "detail" | "edit" | null;

export function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(emptyFilters);
  const [filters, setFilters] = useState<ProductFilters>(emptyFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<ProductFormState>(emptyForm);
  const [editForm, setEditForm] = useState<ProductFormState>(emptyForm);
  const [loading, setLoading] = useState(true);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesDate = !filters.date || product.createdAt.startsWith(filters.date);
      const matchesCode = !filters.code || product.code.includes(filters.code);
      const matchesName = !filters.name || product.name.includes(filters.name);

      return matchesDate && matchesCode && matchesName;
    });
  }, [filters, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page]);

  const averagePrice = useMemo(() => {
    if (!products.length) {
      return "0.00";
    }

    const totalPrice = products.reduce((sum, product) => sum + product.price, 0);
    return (totalPrice / products.length).toFixed(2);
  }, [products]);

  const highValueCount = useMemo(
    () => products.filter((product) => product.price >= 2000).length,
    [products]
  );

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    document.body.style.overflow =
      addModalOpen || deleteModalOpen || drawerMode ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [addModalOpen, deleteModalOpen, drawerMode]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAllOverlays();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function loadProducts() {
    setLoading(true);
    const response = await fetch("/api/products", { cache: "no-store" });
    const data = (await response.json()) as Product[];
    setProducts(data);
    setLoading(false);
  }

  function closeAllOverlays() {
    setAddModalOpen(false);
    setDeleteModalOpen(false);
    setDrawerMode(null);
    setAddForm(emptyForm);
  }

  function openDetailDrawer(product: Product) {
    setSelectedProductId(product.id);
    setDrawerMode("detail");
  }

  function openEditDrawer(product: Product) {
    setSelectedProductId(product.id);
    setEditForm({
      code: product.code,
      name: product.name,
      price: String(product.price)
    });
    setDrawerMode("edit");
  }

  function openDeleteModal(product: Product) {
    setSelectedProductId(product.id);
    setDeleteModalOpen(true);
  }

  async function handleCreateProduct() {
    const price = Number(addForm.price);

    if (!addForm.code || !addForm.name || Number.isNaN(price) || price <= 0) {
      return;
    }

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: addForm.code,
        name: addForm.name,
        price
      })
    });

    if (!response.ok) {
      return;
    }

    const createdProduct = (await response.json()) as Product;
    setProducts((prev) => [createdProduct, ...prev]);
    setAddForm(emptyForm);
    setAddModalOpen(false);
  }

  async function handleUpdateProduct() {
    if (!selectedProductId) {
      return;
    }

    const price = Number(editForm.price);

    if (!editForm.code || !editForm.name || Number.isNaN(price) || price <= 0) {
      return;
    }

    const response = await fetch(`/api/products/${selectedProductId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: editForm.code,
        name: editForm.name,
        price
      })
    });

    if (!response.ok) {
      return;
    }

    const updatedProduct = (await response.json()) as Product;
    setProducts((prev) =>
      prev.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
    setDrawerMode(null);
  }

  async function handleDeleteProduct() {
    if (!selectedProductId) {
      return;
    }

    const response = await fetch(`/api/products/${selectedProductId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      return;
    }

    setProducts((prev) =>
      prev.filter((product) => product.id !== selectedProductId)
    );
    setDeleteModalOpen(false);
    setDrawerMode(null);
    setSelectedProductId(null);
  }

  function updateDraftFilter<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  }

  const startIndex = filteredProducts.length ? (page - 1) * pageSize + 1 : 0;
  const endIndex = (page - 1) * pageSize + pageProducts.length;

  return (
    <div className="flex min-h-screen">
      <AppSidebar active="products" />

      <main className="flex-1 p-6 lg:p-7">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="glass overflow-hidden rounded-2xl p-6 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-brand-600">商品管理</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  统一管理商品资料，提升产品运营与维护效率
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  参照线索管理的页面风格与技术架构，支持商品筛选、详情查看、资料修改、新增录入与删除确认。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="商品总数" value={String(products.length)} />
                <StatCard label="平均单价" value={`¥${averagePrice}`} highlight />
                <StatCard label="高价值商品" value={String(highValueCount)} highlight />
              </div>
            </div>
          </header>

          <section className="glass rounded-2xl p-6 shadow-soft">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="bank-divider text-lg font-semibold text-slate-900">
                  筛选条件
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  支持按商品创建时间、商品编号与商品名称快速查询目标商品。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-panel transition-colors duration-200 hover:bg-brand-600"
              >
                <PlusIcon />
                新增商品
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                <InputField
                  label="商品创建时间"
                  type="date"
                  value={draftFilters.date}
                  onChange={(value) => updateDraftFilter("date", value)}
                />
                <InputField
                  label="商品编号"
                  placeholder="请输入商品编号"
                  value={draftFilters.code}
                  onChange={(value) => updateDraftFilter("code", value)}
                />
                <InputField
                  label="商品名称"
                  placeholder="请输入商品名称"
                  value={draftFilters.name}
                  onChange={(value) => updateDraftFilter("name", value)}
                />
              </div>

              <div className="flex flex-wrap gap-3 xl:pb-[2px]">
                <button
                  type="button"
                  onClick={() => setFilters(draftFilters)}
                  className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-600"
                >
                  查询
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftFilters(emptyFilters);
                    setFilters(emptyFilters);
                  }}
                  className="rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-medium text-brand-600 transition-colors duration-200 hover:bg-brand-50"
                >
                  重置
                </button>
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl shadow-soft">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="bank-divider text-lg font-semibold text-slate-900">
                  商品列表
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  展示商品创建时间、商品编号、商品名称与商品价格。
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                搜索结果共 {filteredProducts.length} 条
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#edf7f1] text-center">
                    {[
                      "创建时间",
                      "商品编号",
                      "商品名称",
                      "商品价格",
                      "操作"
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="border-t border-b border-slate-100 px-6 py-10 text-center text-sm text-slate-500"
                      >
                        正在加载商品数据...
                      </td>
                    </tr>
                  ) : pageProducts.length ? (
                    pageProducts.map((product, index) => {
                      const borderClass =
                        index === pageProducts.length - 1 ? "border-t border-b" : "border-t";

                      return (
                        <tr
                          key={product.id}
                          className="transition-colors duration-200 hover:bg-brand-50/40"
                        >
                          <td
                            className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-600`}
                          >
                            {product.createdAt}
                          </td>
                          <td
                            className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm font-semibold text-slate-800`}
                          >
                            {product.code}
                          </td>
                          <td
                            className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-800`}
                          >
                            {product.name}
                          </td>
                          <td
                            className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm font-semibold text-brand-600`}
                          >
                            {formatPrice(product.price)}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center`}>
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openDetailDrawer(product)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                              >
                                详情
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditDrawer(product)}
                                className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-600"
                              >
                                修改
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(product)}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-colors duration-200 hover:bg-rose-100"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="border-t border-b border-slate-100 px-6 py-10 text-center text-sm text-slate-500"
                      >
                        未查询到符合条件的商品，请调整筛选条件后重试。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                共 {products.length} 条商品，当前展示 {startIndex} - {endIndex} 条
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  上一页
                </button>
                <span className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  type="button"
                  disabled={page === totalPages || !filteredProducts.length}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  下一页
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <CenterModal
        title="新增商品"
        description="填写商品基础信息后点击添加，数据将写入本地 json 假数据。"
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setAddForm(emptyForm);
        }}
      >
        <ProductForm
          form={addForm}
          submitLabel="添加商品"
          onChange={setAddForm}
          onCancel={() => {
            setAddModalOpen(false);
            setAddForm(emptyForm);
          }}
          onSubmit={handleCreateProduct}
        />
      </CenterModal>

      <SideDrawer
        title={drawerMode === "edit" ? "修改" : "详情"}
        description={
          drawerMode === "edit"
            ? "修改商品资料后保存，列表会同步更新。"
            : "查看当前商品的详细信息。"
        }
        open={drawerMode !== null}
        onClose={() => setDrawerMode(null)}
      >
        {selectedProduct ? (
          drawerMode === "edit" ? (
            <ProductForm
              form={editForm}
              submitLabel="保存修改"
              onChange={setEditForm}
              onCancel={() => setDrawerMode(null)}
              onSubmit={handleUpdateProduct}
            />
          ) : (
            <div className="space-y-4">
              <ReadonlyField label="创建时间" value={selectedProduct.createdAt} />
              <ReadonlyField label="商品编号" value={selectedProduct.code} />
              <ReadonlyField label="商品名称" value={selectedProduct.name} />
              <ReadonlyField
                label="商品价格"
                value={formatPrice(selectedProduct.price)}
              />
            </div>
          )
        ) : null}
      </SideDrawer>

      <CenterModal
        title="删除确认"
        description={
          selectedProduct
            ? `确认删除商品“${selectedProduct.name}”吗？删除后将从本地商品数据中移除。`
            : "确认删除当前商品吗？"
        }
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      >
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteModalOpen(false)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleDeleteProduct}
            className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-rose-600"
          >
            确认删除
          </button>
        </div>
      </CenterModal>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#fbfefb] px-4 py-3 shadow-panel">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${highlight ? "text-brand-600" : "text-slate-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-[#fcfffd] px-4 py-3 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
      />
    </label>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        readOnly
        className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-[#f2f8f4] px-4 py-3 text-sm text-slate-500 outline-none"
      />
    </label>
  );
}

function ProductForm({
  form,
  submitLabel,
  onChange,
  onCancel,
  onSubmit
}: {
  form: ProductFormState;
  submitLabel: string;
  onChange: (value: ProductFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const priceValue = Number(form.price);
  const isDisabled =
    !form.code || !form.name || !form.price || Number.isNaN(priceValue) || priceValue <= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <InputField
          label="商品编号"
          value={form.code}
          placeholder="请输入商品编号"
          onChange={(value) => onChange({ ...form, code: value })}
        />
        <InputField
          label="商品名称"
          value={form.name}
          placeholder="请输入商品名称"
          onChange={(value) => onChange({ ...form, name: value })}
        />
        <InputField
          label="商品价格"
          type="number"
          value={form.price}
          placeholder="请输入商品价格"
          onChange={(value) => onChange({ ...form, price: value })}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isDisabled}
          className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-panel transition-colors duration-200 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function CenterModal({
  title,
  description,
  open,
  onClose,
  children
}: {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-600">商品管理</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-700"
            aria-label="关闭弹窗"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function SideDrawer({
  title,
  description,
  open,
  onClose,
  children
}: {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/30"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-brand-600">商品管理</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">{title}抽屉</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-700"
            aria-label="关闭抽屉"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function formatPrice(price: number) {
  return `¥${price.toFixed(2)}`;
}

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
