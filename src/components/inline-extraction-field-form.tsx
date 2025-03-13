"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "../../supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface Folder {
  id: string;
  name: string;
}

interface ExtractionField {
  id?: string;
  name: string;
  data_type: string;
  description: string;
  folder_ids: string[];
}

interface InlineExtractionFieldFormProps {
  projectId: string;
  folders: Folder[];
  onSuccess?: () => void;
}

export default function InlineExtractionFieldForm({
  projectId,
  folders,
  onSuccess,
}: InlineExtractionFieldFormProps) {
  const router = useRouter();
  const [fields, setFields] = useState<ExtractionField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addNewField = () => {
    setFields([
      ...fields,
      { name: "", data_type: "text", description: "", folder_ids: [] },
    ]);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const updateField = (index: number, field: Partial<ExtractionField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
  };

  const toggleFolder = (fieldIndex: number, folderId: string) => {
    const field = fields[fieldIndex];
    const folderIds = field.folder_ids || [];

    if (folderIds.includes(folderId)) {
      updateField(fieldIndex, {
        folder_ids: folderIds.filter((id) => id !== folderId),
      });
    } else {
      updateField(fieldIndex, { folder_ids: [...folderIds, folderId] });
    }
  };

  const handleSubmit = async () => {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create extraction fields",
        variant: "destructive",
      });
      return;
    }
    // Validate fields
    const invalidFields = fields.filter(
      (field) => !field.name || !field.data_type,
    );
    if (invalidFields.length > 0) {
      toast({
        title: "Validation Error",
        description: "All fields must have a name and data type",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create all fields in sequence
      for (const field of fields) {
        // Create the extraction field
        const { data: createdField, error } = await supabase
          .from("extraction_fields")
          .insert({
            name: field.name,
            data_type: field.data_type,
            description: field.description,
            project_id: projectId,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // If folders were selected, create associations
        if (field.folder_ids.length > 0 && createdField) {
          const folderAssociations = field.folder_ids.map((folderId) => ({
            extraction_field_id: createdField.id,
            folder_id: folderId,
          }));

          const { error: assocError } = await supabase
            .from("extraction_field_folders")
            .insert(folderAssociations);

          if (assocError) throw assocError;
        }
      }

      toast({
        title: "Success",
        description: `Successfully created ${fields.length} extraction field(s)`,
      });

      // Reset form
      setFields([]);

      // Refresh the page
      router.refresh();

      // Call success callback if provided
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create extraction fields",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Add Extraction Fields</h3>
        <Button onClick={addNewField} disabled={isSubmitting}>
          <Plus className="h-4 w-4 mr-2" /> Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-gray-500">
            No fields added yet. Click "Add Field" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {fields.map((field, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg bg-gray-50 relative"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                onClick={() => removeField(index)}
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Field Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={field.name}
                    onChange={(e) =>
                      updateField(index, { name: e.target.value })
                    }
                    placeholder="Enter field name (e.g. Invoice Number)"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Data Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={field.data_type}
                    onValueChange={(value) =>
                      updateField(index, { data_type: value })
                    }
                    disabled={isSubmitting}
                  >
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

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={field.description}
                    onChange={(e) =>
                      updateField(index, { description: e.target.value })
                    }
                    placeholder="Enter field description"
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>

                {folders.length > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">
                      Apply to Folders
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Select folders where this extraction field should be
                      applied. If none are selected, it will apply to all
                      documents in the project.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {folders.map((folder) => (
                        <div
                          key={folder.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`field-${index}-folder-${folder.id}`}
                            checked={field.folder_ids.includes(folder.id)}
                            onChange={() => toggleFolder(index, folder.id)}
                            className="rounded border-gray-300"
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor={`field-${index}-folder-${folder.id}`}
                            className="text-sm"
                          >
                            {folder.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end sticky bottom-0 pt-4 pb-2 bg-white border-t mt-4">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save All Fields
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
