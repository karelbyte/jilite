import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: es });
}