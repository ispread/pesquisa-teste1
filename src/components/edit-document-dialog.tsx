"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import { updateDocument } from "@/app/actions/document-actions";
import EditForm from "@/components/edit-form";
import TokenCounter from "@/components/token-counter";

interface EditDocumentDialogProps {
  document: {
    id: string;
    name: string;
    description: string | null;
  };
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function EditDocumentDialog({
  document,
  variant = "outline",
  size = "default",
  className,
}: EditDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: document.name,
    description: document.description || "",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <EditForm
          formAction={updateDocument}
          submitButtonText="Save Changes"
          pendingButtonText="Saving..."
          successMessage="Document updated successfully"
          redirectPath={`/dashboard/documents/${document.id}`}
          onCancel={() => setOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update your document details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="id" value={document.id} />
            <div className="grid gap-2">
              <Label htmlFor="name">Document Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={formData.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={formData.description}
                rows={4}
              />
            </div>
            <div className="grid gap-2 mt-2">
              <TokenCounter
                fileType={document.file_type}
                fileSize={document.file_size}
              />
            </div>
          </div>
        </EditForm>
      </DialogContent>
    </Dialog>
  );
}
