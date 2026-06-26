"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import type { Lead, Order } from "@/lib/types";

const salesTrend = [
  4200, 5600, 5100, 6200, 5800, 6400, 6900, 6100, 7200, 7600, 7300, 8100, 7900,
  8600, 9200
];
const leadsTrend = [3, 5, 4, 6, 5, 7, 8, 6, 9, 10, 8, 9, 11, 10, 12];
const ordersTrend = [1, 2, 1, 3, 2, 4, 3, 2, 4, 5, 4, 5, 6, 5, 6];

const funnelData = [
  { label: "线索获取", value: 128, color: "bg-brand-500" },
  { label: "需求确认", value: 96, color: "bg-emerald-500" },
  { label: "推产品", value: 64, color: "bg-amber-500" },
  { label: "成交", value: 32, color: "bg-rose-500" }
];

const salesRanking = [
  { name: "李思远", amount: 26800 },
  { name: "周可", amount: 24100 },
  { name: "孙明哲", amount: 21800 },
  { name: "何嘉乐", amount: 20500 },
  { name: "赵嘉琪", amount: 18200 },
  { name: "刘辰", amount: 16800 },
  { name: "高昊", amount: 15200 },
  { name: "陈扬", amount: 14800 },
  { name: "王宁", amount: 13300 },
  { name: "林卓", amount: 12600 }
];

const conversionRanking = [
  { name: "孙明哲", rate: 46 },
  { name: "李思远", rate: 42 },
  { name: "周可", rate: 38 },
  { name: "何嘉乐", rate: 35 },
  { name: "赵嘉琪", rate: 33 },
  { name: "刘辰", rate: 30 },
  { name: "高昊", rate: 28 },
  { name: "陈扬", rate: 27 },
  { name: "王宁", rate: 24 },
  { name: "林卓", rate: 22 }
];

type TrendTab = "sales" | "leads" | "orders";

