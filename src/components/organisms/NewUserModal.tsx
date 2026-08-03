"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Modal from "@/components/molecules/Modal";
import AdminUserForm from "@/components/organisms/AdminUserForm";

export default function NewUserModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Crear usuario</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Crear usuario">
        <AdminUserForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}