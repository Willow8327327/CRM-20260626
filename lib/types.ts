export type LeadPriority = "高" | "中" | "低";

export interface FollowUp {
  time: string;
  note: string;
  by: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  priority: LeadPriority;
  source: string;
  owner: string;
  followUps: FollowUp[];
}

export interface LeadInput {
  name: string;
  phone: string;
  priority: LeadPriority;
  source: string;
  owner: string;
}

export interface Product {
  id: string;
  createdAt: string;
  code: string;
  name: string;
  price: number;
}

export interface ProductInput {
  code: string;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  productCode: string;
  productName: string;
  amount: number;
}

export interface OrderInput {
  customerPhone: string;
  productCode: string;
}
