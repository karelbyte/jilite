import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128)
  .regex(/[a-z]/, "Debe tener al menos una minúscula")
  .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
  .regex(/[0-9]/, "Debe tener al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe tener al menos un símbolo");

export const registerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80),
  email: z.string().email("Correo inválido"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeId: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export const commentSchema = z.object({
  body: z.string().min(1, "El comentario es obligatorio").max(3000),
});

export const projectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export const statusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const roleValueSchema = z.enum(["ADMIN", "PROJECT_ADMIN", "USER"]);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;