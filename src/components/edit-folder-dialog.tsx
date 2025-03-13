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
import { updateFolder } from "@/app/actions/folder-actions";
import EditForm from "@/components/edit-form";

interface EditFolderDialogProps {
  folder: {
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

export default function EditFolderDialog({
  folder,
  variant = "outline",
  size = "default",
  className,
}: EditFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: folder.name,
    description: folder.description || "",
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
          formAction={updateFolder}
          submitButtonText="Save Changes"
          pendingButtonText="Saving..."
          successMessage="Folder updated successfully"
          redirectPath={`/dashboard/folders/${folder.id}`}
          onCancel={() => setOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update your folder details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="id" value={folder.id} />
            <div className="grid gap-2">
              <Label htmlFor="name">Folder Name</Label>
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
          </div>
        </EditForm>
      </DialogContent>
    </Dialog>
  );
}
