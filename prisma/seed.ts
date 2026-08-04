import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@jilite.com" },
    update: { name: "Admin Jilite", password, role: "ADMIN", status: "ACTIVE" },
    create: {
      name: "Admin Jilite",
      email: "admin@jilite.com",
      password,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const luis = await prisma.user.upsert({
    where: { email: "luis@jilite.com" },
    update: { name: "Luis Pérez", password, role: "PROJECT_ADMIN", status: "ACTIVE" },
    create: {
      name: "Luis Pérez",
      email: "luis@jilite.com",
      password,
      role: "PROJECT_ADMIN",
      status: "ACTIVE",
    },
  });

  const ana = await prisma.user.upsert({
    where: { email: "ana@jilite.com" },
    update: { name: "Ana García", password, role: "USER", status: "ACTIVE" },
    create: {
      name: "Ana García",
      email: "ana@jilite.com",
      password,
      role: "USER",
      status: "ACTIVE",
    },
  });

  const carla = await prisma.user.upsert({
    where: { email: "carla@jilite.com" },
    update: { name: "Carla Ruiz", password, role: "USER", status: "ACTIVE" },
    create: {
      name: "Carla Ruiz",
      email: "carla@jilite.com",
      password,
      role: "USER",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "maria@jilite.com" },
    update: { name: "María Torres", password, role: "USER", status: "INACTIVE" },
    create: {
      name: "María Torres",
      email: "maria@jilite.com",
      password,
      role: "USER",
      status: "INACTIVE",
    },
  });

  const web = await prisma.project.create({
    data: {
      name: "Plataforma web",
      description: "Sitio principal y dashboard de la plataforma.",
      createdById: luis.id,
      members: {
        create: [{ userId: luis.id }, { userId: ana.id }, { userId: carla.id }],
      },
    },
  });

  const mobile = await prisma.project.create({
    data: {
      name: "App móvil",
      description: "Aplicación móvil de seguimiento de tareas.",
      createdById: luis.id,
      members: {
        create: [{ userId: luis.id }, { userId: ana.id }],
      },
    },
  });

  const t1 = await prisma.task.create({
    data: {
      title: "Diseñar el dashboard",
      description: "Crear la vista principal siguiendo Atomic Design con un tema verde.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: web.id,
      assigneeId: ana.id,
      createdById: luis.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Configurar Resend",
      description: "Conectar el envío de correos para las notificaciones de comentarios.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: web.id,
      assigneeId: luis.id,
      createdById: carla.id,
    },
  });

  const t3 = await prisma.task.create({
    data: {
      title: "Revisar base de datos",
      description: "Validar el esquema de Prisma en Postgres.",
      status: "DONE",
      priority: "LOW",
      projectId: web.id,
      assigneeId: carla.id,
      createdById: ana.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Definir pantallas de la app",
      description: "Prototipar las principales pantallas móviles.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: mobile.id,
      assigneeId: ana.id,
      createdById: luis.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Configurar el CI de Railway",
      description: "Agregar variables de entorno y el volumen de uploads.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: web.id,
      assigneeId: luis.id,
      createdById: carla.id,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      title: "Correr backups de BD",
      description: "Automatizar dumps de la base.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: web.id,
      assigneeId: ana.id,
      createdById: luis.id,
      dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      taskId: t1.id,
      authorId: carla.id,
      body: "Me encanta el enfoque, ¿podemos usar un verde más claro?",
    },
  });

  await prisma.comment.create({
    data: { taskId: t3.id, authorId: luis.id, body: "Listo, todo en orden." },
  });

  console.log("Seed completado");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
