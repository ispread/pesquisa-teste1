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

interface DocumentBatchActionsClientProps {
  documents: Document[];
  projectId?: string;
}

export default function DocumentBatchActionsClient({
  documents,
  projectId,
}: DocumentBatchActionsClientProps) {
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

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedDocs.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected{" "}
              {selectedDocs.length > 0 && `(${selectedDocs.length})`}
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
      </div>

      {/* Hidden checkboxes for each document to maintain state */}
      {documents.map((doc) => (
        <div key={doc.id} className="hidden">
          <input
            type="checkbox"
            checked={selectedDocs.includes(doc.id)}
            onChange={() => toggleSelect(doc.id)}
          />
        </div>
      ))}

      {/* Export the state and handlers for parent component */}
      <div className="hidden">
        <input
          type="hidden"
          id="selected-docs-data"
          value={JSON.stringify({
            selectedDocs,
            isAllSelected:
              selectedDocs.length === documents.length && documents.length > 0,
          })}
        />
      </div>

      {/* Table with checkboxes */}
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 px-6 py-3 text-left">
              <Checkbox
                checked={
                  selectedDocs.length > 0 &&
                  selectedDocs.length === documents.length
                }
                onCheckedChange={toggleSelectAll}
              />
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
              onClick={() => toggleSelect(doc.id)}
            >
              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedDocs.includes(doc.id)}
                  onCheckedChange={() => toggleSelect(doc.id)}
                />
              </td>
              <td className="px-6 py-4">{/* Document content */}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {/* Type */}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {/* Size */}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {/* Upload date */}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {/* Last analyzed */}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {/* Actions */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
