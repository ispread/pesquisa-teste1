"use client";

import { useState, useEffect } from "react";
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
import { updateExtractionField } from "@/app/actions/extraction-field-actions";
import EditForm from "@/components/edit-form";
import { createClient } from "../../supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Folder {
  id: string;
  name: string;
}

interface EditExtractionFieldDialogProps {
  field: {
    id: string;
    name: string;
    data_type: string;
    description: string | null;
    project_id: string;
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

export default function EditExtractionFieldDialog({
  field,
  variant = "outline",
  size = "default",
  className,
}: EditExtractionFieldDialogProps) {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Fetch all folders in the project
      const { data: projectFolders } = await supabase
        .from("folders")
        .select("id, name")
        .eq("project_id", field.project_id)
        .order("name");

      if (projectFolders) {
        setFolders(projectFolders);
      }

      // Fetch currently selected folders for this field
      const { data: fieldFolders } = await supabase
        .from("extraction_field_folders")
        .select("folder_id")
        .eq("extraction_field_id", field.id);

      if (fieldFolders) {
        setSelectedFolders(fieldFolders.map((item) => item.folder_id));
      }

      setLoading(false);
    };

    if (open) {
      fetchData();
    }
  }, [field.id, field.project_id, open]);

  const handleFolderChange = (folderId: string, checked: boolean) => {
    if (checked) {
      setSelectedFolders((prev) => [...prev, folderId]);
    } else {
      setSelectedFolders((prev) => prev.filter((id) => id !== folderId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <EditForm
          formAction={updateExtractionField}
          submitButtonText="Save Changes"
          pendingButtonText="Saving..."
          successMessage="Extraction field updated successfully"
          redirectPath={`/dashboard/projects/${field.project_id}`}
          onCancel={() => setOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Edit Extraction Field</DialogTitle>
            <DialogDescription>
              Update your extraction field details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="id" value={field.id} />

            <div className="grid gap-2">
              <Label htmlFor="name">Field Name</Label>
              <Input id="name" name="name" defaultValue={field.name} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="data_type">Data Type</Label>
              <Select name="data_type" defaultValue={field.data_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={field.description || ""}
                rows={3}
              />
            </div>

            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Loading folders...</p>
              </div>
            ) : folders.length > 0 ? (
              <div className="grid gap-2">
                <Label>Apply to Folders</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Select folders where this extraction field should be applied.
                  If none are selected, it will apply to all documents in the
                  project.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`folder-${folder.id}`}
                        name="folder_ids"
                        value={folder.id}
                        checked={selectedFolders.includes(folder.id)}
                        onChange={(e) =>
                          handleFolderChange(folder.id, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor={`folder-${folder.id}`}
                        className="text-sm"
                      >
                        {folder.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </EditForm>
      </DialogContent>
    </Dialog>
  );
}
