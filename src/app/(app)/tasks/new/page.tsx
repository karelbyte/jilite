import { redirect } from "next/navigation";
import { requireUser, getProjectAccess, getAssignableUsers } from "@/lib/rbac";
import NewTaskView from "@/components/organisms/NewTaskView";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; date?: string }>;
}) {
  const { project, date } = await searchParams;
  if (!project) redirect("/dashboard");

  const user = await requireUser();
  const access = await getProjectAccess(user, project);
  if (!access.project || access.access === null) redirect("/dashboard");

  const users = await getAssignableUsers(project);
  const defaultDueDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

  return <NewTaskView projectId={project} users={users} defaultDueDate={defaultDueDate} />;
}
