"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "../../supabase/client";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  name: string;
  file_path: string;
}

interface DocumentBatchActionsProps {
  documents: Document[];
  projectId?: string;
}

export default function DocumentBatchActions({
  documents,
  projectId,
}: DocumentBatchActionsProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  // Reset selection when documents change
  useEffect(() => {
    setSelectedDocs([]);
  }, [documents]);

  const toggleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map((doc) => doc.id));
    }
  };

  const toggleSelect = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter((id) => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const handleDelete = async () => {
    if (selectedDocs.length === 0) return;

    setIsDeleting(true);
    const supabase = createClient();

    try {
      // Get document details to find file paths
      const { data: selectedDocuments } = await supabase
        .from("documents")
        .select("*")
        .in("id", selectedDocs);

      if (!selectedDocuments) {
        throw new Error("Could not find selected documents");
      }

      // Delete extraction results associated with these documents
      await supabase
        .from("extraction_results")
        .delete()
        .in("document_id", selectedDocs);

      // Delete the files from storage
      const filePaths = selectedDocuments.map((doc) => doc.file_path);
      await supabase.storage.from("documents").remove(filePaths);

      // Delete the document records
      await supabase.from("documents").delete().in("id", selectedDocs);

      toast({
        title: "Documents deleted",
        description: `Successfully deleted ${selectedDocs.length} document(s).`,
      });

      // Reset selection
      setSelectedDocs([]);
      setIsDialogOpen(false);

      // Refresh the page
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error deleting documents",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between bg-gray-50 p-4 border-b">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all-docs"
            checked={
              selectedDocs.length > 0 &&
              selectedDocs.length === documents.length
            }
            onCheckedChange={toggleSelectAll}
            className="data-[state=checked]:bg-blue-600"
          />
          <label
            htmlFor="select-all-docs"
            className="text-sm font-medium cursor-pointer"
          >
            {selectedDocs.length === 0
              ? "Select all"
              : selectedDocs.length === documents.length
                ? "Deselect all"
                : `Selected ${selectedDocs.length} of ${documents.length}`}
          </label>
        </div>

        {selectedDocs.length > 0 && (
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedDocs.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Documents</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedDocs.length} selected
                  document(s)? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Render checkboxes for each document */}
      {documents.map((doc) => (
        <div key={doc.id} className="hidden">
          <Checkbox
            checked={selectedDocs.includes(doc.id)}
            onCheckedChange={() => toggleSelect(doc.id)}
          />
        </div>
      ))}
    </div>
  );
}
