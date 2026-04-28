import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PortalRole = "shipper" | "receiver" | "railway_monitor" | "train_staff";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string) {
  switch (status) {
    case "requested":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "accepted":
      return "border-sky-400/20 bg-sky-400/10 text-sky-200";
    case "in_progress":
      return "border-violet-400/20 bg-violet-400/10 text-violet-200";
    case "completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "cancelled":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    case "open":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    case "under_review":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "resolved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "closed":
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
    default:
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
}

export function getStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
}

export function getRoleLabel(role: PortalRole) {
  switch (role) {
    case "shipper":
      return "Shipper";
    case "receiver":
      return "Receiver";
    case "railway_monitor":
      return "Railway Monitor";
    case "train_staff":
      return "Train Staff";
  }
}

export function getPortalLabel(role: PortalRole) {
  switch (role) {
    case "shipper":
      return "Shipper portal";
    case "receiver":
      return "Receiver portal";
    case "railway_monitor":
      return "Railway monitor portal";
    case "train_staff":
      return "Train staff portal";
  }
}

export function getRoleDescription(role: PortalRole) {
  switch (role) {
    case "shipper":
      return "Create consignments, set receiver details, and watch for diversion or unofficial charges.";
    case "receiver":
      return "Track incoming cargo, verify unload station, and retain proof of handoff.";
    case "railway_monitor":
      return "Review live consignments, investigate disputes, and keep vulnerable handoffs visible.";
    case "train_staff":
      return "Accept onboard custody, log checkpoints, and document unload completion with evidence.";
  }
}

export function getServiceTypeLabel(serviceType: string) {
  switch (serviceType) {
    case "delivery":
      return "Parcel cargo";
    case "transport":
      return "Bulk cargo";
    case "logistics":
      return "High-accountability cargo";
    default:
      return getStatusLabel(serviceType);
  }
}
