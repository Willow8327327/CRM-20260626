import Link from "next/link";

import { BankLogo } from "@/components/bank-logo";

interface AppSidebarProps {
  active: "dashboard" | "leads" | "products" | "orders";
}

function navClass(isActive: boolean) {
  return isActive
    ? "border border-brand-100 bg-brand-500 text-white shadow-panel"
    : "text-slate-700 hover:bg-brand-50 hover:text-brand-700";
}

function iconClass(isActive: boolean) {
  return isActive ? "text-white" : "text-brand-400";
}

export function AppSidebar({ active }: AppSidebarProps) {
  const overviewText =
    active === "dashboard"
      ? "核心经营概览"
      : active === "products"
      ? "商品资料概览"
      : active === "orders"
        ? "订单成交概览"
        : "今日线索增长";

  const overviewValue =
    active === "dashboard"
      ? "¥86,400"
      : active === "products"
        ? "6"
        : active === "orders"
          ? "5"
          : "+128";

  const overviewSubtext =
    active === "dashboard"
      ? "目标完成率 86.4%"
      : active === "products"
      ? "本月新增商品 5 件"
      : active === "orders"
        ? "本月新增订单 4 笔"
        : "较昨日提升 18.6%";

  const overviewTag =
    active === "dashboard"
      ? "实时"
      : active === "products"
        ? "已同步"
        : active === "orders"
          ? "已成交"
          : "稳定";

  const reminderTitle =
    active === "dashboard"
      ? "经营看板提醒"
      : active === "products"
      ? "商品运营提醒"
      : active === "orders"
        ? "订单处理提醒"
        : "本周重点提醒";

  const reminderText =
    active === "dashboard"
      ? "建议优先关注订单转化和高价值线索来源，及时调整销售资源投放。"
      : active === "products"
      ? "建议优先核对高价值商品价格与命名规范，保持商品档案信息一致。"
      : active === "orders"
        ? "建议优先核对当日新增订单的客户与商品关联信息，确保下单数据准确。"
        : "优先级为“高”的线索建议在 24 小时内首联，提升转化效率。";

  return (
    <aside className="w-full max-w-[272px] border-r border-[#d8e9de] bg-[#f7faf8] px-5 py-6 text-slate-800">
      <div className="mb-10 flex items-center gap-3">
        <BankLogo />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-500/70">
            i-QCustAgent
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-wide text-slate-900">
            邮储文询客智中枢
          </h1>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-4">
        <p className="text-sm text-brand-600">{overviewText}</p>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold text-slate-900">{overviewValue}</p>
            <p className="mt-1 text-xs text-slate-500">{overviewSubtext}</p>
          </div>
          <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-medium text-brand-600">
            {overviewTag}
          </span>
        </div>
      </div>

      <nav className="space-y-2">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${navClass(active === "dashboard")}`}
        >
          <svg
            className={`h-5 w-5 ${iconClass(active === "dashboard")}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16V9m5 7V5m5 11v-6" />
          </svg>
          数据仪表盘
        </Link>
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${navClass(active === "leads")}`}
        >
          <svg
            className={`h-5 w-5 ${iconClass(active === "leads")}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h7" />
          </svg>
          线索管理
        </Link>
        <Link
          href="/products"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${navClass(active === "products")}`}
        >
          <svg
            className={`h-5 w-5 ${iconClass(active === "products")}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7.5h16M6 4h12a2 2 0 0 1 2 2v12.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V6a2 2 0 0 1 2-2Zm1 7h4m-4 4h7"
            />
          </svg>
          商品管理
        </Link>
        <Link
          href="/orders"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${navClass(active === "orders")}`}
        >
          <svg
            className={`h-5 w-5 ${iconClass(active === "orders")}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 6.5h14M7 4h10a2 2 0 0 1 2 2v11.5A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5V6a2 2 0 0 1 2-2Zm1 6h8m-8 4h5"
            />
          </svg>
          订单管理
        </Link>
      </nav>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
        <p className="text-sm font-medium text-slate-900">{reminderTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{reminderText}</p>
      </div>
    </aside>
  );
}
