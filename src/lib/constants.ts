import type { Priority, Role, Status, UserStatus } from "@/generated/prisma/client";

type Item = { label: string; className: string; bar?: string };

export const STATUSES: Status[] = ["TODO", "IN_PROGRESS", "DONE"];

export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export const ROLES: Role[] = ["ADMIN", "PROJECT_ADMIN", "USER"];

export const STATUS_META: Record<Status, Item> = {
  TODO: { label: "Por hacer", className: "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300", bar: "#64748b" },
  IN_PROGRESS: { label: "En progreso", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300", bar: "#0ea5e9" },
  DONE: { label: "Hecho", className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300", bar: "#22c55e" },
};

export const PRIORITY_META: Record<Priority, Item> = {
  LOW: { label: "Baja", className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  MEDIUM: { label: "Media", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  HIGH: { label: "Alta", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
};

export const ROLE_META: Record<Role, Item> = {
  ADMIN: { label: "Admin", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  PROJECT_ADMIN: { label: "Admin de proyecto", className: "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300" },
  USER: { label: "Usuario", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export const USER_STATUS_META: Record<UserStatus, Item> = {
  ACTIVE: { label: "Activo", className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  INACTIVE: { label: "Inactivo", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
};