export function DashboardPage() {
  const [trendTab, setTrendTab] = useState<TrendTab>("sales");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const [leadsResponse, ordersResponse] = await Promise.all([
      fetch("/api/leads", { cache: "no-store" }),
      fetch("/api/orders", { cache: "no-store" })
    ]);

    const [leadsData, ordersData] = await Promise.all([
      leadsResponse.json() as Promise<Lead[]>,
      ordersResponse.json() as Promise<Order[]>
    ]);

    setLeads(leadsData);
    setOrders(ordersData);
  }

  const monthlySales = useMemo(
    () => orders.reduce((sum, order) => sum + order.amount, 0),
    [orders]
  );
  const monthlyLeadCount = leads.length;
  const monthlyOrderCount = orders.length;
  const performanceRate = Math.min(100, (monthlySales / 100000) * 100);

  const sourceRanking = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of leads) {
      map.set(lead.source, (map.get(lead.source) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  const productStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      map.set(order.productName, (map.get(order.productName) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const trendConfig = {
    sales: {
      title: "销售额折线图",
      unit: "元",
      color: "#58b67e",
      data: salesTrend
    },
    leads: {
      title: "客户线索数折线图",
      unit: "条",
      color: "#338353",
      data: leadsTrend
    },
    orders: {
      title: "订单数折线图",
      unit: "笔",
      color: "#f59e0b",
      data: ordersTrend
    }
  } satisfies Record<
    TrendTab,
    { title: string; unit: string; color: string; data: number[] }
  >;

  const currentTrend = trendConfig[trendTab];

  return (
    <div className="flex min-h-screen">
      <AppSidebar active="dashboard" />

      <main className="flex-1 p-6 lg:p-7">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="glass overflow-hidden rounded-2xl p-6 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-brand-600">数据仪表盘</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  统一查看销售、线索、订单与人员业绩统计
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  页面结构和技术架构参考线索管理，右侧区域改为统计展示区，当前先以假数据和聚合数据呈现样式效果。
                </p>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="本月销售额" value={formatCurrency(monthlySales)} accent />
            <MetricCard label="本月客户线索数" value={`${monthlyLeadCount}`} />
            <MetricCard label="本月订单数" value={`${monthlyOrderCount}`} />
            <MetricCard
              label="本月业绩完成情况"
              value={`${performanceRate.toFixed(1)}%`}
              helper="目标 10w"
            />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <ChartCard
              title="业绩趋势图"
              extra={
                <div className="flex flex-wrap gap-2">
                  <TrendTabButton
                    active={trendTab === "sales"}
                    label="销售额"
                    onClick={() => setTrendTab("sales")}
                  />
                  <TrendTabButton
                    active={trendTab === "leads"}
                    label="客户线索数"
                    onClick={() => setTrendTab("leads")}
                  />
                  <TrendTabButton
                    active={trendTab === "orders"}
                    label="订单数"
                    onClick={() => setTrendTab("orders")}
                  />
                </div>
              }
            >
              <p className="text-sm text-slate-500">{currentTrend.title}，按日展示近 15 天数据。</p>
              <LineChart data={currentTrend.data} color={currentTrend.color} unit={currentTrend.unit} />
            </ChartCard>

            <ChartCard title="客户转化漏斗">
              <p className="text-sm text-slate-500">按线索获取、需求确认、推产品、成交四个阶段展示。</p>
              <FunnelChart items={funnelData} />
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="线索来源排行榜">
              <p className="text-sm text-slate-500">按照线索数据中的客户来源统计显示。</p>
              <BarChart items={sourceRanking} formatter={(value) => `${value} 条`} />
            </ChartCard>

            <ChartCard title="售卖商品统计">
              <p className="text-sm text-slate-500">按照订单管理中的订单数据统计显示。</p>
              <PieStat items={productStats} />
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="销售业绩统计 Top10">
              <p className="text-sm text-slate-500">按销售业绩金额进行排行。</p>
              <BarChart
                items={salesRanking.map((item) => ({
                  label: item.name,
                  value: item.amount
                }))}
                formatter={(value) => formatCurrency(value)}
              />
            </ChartCard>

            <ChartCard title="销售转化率统计 Top10">
              <p className="text-sm text-slate-500">按销售转化率进行排行。</p>
              <BarChart
                items={conversionRanking.map((item) => ({
                  label: item.name,
                  value: item.rate
                }))}
                formatter={(value) => `${value}%`}
              />
            </ChartCard>
          </section>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  accent
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-5 shadow-soft">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent ? "text-brand-600" : "text-slate-900"}`}>
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

function ChartCard({
  title,
  extra,
  children
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-6 shadow-soft">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="bank-divider text-lg font-semibold text-slate-900">{title}</h3>
        {extra}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function TrendTabButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 ${
        active
          ? "bg-brand-500 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-700"
      }`}
    >
      {label}
    </button>
  );
}

function LineChart({
  data,
  color,
  unit
}: {
  data: number[];
  color: string;
  unit: string;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const width = 760;
  const height = 280;
  const padding = 28;
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data
    .map((value, index) => {
      const x = padding + index * stepX;
      const ratio = max === min ? 0.5 : (value - min) / (max - min);
      const y = height - padding - ratio * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-[#fbfefb] p-4">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>近 15 天</span>
        <span>
          峰值 {max}
          {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = padding + ((height - padding * 2) / 3) * line;
          return (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#dbe7df"
              strokeDasharray="4 6"
            />
          );
        })}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
        {data.map((value, index) => {
          const x = padding + index * stepX;
          const ratio = max === min ? 0.5 : (value - min) / (max - min);
          const y = height - padding - ratio * (height - padding * 2);
          return (
            <g key={`${value}-${index}`}>
              <circle cx={x} cy={y} r="5" fill={color} />
              <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fill="#64748b">
                {value}
              </text>
              <text x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {index + 1}日
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({
  items,
  formatter
}: {
  items: Array<{ label: string; value: number }>;
  formatter: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{formatter(item.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FunnelChart({
  items
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-[#fbfefb] p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.value}</span>
          </div>
          <div className="h-4 rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${item.color}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PieStat({
  items
}: {
  items: Array<{ label: string; value: number }>;
}) {
  const palette = ["#58b67e", "#338353", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let cumulative = 0;

  const segments = items.map((item, index) => {
    const start = (cumulative / total) * 100;
    cumulative += item.value;
    const end = (cumulative / total) * 100;
    return { ...item, color: palette[index % palette.length], start, end };
  });

  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
    .join(", ");

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <div
        className="mx-auto h-56 w-56 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-center text-sm font-semibold text-slate-700 shadow-panel">
            售卖商品
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-slate-700">{segment.label}</span>
            </div>
            <span className="text-slate-500">
              {segment.value} 单 / {((segment.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}
