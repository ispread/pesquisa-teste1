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
import { createClient } from "../../supabase/client";
import InlineExtractionFieldForm from "./inline-extraction-field-form";

interface AddFieldsDialogProps {
  projectId: string;
  children?: React.ReactNode;
}

export default function AddFieldsDialog({
  projectId,
  children,
}: AddFieldsDialogProps) {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!open) return;

      setLoading(true);
      const supabase = createClient();

      // Fetch folders in this project for selection
      const { data: projectFolders } = await supabase
        .from("folders")
        .select("id, name")
        .eq("project_id", projectId)
        .order("name");

      if (projectFolders) {
        setFolders(projectFolders);
      }

      setLoading(false);
    };

    fetchFolders();
  }, [projectId, open]);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild id="add-fields-dialog">
        {children || <Button>Add Fields</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Extraction Fields</DialogTitle>
          <DialogDescription>
            Create multiple extraction fields at once. Add as many fields as you
            need before saving.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p>Loading...</p>
          </div>
        ) : (
          <InlineExtractionFieldForm
            projectId={projectId}
            folders={folders}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
