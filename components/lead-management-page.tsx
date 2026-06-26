"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import type { Lead, LeadInput, LeadPriority } from "@/lib/types";

const pageSize = 5;

const emptyLeadForm: LeadInput = {
  name: "",
  phone: "",
  priority: "中",
  source: "",
  owner: ""
};

const emptyFilters = {
  date: "",
  name: "",
  phone: "",
  priority: "全部",
  source: "全部",
  owner: ""
};

type LeadFilters = typeof emptyFilters;

export function LeadManagementPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [draftFilters, setDraftFilters] = useState<LeadFilters>(emptyFilters);
  const [filters, setFilters] = useState<LeadFilters>(emptyFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadInput>(emptyLeadForm);
  const [editForm, setEditForm] = useState<LeadInput>(emptyLeadForm);
  const [followNote, setFollowNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
  const ownerFilterRef = useRef<HTMLDivElement | null>(null);
  const ownerFilterInputRef = useRef<HTMLInputElement | null>(null);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const pendingLeadCount = useMemo(
    () => leads.filter((lead) => !lead.followUps.length).length,
    [leads]
  );

  const sourceOptions = useMemo(
    () => [...new Set(leads.map((lead) => lead.source))],
    [leads]
  );
  const ownerOptions = useMemo(
    () => [...new Set(leads.map((lead) => lead.owner))],
    [leads]
  );
  const filteredOwnerOptions = useMemo(() => {
    return ownerOptions.filter((owner) => owner.includes(draftFilters.owner));
  }, [draftFilters.owner, ownerOptions]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesDate = !filters.date || lead.createdAt.startsWith(filters.date);
      const matchesName = !filters.name || lead.name.includes(filters.name);
      const matchesPhone = !filters.phone || lead.phone.includes(filters.phone);
      const matchesPriority =
        filters.priority === "全部" || lead.priority === filters.priority;
      const matchesSource =
        filters.source === "全部" || lead.source === filters.source;
      const matchesOwner = !filters.owner || lead.owner.includes(filters.owner);

      return (
        matchesDate &&
        matchesName &&
        matchesPhone &&
        matchesPriority &&
        matchesSource &&
        matchesOwner
      );
    });
  }, [filters, leads]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page]);

  useEffect(() => {
    void loadLeads();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    document.body.style.overflow =
      addModalOpen || viewModalOpen || followModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [addModalOpen, viewModalOpen, followModalOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAllModals();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        ownerFilterRef.current &&
        !ownerFilterRef.current.contains(event.target as Node)
      ) {
        setOwnerDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function loadLeads() {
    setLoading(true);
    const response = await fetch("/api/leads", { cache: "no-store" });
    const data = (await response.json()) as Lead[];
    setLeads(data);
    setLoading(false);
  }

  function closeAllModals() {
    setAddModalOpen(false);
    setViewModalOpen(false);
    setFollowModalOpen(false);
    setOwnerDropdownOpen(false);
    setLeadForm(emptyLeadForm);
    setFollowNote("");
  }

  function openViewModal(lead: Lead) {
    setSelectedLeadId(lead.id);
    setEditForm({
      name: lead.name,
      phone: lead.phone,
      priority: lead.priority,
      source: lead.source,
      owner: lead.owner
    });
    setViewModalOpen(true);
  }

  function openFollowModal(lead: Lead) {
    setSelectedLeadId(lead.id);
    setFollowNote("");
    setFollowModalOpen(true);
  }

  async function handleCreateLead() {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadForm)
    });

    if (!response.ok) {
      return;
    }

    const createdLead = (await response.json()) as Lead;
    setLeads((prev) => [createdLead, ...prev]);
    setLeadForm(emptyLeadForm);
    setAddModalOpen(false);
  }

  async function handleUpdateLead() {
    if (!selectedLeadId) {
      return;
    }

    const response = await fetch(`/api/leads/${selectedLeadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm)
    });

    if (!response.ok) {
      return;
    }

    const updatedLead = (await response.json()) as Lead;
    setLeads((prev) =>
      prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
    );
    setViewModalOpen(false);
  }

  async function handleAddFollowUp() {
    if (!selectedLeadId || !selectedLead || !followNote.trim()) {
      return;
    }

    const response = await fetch(`/api/leads/${selectedLeadId}/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: followNote.trim(),
        by: selectedLead.owner
      })
    });

    if (!response.ok) {
      return;
    }

    const updatedLead = (await response.json()) as Lead;
    setLeads((prev) =>
      prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
    );
    setFollowModalOpen(false);
    setFollowNote("");
  }

  function updateDraftFilter<K extends keyof LeadFilters>(
    key: K,
    value: LeadFilters[K]
  ) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  }

  function getPriorityBadge(priority: LeadPriority) {
    if (priority === "高") return "bg-rose-50 text-rose-600";
    if (priority === "中") return "bg-amber-50 text-amber-600";
    return "bg-emerald-50 text-emerald-600";
  }

  const startIndex = filteredLeads.length ? (page - 1) * pageSize + 1 : 0;
  const endIndex = (page - 1) * pageSize + pageLeads.length;

  return (
    <div className="flex min-h-screen">
      <AppSidebar active="leads" />

      <main className="flex-1 p-6 lg:p-7">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="glass overflow-hidden rounded-2xl p-6 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-brand-600">客户线索管理</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  统一管理销售线索，提升企业客户跟进效率
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  围绕客户来源、优先级与跟进责任人进行集中管理，形成更规范、更清晰的业务处理视图。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="总线索数" value={String(leads.length)} />
                <StatCard label="待跟进" value={String(pendingLeadCount)} highlight />
                <StatCard label="转化率" value="24.8%" highlight />
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
                  支持按创建时间、姓名、电话、优先级、客户来源和跟进人快速定位目标线索。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-panel transition-colors duration-200 hover:bg-brand-600"
              >
                <PlusIcon />
                添加新线索
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <InputField
                label="创建时间"
                type="date"
                value={draftFilters.date}
                onChange={(value) => updateDraftFilter("date", value)}
              />
              <InputField
                label="姓名"
                placeholder="请输入姓名"
                value={draftFilters.name}
                onChange={(value) => updateDraftFilter("name", value)}
              />
              <InputField
                label="电话"
                placeholder="请输入电话"
                value={draftFilters.phone}
                onChange={(value) => updateDraftFilter("phone", value)}
              />
              <SelectField
                label="优先级"
                value={draftFilters.priority}
                onChange={(value) =>
                  updateDraftFilter("priority", value as LeadFilters["priority"])
                }
                options={["全部", "高", "中", "低"]}
              />
              <SelectField
                label="客户来源"
                value={draftFilters.source}
                onChange={(value) =>
                  updateDraftFilter("source", value as LeadFilters["source"])
                }
                options={["全部", ...sourceOptions]}
              />
              <div className="block" ref={ownerFilterRef}>
                <span className="mb-2 block text-sm font-medium text-slate-700">跟进人</span>
                <div className="relative">
                  <input
                    ref={ownerFilterInputRef}
                    value={draftFilters.owner}
                    placeholder="请输入跟进人"
                    onChange={(event) => {
                      updateDraftFilter("owner", event.target.value);
                      setOwnerDropdownOpen(true);
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-[#fcfffd] px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerDropdownOpen((prev) => !prev);
                      ownerFilterInputRef.current?.focus();
                    }}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400"
                    aria-label="展开跟进人下拉框"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 ${ownerDropdownOpen ? "rotate-180" : ""}`}
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
                {ownerDropdownOpen ? (
                  <div className="relative">
                    <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-soft">
                      {filteredOwnerOptions.length ? (
                        filteredOwnerOptions.map((owner) => (
                          <button
                            key={owner}
                            type="button"
                            onClick={() => {
                              updateDraftFilter("owner", owner);
                              setOwnerDropdownOpen(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            {owner}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-slate-400">
                          未找到匹配的跟进人
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
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
                  setOwnerDropdownOpen(false);
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
                  线索列表
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  展示线索编号、联系人信息、优先级、来源与跟进人。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  搜索结果共 {filteredLeads.length} 条
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#edf7f1] text-center">
                    {[
                      "线索编号",
                      "创建时间",
                      "姓名",
                      "电话",
                      "优先级",
                      "客户来源",
                      "跟进人",
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
                        正在加载线索数据...
                      </td>
                    </tr>
                  ) : pageLeads.length ? (
                    pageLeads.map((lead, index) => {
                      const borderClass =
                        index === pageLeads.length - 1 ? "border-t border-b" : "border-t";

                      return (
                        <tr
                          key={lead.id}
                          className="transition-colors duration-200 hover:bg-brand-50/40"
                        >
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm font-semibold text-slate-800`}>
                            {lead.id}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-600`}>
                            {lead.createdAt}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-800`}>
                            {lead.name}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-600`}>
                            {lead.phone}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center`}>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadge(lead.priority)}`}
                            >
                              {lead.priority}
                            </span>
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-600`}>
                            {lead.source}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center text-sm text-slate-800`}>
                            {lead.owner}
                          </td>
                          <td className={`${borderClass} border-slate-100 px-6 py-4 text-center`}>
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openViewModal(lead)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                              >
                                查看
                              </button>
                              <button
                                type="button"
                                onClick={() => openFollowModal(lead)}
                                className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-600"
                              >
                                跟进
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
                        未查询到符合条件的线索，请调整筛选条件后重试。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                共 {leads.length} 条线索，当前展示 {startIndex} - {endIndex} 条
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
                  disabled={page === totalPages || !filteredLeads.length}
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

      <LeadFormModal
        title="录入新的客户线索信息"
        description="填写后将立即同步到线索列表中，便于后续统一跟进。"
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setLeadForm(emptyLeadForm);
        }}
      >
        <LeadForm
          form={leadForm}
          sourceOptions={sourceOptions}
          ownerOptions={ownerOptions}
          onChange={setLeadForm}
          onCancel={() => {
            setAddModalOpen(false);
            setLeadForm(emptyLeadForm);
          }}
          onSubmit={handleCreateLead}
        />
      </LeadFormModal>

      <LeadFormModal
        title="查看并编辑客户线索信息"
        description="支持修改当前线索的基础资料，并保留最近跟进动态。"
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      >
        {selectedLead ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ReadonlyField label="线索编号" value={selectedLead.id} />
              <ReadonlyField label="创建时间" value={selectedLead.createdAt} />
              <InputField
                label="姓名"
                value={editForm.name}
                onChange={(value) => setEditForm((prev) => ({ ...prev, name: value }))}
              />
              <InputField
                label="电话"
                value={editForm.phone}
                onChange={(value) => setEditForm((prev) => ({ ...prev, phone: value }))}
              />
              <SelectField
                label="优先级"
                value={editForm.priority}
                onChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    priority: value as LeadPriority
                  }))
                }
                options={["高", "中", "低"]}
              />
              <InputField
                label="客户来源"
                value={editForm.source}
                onChange={(value) => setEditForm((prev) => ({ ...prev, source: value }))}
              />
              <div className="md:col-span-2">
                <InputField
                  label="跟进人"
                  value={editForm.owner}
                  onChange={(value) => setEditForm((prev) => ({ ...prev, owner: value }))}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900">最近跟进</h4>
              <Timeline followUps={selectedLead.followUps} emptyText="暂无跟进记录，可点击“跟进”补充本次沟通内容。" />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleUpdateLead}
                className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-panel transition-colors duration-200 hover:bg-brand-600"
              >
                保存修改
              </button>
            </div>
          </div>
        ) : null}
      </LeadFormModal>

      <LeadFormModal
        title="记录本次跟进情况"
        description={
          selectedLead
            ? `正在为 ${selectedLead.name} 记录沟通结果与下一步计划。`
            : "为当前线索补充沟通结果与下一步计划。"
        }
        open={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
      >
        {selectedLead ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span>
                  <span className="text-slate-400">线索编号：</span>
                  {selectedLead.id}
                </span>
                <span>
                  <span className="text-slate-400">客户姓名：</span>
                  {selectedLead.name}
                </span>
                <span>
                  <span className="text-slate-400">联系电话：</span>
                  {selectedLead.phone}
                </span>
                <span>
                  <span className="text-slate-400">当前跟进人：</span>
                  {selectedLead.owner}
                </span>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">跟进结果</span>
              <textarea
                rows={4}
                value={followNote}
                onChange={(event) => setFollowNote(event.target.value)}
                placeholder="请输入本次电话、微信或到访沟通内容"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </label>

            <div>
              <h4 className="text-sm font-semibold text-slate-900">历史跟进记录</h4>
              <Timeline followUps={selectedLead.followUps} emptyText="暂无跟进记录，可在本次提交后生成第一条记录。" />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setFollowModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddFollowUp}
                className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-600"
              >
                保存跟进
              </button>
            </div>
          </div>
        ) : null}
      </LeadFormModal>
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

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
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
            <option key={option} value={option}>
              {option}
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

function LeadForm({
  form,
  sourceOptions,
  ownerOptions,
  onChange,
  onCancel,
  onSubmit
}: {
  form: LeadInput;
  sourceOptions: string[];
  ownerOptions: string[];
  onChange: (value: LeadInput) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField
          label="姓名"
          value={form.name}
          placeholder="请输入客户姓名"
          onChange={(value) => onChange({ ...form, name: value })}
        />
        <InputField
          label="电话"
          value={form.phone}
          placeholder="请输入联系电话"
          onChange={(value) => onChange({ ...form, phone: value })}
        />
        <SelectField
          label="优先级"
          value={form.priority}
          onChange={(value) =>
            onChange({ ...form, priority: value as LeadPriority })
          }
          options={["高", "中", "低"]}
        />
        <SelectField
          label="客户来源"
          value={form.source || "请选择客户来源"}
          onChange={(value) =>
            onChange({
              ...form,
              source: value === "请选择客户来源" ? "" : value
            })
          }
          options={["请选择客户来源", ...sourceOptions]}
        />
        <div className="md:col-span-2">
          <SelectField
            label="跟进人"
            value={form.owner || "请选择跟进人"}
            onChange={(value) =>
              onChange({
                ...form,
                owner: value === "请选择跟进人" ? "" : value
              })
            }
            options={["请选择跟进人", ...ownerOptions]}
          />
        </div>
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
          disabled={!form.name || !form.phone || !form.source || !form.owner}
          className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-panel transition-colors duration-200 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          保存线索
        </button>
      </div>
    </div>
  );
}

function LeadFormModal({
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
            <p className="text-sm font-medium text-brand-600">线索管理</p>
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

function Timeline({
  followUps,
  emptyText
}: {
  followUps: Lead["followUps"];
  emptyText: string;
}) {
  if (!followUps.length) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-[#f6fbf7] px-4 py-5 text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {[...followUps].reverse().map((item) => (
        <div
          key={`${item.time}-${item.by}`}
          className="rounded-xl border border-slate-200 bg-[#f6fbf7] px-4 py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900">{item.by}</span>
            <span className="text-xs text-slate-500">{item.time}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
        </div>
      ))}
    </div>
  );
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
