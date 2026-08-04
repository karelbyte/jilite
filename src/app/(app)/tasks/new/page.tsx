import { redirect } from "next/navigation";
import { requireUser, getProjectAccess, getAssignableUsers } from "@/lib/rbac";
import NewTaskView from "@/components/organisms/NewTaskView";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  if (!project) redirect("/dashboard");

  const user = await requireUser();
  const access = await getProjectAccess(user, project);
  if (!access.project || access.access === null) redirect("/dashboard");

  const users = await getAssignableUsers(project);

  return <NewTaskView projectId={project} users={users} />;
}
