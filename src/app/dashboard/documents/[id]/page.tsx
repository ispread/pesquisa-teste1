import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  ArrowLeft,
  Calendar,
  Tag,
  Zap,
  Database,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import TokenCounter from "@/components/token-counter";
import EditDocumentDialog from "@/components/edit-document-dialog";
import DeleteForm from "@/components/delete-form";
import { deleteDocument } from "@/app/actions/document-actions";
import DocumentExtraction from "@/components/document-extraction";

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch document details
  const { data: document, error } = await supabase
    .from("documents")
    .select("*, projects(name)")
    .eq("id", params.id)
    .single();

  if (error || !document) {
    return redirect("/dashboard/documents");
  }

  // Get document URL
  const { data: urlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.file_path, 60 * 60); // 1 hour expiration

  // Fetch extraction fields for this document's project
  const { data: extractionFields } = await supabase
    .from("extraction_fields")
    .select("*")
    .eq("project_id", document.project_id)
    .order("name");

  // Fetch existing extraction results for this document
  const { data: extractionResults } = await supabase
    .from("extraction_results")
    .select("*, extraction_fields(name, data_type)")
    .eq("document_id", document.id);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="mb-2">
                  <Link href="/dashboard/documents">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Documents
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold">{document.name}</h1>
              <p className="text-gray-500 mt-1">
                Project:{" "}
                <Link
                  href={`/dashboard/projects/${document.project_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {document.projects?.name}
                </Link>
              </p>
            </div>
            <div className="flex gap-2">
              {urlData?.signedUrl && (
                <Button variant="outline" asChild>
                  <a
                    href={urlData.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </a>
                </Button>
              )}
              <EditDocumentDialog document={document} />
              <DeleteForm
                itemName={document.name}
                itemType="document"
                formAction={deleteDocument}
                itemId={document.id}
              />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Document Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Document Info</h2>

                <div className="space-y-4">
                  {document.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Description
                      </h3>
                      <p className="mt-1">{document.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        File Type
                      </h3>
                      <p className="mt-1">{document.file_type}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        File Size
                      </h3>
                      <p className="mt-1">
                        {formatFileSize(document.file_size)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Uploaded
                      </h3>
                      <p className="mt-1">
                        {new Date(document.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(document.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Last Analyzed
                      </h3>
                      <p className="mt-1">
                        {document.last_analyzed_at
                          ? new Date(
                              document.last_analyzed_at,
                            ).toLocaleDateString()
                          : "Never"}
                      </p>
                      {document.last_analyzed_at && (
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(
                            new Date(document.last_analyzed_at),
                            { addSuffix: true },
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Token Usage
                    </h3>
                    <TokenCounter
                      fileType={document.file_type}
                      fileSize={document.file_size}
                    />
                  </div>
                </div>
              </div>

              {/* Document Preview */}
              {urlData?.signedUrl && (
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Preview</h2>
                  <div className="aspect-[3/4] w-full bg-gray-100 rounded-md overflow-hidden">
                    {document.file_type.includes("pdf") ? (
                      <iframe
                        src={`${urlData.signedUrl}#toolbar=0&navpanes=0`}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    ) : document.file_type.includes("image") ? (
                      <img
                        src={urlData.signedUrl}
                        alt={document.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="h-16 w-16 text-gray-400" />
                        <p className="mt-4 text-gray-500">
                          Preview not available for this file type
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Extraction Section */}
            <div className="lg:col-span-2">
              <DocumentExtraction
                document={document}
                extractionFields={extractionFields || []}
                existingResults={extractionResults || []}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
