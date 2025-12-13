import React from "react";

type Status = "active" | "pending" | "rejected" | "draft";

interface Props {
  status?: Status | string | null | undefined;
}

const styles: Record<Status, string> = {
  active:
    "inline-flex items-center justify-center rounded-full border border-green-300 bg-green-50 px-3 py-0.5 text-sm font-medium text-green-700",
  pending:
    "inline-flex items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-sm font-medium text-amber-700",
  rejected:
    "inline-flex items-center justify-center rounded-full border border-red-300 bg-red-50 px-3 py-0.5 text-sm font-medium text-red-700",
  draft:
    "inline-flex items-center justify-center rounded-full border border-gray-300 bg-gray-50 px-3 py-0.5 text-sm font-medium text-gray-700",
};

/**
 * Normalizes a business status string to a StatusBadge-compatible status.
 * Maps database statuses (approved, suspended, closed, etc.) to StatusBadge types.
 */
export function normalizeBusinessStatus(status: string | null | undefined): Status {
  if (!status) return "active"; // Default to "active" instead of "pending"
  
  const normalized = status.toLowerCase().trim();
  
  if (normalized === "active" || normalized === "approved") return "active";
  if (normalized === "pending") return "pending";
  if (normalized === "suspended" || normalized === "closed" || normalized === "rejected") return "rejected";
  if (normalized === "draft" || normalized === "inactive") return "draft";
  
  return "active"; // Default fallback to "active"
}

export default function StatusBadge({ status }: Props) {
  // Normalize the status - defaults to "active" if not provided
  const normalizedStatus = normalizeBusinessStatus(status);
  
  return <span className={styles[normalizedStatus]}>{normalizedStatus}</span>;
}
