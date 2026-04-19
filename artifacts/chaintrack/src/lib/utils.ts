import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
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
    case "requested": return "bg-amber-100 text-amber-800 border-amber-200";
    case "accepted": return "bg-blue-100 text-blue-800 border-blue-200";
    case "in_progress": return "bg-violet-100 text-violet-800 border-violet-200";
    case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "cancelled": return "bg-red-100 text-red-800 border-red-200";
    case "open": return "bg-red-100 text-red-800 border-red-200";
    case "under_review": return "bg-amber-100 text-amber-800 border-amber-200";
    case "resolved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "closed": return "bg-gray-100 text-gray-700 border-gray-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
}
