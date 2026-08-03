import { describe, expect, it } from "vitest";
import { commentSchema, loginSchema, registerSchema, taskSchema } from "./validations";

describe("registerSchema", () => {
  it("acepta datos válidos", () => {
    const res = registerSchema.safeParse({
      name: "María Torres",
      email: "maria@jilite.com",
      password: "Secreto123!",
    });
    expect(res.success).toBe(true);
  });

  it("rechaza contraseña corta", () => {
    const res = registerSchema.safeParse({ name: "A", email: "a@b.com", password: "123" });
    expect(res.success).toBe(false);
  });

  it("rechaza contraseña sin símbolo", () => {
    const res = registerSchema.safeParse({
      name: "A",
      email: "a@b.com",
      password: "Secreto123",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza correo inválido", () => {
    const res = registerSchema.safeParse({ name: "A", email: "nope", password: "123456" });
    expect(res.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rechaza sin contraseña", () => {
    const res = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(res.success).toBe(false);
  });
});

describe("taskSchema", () => {
  it("acepta valores por defecto opcionales", () => {
    const res = taskSchema.safeParse({
      title: "Tarea",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "",
    });
    expect(res.success).toBe(true);
  });

  it("rechaza estado inválido", () => {
    const res = taskSchema.safeParse({ title: "T", status: "X", priority: "LOW" });
    expect(res.success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("rechaza comentario con más de 3000 caracteres", () => {
    const res = commentSchema.safeParse({ body: "a".repeat(3001) });
    expect(res.success).toBe(false);
  });
});