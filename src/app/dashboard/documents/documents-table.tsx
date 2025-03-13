"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "../../../../supabase/client";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, FileText, Zap } from "lucide-react";
import TokenCounter from "@/components/token-counter";
import Link from "next/link";
import EditDocumentDialog from "@/components/edit-document-dialog";
import DeleteForm from "@/components/delete-form";
import { deleteDocument } from "@/app/actions/document-actions";
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
  file_type: string;
  file_size: number;
  created_at: string;
  last_analyzed_at: string | null;
  project_id: string;
  projects?: {
    name: string;
  };
}

export default function DocumentsTable({
  documents,
}: {
  documents: Document[];
}) {
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
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
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
              Project
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
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="flex items-center"
                >
                  <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="text-sm font-medium text-gray-900 break-words">
                    {doc.name}
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <Link
                  href={`/dashboard/projects/${doc.project_id}`}
                  className="hover:text-blue-600 hover:underline"
                >
                  {doc.projects?.name || "Unknown Project"}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {doc.file_type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  {(doc.file_size / 1024).toFixed(2)} KB
                  <span className="ml-2 text-xs text-blue-600 flex items-center">
                    <Zap className="h-3 w-3 mr-1" />~
                    {Math.round(doc.file_size / 4)} tokens
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(doc.created_at).toLocaleDateString("en-US")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {doc.last_analyzed_at
                  ? new Date(doc.last_analyzed_at).toLocaleDateString()
                  : "Never"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <EditDocumentDialog document={doc} size="sm" />
                  <DeleteForm
                    itemName={doc.name}
                    itemType="document"
                    size="sm"
                    formAction={deleteDocument}
                    itemId={doc.id}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
