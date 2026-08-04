export function actionLabel(action: string): string {
  const map: Record<string, string> = {
    "user.created": "Creación de usuario",
    "user.role_changed": "Cambio de rol",
    "user.status_changed": "Cambio de estado",
    "user.deleted": "Eliminación de usuario",
    "task.created": "Creación de tarea",
    "task.updated": "Edición de tarea",
    "task.deleted": "Eliminación de tarea",
    "task.status:TODO": "Tarea movida a Pendiente",
    "task.status:IN_PROGRESS": "Tarea movida a En progreso",
    "task.status:DONE": "Tarea completada",
    "tasks.bulk_updated": "Actualización masiva de tareas",
    "tasks.bulk_deleted": "Eliminación masiva de tareas",
    "project.invite_sent": "Invitación enviada",
    "project.member_joined_invite": "Miembro se unió por invitación",
    "project.created": "Proyecto creado",
    "project.deleted": "Proyecto eliminado",
    "project.member_added": "Miembro agregado",
    "project.member_removed": "Miembro eliminado",
  };
  return map[action] ?? action;
}

export interface ActivityItem {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string | Date;
  actor: { name: string } | null;
}
