"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import type { Lead, Order, Product } from "@/lib/types";

const pageSize = 5;

const emptyFilters = {
  date: "",
  orderId: "",
  customerName: "",
  customerPhone: "",
  productName: ""
};

const emptyForm = {
  customerPhone: "",
  productCode: ""
};

type OrderFilters = typeof emptyFilters;
type OrderFormState = typeof emptyForm;
type DrawerMode = "detail" | "edit" | null;

export function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draftFilters, setDraftFilters] = useState<OrderFilters>(emptyFilters);
  const [filters, setFilters] = useState<OrderFilters>(emptyFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<OrderFormState>(emptyForm);
  const [editForm, setEditForm] = useState<OrderFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const customerFilterRef = useRef<HTMLDivElement | null>(null);
  const customerFilterInputRef = useRef<HTMLInputElement | null>(null);
  const productFilterRef = useRef<HTMLDivElement | null>(null);
  const productFilterInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );
  const customerNameOptions = useMemo(
    () => [...new Set(orders.map((order) => order.customerName))],
    [orders]
  );
  const productNameOptions = useMemo(
    () => [...new Set(orders.map((order) => order.productName))],
    [orders]
  );
  const filteredCustomerNameOptions = useMemo(
    () =>
      customerNameOptions.filter((name) =>
        name.includes(draftFilters.customerName)
      ),
    [customerNameOptions, draftFilters.customerName]
  );
  const filteredProductNameOptions = useMemo(
    () =>
      productNameOptions.filter((name) =>
        name.includes(draftFilters.productName)
      ),
    [draftFilters.productName, productNameOptions]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesDate = !filters.date || order.createdAt.startsWith(filters.date);
      const matchesOrderId = !filters.orderId || order.id.includes(filters.orderId);
      const matchesCustomerName =
        !filters.customerName || order.customerName.includes(filters.customerName);
      const matchesCustomerPhone =
        !filters.customerPhone || order.customerPhone.includes(filters.customerPhone);
      const matchesProductName =
        !filters.productName || order.productName.includes(filters.productName);

      return (
        matchesDate &&
        matchesOrderId &&
        matchesCustomerName &&
        matchesCustomerPhone &&
        matchesProductName
      );
    });
  }, [filters, orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page]);

  const totalAmount = useMemo(
    () => orders.reduce((sum, order) => sum + order.amount, 0),
    [orders]
  );

  const highAmountCount = useMemo(
    () => orders.filter((order) => order.amount >= 3000).length,
    [orders]
  );

  const selectedAddLead = useMemo(
    () => leads.find((lead) => lead.phone === addForm.customerPhone) ?? null,
    [addForm.customerPhone, leads]
  );
  const selectedAddProduct = useMemo(
    () => products.find((product) => product.code === addForm.productCode) ?? null,
    [addForm.productCode, products]
  );
  const selectedEditLead = useMemo(
    () => leads.find((lead) => lead.phone === editForm.customerPhone) ?? null,
    [editForm.customerPhone, leads]
  );
  const selectedEditProduct = useMemo(
    () => products.find((product) => product.code === editForm.productCode) ?? null,
    [editForm.productCode, products]
  );

  useEffect(() => {
    void loadData();
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

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        customerFilterRef.current &&
        !customerFilterRef.current.contains(target)
      ) {
        setCustomerDropdownOpen(false);
      }

      if (productFilterRef.current && !productFilterRef.current.contains(target)) {
        setProductDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function loadData() {
    setLoading(true);

    const [ordersResponse, leadsResponse, productsResponse] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/leads", { cache: "no-store" }),
      fetch("/api/products", { cache: "no-store" })
    ]);

    const [ordersData, leadsData, productsData] = await Promise.all([
      ordersResponse.json() as Promise<Order[]>,
      leadsResponse.json() as Promise<Lead[]>,
      productsResponse.json() as Promise<Product[]>
    ]);

    setOrders(ordersData);
    setLeads(leadsData);
    setProducts(productsData);
    setLoading(false);
  }

  function closeAllOverlays() {
    setAddModalOpen(false);
    setDeleteModalOpen(false);
    setDrawerMode(null);
    setCustomerDropdownOpen(false);
    setProductDropdownOpen(false);
    setAddForm(emptyForm);
  }

  function openDetailDrawer(order: Order) {
    setSelectedOrderId(order.id);
    setDrawerMode("detail");
  }

  function openEditDrawer(order: Order) {
    setSelectedOrderId(order.id);
    setEditForm({
      customerPhone: order.customerPhone,
      productCode: order.productCode
    });
    setDrawerMode("edit");
  }

  function openDeleteModal(order: Order) {
    setSelectedOrderId(order.id);
    setDeleteModalOpen(true);
  }

  async function handleCreateOrder() {
    if (!addForm.customerPhone || !addForm.productCode) {
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm)
    });

    if (!response.ok) {
      return;
    }

    const createdOrder = (await response.json()) as Order;
    setOrders((prev) => [createdOrder, ...prev]);
    setAddForm(emptyForm);
    setAddModalOpen(false);
  }

  async function handleUpdateOrder() {
    if (!selectedOrderId || !editForm.customerPhone || !editForm.productCode) {
      return;
    }

    const response = await fetch(`/api/orders/${selectedOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm)
    });

    if (!response.ok) {
      return;
    }

    const updatedOrder = (await response.json()) as Order;
    setOrders((prev) =>
      prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    );
    setDrawerMode(null);
  }

  async function handleDeleteOrder() {
    if (!selectedOrderId) {
      return;
    }

    const response = await fetch(`/api/orders/${selectedOrderId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      return;
    }

    setOrders((prev) => prev.filter((order) => order.id !== selectedOrderId));
    setDeleteModalOpen(false);
    setDrawerMode(null);
    setSelectedOrderId(null);
  }

  function updateDraftFilter<K extends keyof OrderFilters>(
    key: K,
    value: OrderFilters[K]
  ) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  }

  const startIndex = filteredOrders.length ? (page - 1) * pageSize + 1 : 0;
  const endIndex = (page - 1) * pageSize + pageOrders.length;

  return (
    <div className="flex min-h-screen">
      <AppSidebar active="orders" />

      <main className="flex-1 p-6 lg:p-7">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="glass overflow-hidden rounded-2xl p-6 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-brand-600">订单管理</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  统一管理订单资料，提升成交订单维护效率
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  完全参考线索管理的页面样式和技术架构，支持订单筛选、详情查看、资料修改、新增关联与删除确认。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="订单总数" value={String(orders.length)} />
                <StatCard label="订单总金额" value={formatPrice(totalAmount)} highlight />
                <StatCard label="大额订单" value={String(highAmountCount)} highlight />
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
                  支持按创建时间、订单编号、客户信息与商品信息快速筛选目标订单。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-panel transition-colors duration-200 hover:bg-brand-600"
              >
                <PlusIcon />
                新增订单
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <InputField
                label="创建时间"
                type="date"
                value={draftFilters.date}
                onChange={(value) => updateDraftFilter("date", value)}
              />
              <InputField
                label="订单编号"
                placeholder="请输入订单编号"
                value={draftFilters.orderId}
                onChange={(value) => updateDraftFilter("orderId", value)}
              />
              <SearchableFilterField
                containerRef={customerFilterRef}
                inputRef={customerFilterInputRef}
                label="客户名"
                value={draftFilters.customerName}
                placeholder="请输入或选择客户名"
                open={customerDropdownOpen}
                options={filteredCustomerNameOptions}
                onChange={(value) => {
                  updateDraftFilter("customerName", value);
                  setCustomerDropdownOpen(true);
                }}
                onToggle={() => {
                  setCustomerDropdownOpen((prev) => !prev);
                  customerFilterInputRef.current?.focus();
                }}
                onSelect={(value) => {
                  updateDraftFilter("customerName", value);
                  setCustomerDropdownOpen(false);
                }}
              />
              <InputField
                label="客户电话"
                placeholder="请输入客户电话"
                value={draftFilters.customerPhone}
                onChange={(value) => updateDraftFilter("customerPhone", value)}
              />
              <SearchableFilterField
                containerRef={productFilterRef}
                inputRef={productFilterInputRef}
                label="商品名"
                value={draftFilters.productName}
                placeholder="请输入或选择商品名"
                open={productDropdownOpen}
                options={filteredProductNameOptions}
                onChange={(value) => {
                  updateDraftFilter("productName", value);
                  setProductDropdownOpen(true);
                }}
                onToggle={() => {
                  setProductDropdownOpen((prev) => !prev);
                  productFilterInputRef.current?.focus();
                }}
                onSelect={(value) => {
                  updateDraftFilter("productName", value);
                  setProductDropdownOpen(false);
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFilters(draftFilters)}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-600"
              >
                查询
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(emptyFilters);
                  setFilters(emptyFilters);
                  setCustomerDropdownOpen(false);
                  setProductDropdownOpen(false);
                }}
                className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-medium text-brand-600 transition-colors duration-200 hover:bg-brand-50"
              >
                重置
              </button>
            </div>
          </section>

          <section className="glass rounded-2xl shadow-soft">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="bank-divider text-lg font-semibold text-slate-900">
                  订单列表
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  展示创建时间、客户信息、商品信息与金额。
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                搜索结果共 {filteredOrders.length} 条
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#edf7f1] text-center">
                    {[
                      "创建时间",
                      "订单编号",
                      "客户名称",
                      "客户电话",
                      "商品编号",
                      "商品名称",
                      "金额",
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
                        colSpan={8}
                        className="border-t border-b border-slate-100 px-6 py-10 text-center text-sm text-slate-500"
                      >
                        正在加载订单数据...
                      </td>
                    </tr>
                  ) : pageOrders.length ? (
                    pageOrders.map((order, index) => {
                      const borderClass =
                        index === pageOrders.length - 1 ? "border-t border-b" : "border-t";

                      return (
                        <tr
                          key={order.id}
                          className="transition-colors duration-200 hover:bg-brand-50/40"
                        >
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-600`}>
                            {order.createdAt}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm font-semibold text-slate-800`}>
                            {order.id}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-800`}>
                            {order.customerName}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-600`}>
                            {order.customerPhone}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm font-semibold text-slate-800`}>
                            {order.productCode}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-800`}>
                            {order.productName}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm font-semibold text-brand-600`}>
                            {formatPrice(order.amount)}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center`}>
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openDetailDrawer(order)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                              >
                                详情
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditDrawer(order)}
                                className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-600"
                              >
                                修改
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(order)}
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
                        colSpan={8}
                        className="border-t border-b border-slate-100 px-6 py-10 text-center text-sm text-slate-500"
                      >
                        未查询到符合条件的订单，请调整筛选条件后重试。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                共 {orders.length} 条订单，当前展示 {startIndex} - {endIndex} 条
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
                  disabled={page === totalPages || !filteredOrders.length}
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
        title="新增订单"
        description="选择客户电话和商品后，系统会自动关联客户名称、商品编号和金额。"
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setAddForm(emptyForm);
        }}
      >
        <OrderForm
          form={addForm}
          leads={leads}
          products={products}
          selectedLead={selectedAddLead}
          selectedProduct={selectedAddProduct}
          submitLabel="添加订单"
          onChange={setAddForm}
          onCancel={() => {
            setAddModalOpen(false);
            setAddForm(emptyForm);
          }}
          onSubmit={handleCreateOrder}
        />
      </CenterModal>

      <SideDrawer
        title={drawerMode === "edit" ? "修改" : "详情"}
        description={
          drawerMode === "edit"
            ? "用户可以修改订单的客户电话和商品，系统会自动同步关联字段。"
            : "查看当前订单的详细信息。"
        }
        open={drawerMode !== null}
        onClose={() => setDrawerMode(null)}
      >
        {selectedOrder ? (
          drawerMode === "edit" ? (
            <OrderForm
              form={editForm}
              leads={leads}
              products={products}
              selectedLead={selectedEditLead}
              selectedProduct={selectedEditProduct}
              submitLabel="保存修改"
              onChange={setEditForm}
              onCancel={() => setDrawerMode(null)}
              onSubmit={handleUpdateOrder}
            />
          ) : (
            <div className="space-y-4">
              <ReadonlyField label="创建时间" value={selectedOrder.createdAt} />
              <ReadonlyField label="订单编号" value={selectedOrder.id} />
              <ReadonlyField label="客户名称" value={selectedOrder.customerName} />
              <ReadonlyField label="客户电话" value={selectedOrder.customerPhone} />
              <ReadonlyField label="商品编号" value={selectedOrder.productCode} />
              <ReadonlyField label="商品名称" value={selectedOrder.productName} />
              <ReadonlyField label="金额" value={formatPrice(selectedOrder.amount)} />
            </div>
          )
        ) : null}
      </SideDrawer>

      <CenterModal
        title="删除确认"
        description={
          selectedOrder
            ? `确认删除订单“${selectedOrder.id}”吗？确认后将删除当前订单数据。`
            : "确认删除当前订单吗？"
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
            onClick={handleDeleteOrder}
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

function SearchableFilterField({
  containerRef,
  inputRef,
  label,
  value,
  placeholder,
  open,
  options,
  onChange,
  onToggle,
  onSelect
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  label: string;
  value: string;
  placeholder: string;
  open: boolean;
  options: string[];
  onChange: (value: string) => void;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="block" ref={containerRef}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-[#fcfffd] px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400"
          aria-label={`展开${label}下拉框`}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 4 4 4-4" />
          </svg>
        </button>
      </div>
      {open ? (
        <div className="relative">
          <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-soft">
            {options.length ? (
              options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelect(option)}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-slate-400">未找到匹配项</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-300 bg-[#fcfffd] px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 4 4 4-4" />
        </svg>
      </div>
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

function OrderForm({
  form,
  leads,
  products,
  selectedLead,
  selectedProduct,
  submitLabel,
  onChange,
  onCancel,
  onSubmit
}: {
  form: OrderFormState;
  leads: Lead[];
  products: Product[];
  selectedLead: Lead | null;
  selectedProduct: Product | null;
  submitLabel: string;
  onChange: (value: OrderFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const isDisabled = !form.customerPhone || !form.productCode;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="客户电话"
          value={form.customerPhone}
          onChange={(value) => onChange({ ...form, customerPhone: value })}
          options={[
            { value: "", label: "请选择客户电话" },
            ...leads.map((lead) => ({
              value: lead.phone,
              label: `${lead.phone} / ${lead.name}`
            }))
          ]}
        />
        <ReadonlyField label="客户名称" value={selectedLead?.name ?? ""} />
        <SelectField
          label="下单商品"
          value={form.productCode}
          onChange={(value) => onChange({ ...form, productCode: value })}
          options={[
            { value: "", label: "请选择下单商品" },
            ...products.map((product) => ({
              value: product.code,
              label: product.name
            }))
          ]}
        />
        <ReadonlyField label="商品编号" value={selectedProduct?.code ?? ""} />
        <ReadonlyField label="商品名称" value={selectedProduct?.name ?? ""} />
        <ReadonlyField
          label="金额"
          value={selectedProduct ? formatPrice(selectedProduct.price) : ""}
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
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-600">订单管理</p>
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
            <p className="text-sm font-medium text-brand-600">订单管理</p>
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
