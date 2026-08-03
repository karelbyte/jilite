import FileItem from "@/components/molecules/FileItem";
import EmptyState from "@/components/molecules/EmptyState";

interface Props {
  files: Array<{ id: string; name: string; contentType: string }>;
}

export default function FileList({ files }: Props) {
  if (files.length === 0) {
    return (
      <EmptyState
        title="Sin archivos"
        description="Sube imágenes o documentos a esta tarea."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {files.map((file) => (
        <FileItem key={file.id} file={file} />
      ))}
    </ul>
  );
}