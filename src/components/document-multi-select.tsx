"use client";

import { useState } from "react";
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

interface DocumentMultiSelectProps {
  documents: Document[];
  projectId?: string;
}

export default function DocumentMultiSelect({
  documents,
  projectId,
}: DocumentMultiSelectProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

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
    <div className="space-y-4">
      {/* Multi-select controls */}
      {documents.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-t-lg border-x border-t">
          <div className="flex items-center space-x-4">
            <Checkbox
              id="select-all"
              checked={
                selectedDocs.length > 0 &&
                selectedDocs.length === documents.length
              }
              onCheckedChange={toggleSelectAll}
            />
            <label
              htmlFor="select-all"
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
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Documents</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedDocs.length}{" "}
                    selected document(s)? This action cannot be undone.
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
      )}

      {/* Document table with checkboxes */}
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 px-6 py-3 text-left">
              {documents.length > 0 && (
                <Checkbox
                  checked={
                    selectedDocs.length > 0 &&
                    selectedDocs.length === documents.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              )}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Analyzed
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className={`hover:bg-gray-50 ${selectedDocs.includes(doc.id) ? "bg-blue-50" : ""}`}
            >
              <td className="px-6 py-4">
                <Checkbox
                  checked={selectedDocs.includes(doc.id)}
                  onCheckedChange={() => toggleSelect(doc.id)}
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100">
                      <span className="text-xs font-medium text-gray-600">
                        {doc.file_path.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 break-words">
                      {doc.name}
                    </div>
                  </div>
                </div>
              </td>
              {/* Other cells would be rendered here */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
