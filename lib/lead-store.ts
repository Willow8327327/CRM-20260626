import { promises as fs } from "node:fs";
import path from "node:path";

import { formatDateTime } from "@/lib/date";
import type { FollowUp, Lead, LeadInput } from "@/lib/types";

const leadsFilePath = path.join(process.cwd(), "data", "leads.json");

async function writeLeads(leads: Lead[]) {
  await fs.writeFile(leadsFilePath, JSON.stringify(leads, null, 2), "utf8");
}

export async function readLeads(): Promise<Lead[]> {
  const file = await fs.readFile(leadsFilePath, "utf8");
  return JSON.parse(file) as Lead[];
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const leads = await readLeads();
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const nextId = `LS${datePart}${String(leads.length + 1).padStart(3, "0")}`;

  const lead: Lead = {
    id: nextId,
    createdAt: formatDateTime(now),
    followUps: [],
    ...input
  };

  const nextLeads = [lead, ...leads];
  await writeLeads(nextLeads);
  return lead;
}

export async function updateLead(
  id: string,
  updates: Partial<LeadInput>
): Promise<Lead | null> {
  const leads = await readLeads();
  const index = leads.findIndex((lead) => lead.id === id);

  if (index < 0) {
    return null;
  }

  const updatedLead: Lead = {
    ...leads[index],
    ...updates
  };

  leads[index] = updatedLead;
  await writeLeads(leads);
  return updatedLead;
}

export async function addFollowUp(
  id: string,
  followUp: FollowUp
): Promise<Lead | null> {
  const leads = await readLeads();
  const index = leads.findIndex((lead) => lead.id === id);

  if (index < 0) {
    return null;
  }

  const updatedLead: Lead = {
    ...leads[index],
    followUps: [...leads[index].followUps, followUp]
  };

  leads[index] = updatedLead;
  await writeLeads(leads);
  return updatedLead;
}
