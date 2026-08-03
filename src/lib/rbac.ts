import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Project, ProjectMember, Role, UserStatus } from "@/generated/prisma/client";

export interface AuthedUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  status: UserStatus;
}

export type ProjectWithAccess = Project & {
  members: ProjectMember[];
  _count?: { members: number; tasks: number };
};

export async function getAuthedUser(): Promise<AuthedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export function isAdmin(user: Pick<AuthedUser, "role">) {
  return user.role === "ADMIN";
}

export function isProjectOwner(user: AuthedUser, projectCreatedById: string) {
  return user.role !== "USER" && user.id === projectCreatedById;
}

export async function getProjectAccess(
  user: AuthedUser,
  projectId: string
): Promise<{ access: "read" | "manage" | null; project: Project & { members: ProjectMember[] } | null }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) return { access: null, project: null };
  if (isAdmin(user)) return { access: "manage", project };
  if (isProjectOwner(user, project.createdById)) return { access: "manage", project };

  const membership = project.members.some((m) => m.userId === user.id);
  if (membership) return { access: "read", project };

  return { access: null, project };
}

export async function memberOf(userId: string, projectId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

export async function getVisibleProjectIds(user: AuthedUser): Promise<string[]> {
  if (isAdmin(user)) {
    const projects = await prisma.project.findMany({ select: { id: true } });
    return projects.map((p) => p.id);
  }
  if (user.role === "PROJECT_ADMIN") {
    const projects = await prisma.project.findMany({
      where: { OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] },
      select: { id: true },
    });
    return projects.map((p) => p.id);
  }
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: user.id } } },
    select: { id: true },
  });
  return projects.map((p) => p.id);
}

export async function getAssignableUsers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, status: true } } },
  });
  return members
    .filter((m) => m.user.status === "ACTIVE")
    .map((m) => ({ id: m.user.id, name: m.user.name }));
}