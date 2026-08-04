import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://jilite:jilite@localhost:5433/jilite";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

async function main() {
  const file = await prisma.file.findUnique({
    where: { id: "cmsepr18d000050lps140epwr" },
    include: { task: { select: { projectId: true } } },
  });
  console.log("=== FILE ===");
  console.log("file:", file);

  if (!file) return;

  const project = await prisma.project.findUnique({
    where: { id: file.task.projectId },
    select: { id: true, createdById: true },
  });
  console.log("\n=== PROJECT ===");
  console.log("project:", project);

  const uploader = await prisma.user.findUnique({
    where: { id: file.uploadedById },
    select: { id: true, email: true, role: true, status: true },
  });
  console.log("\n=== UPLOADER (quien subió) ===");
  console.log("uploader:", uploader);

  if (project) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId: file.uploadedById } },
    });
    console.log("\n=== MEMBERSHIP de uploader ===");
    console.log("member:", member);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
