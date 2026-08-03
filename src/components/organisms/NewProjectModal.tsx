"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Modal from "@/components/molecules/Modal";
import ProjectForm from "@/components/organisms/ProjectForm";

export default function NewProjectModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nuevo proyecto</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo proyecto">
        <ProjectForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}