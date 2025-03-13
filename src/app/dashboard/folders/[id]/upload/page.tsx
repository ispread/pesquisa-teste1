import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../../supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadDocument } from "@/app/actions/document-actions";
import CreateForm from "@/components/create-form";

export default async function UploadToFolderPage({
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

  // Fetch folder details
  const { data: folder } = await supabase
    .from("folders")
    .select("*, projects(id, name)")
    .eq("id", params.id)
    .single();

  if (!folder) {
    return redirect("/dashboard/projects");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header Section */}
          <header className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link href={`/dashboard/folders/${params.id}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Folder
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Upload Document</h1>
            <p className="text-gray-500 mt-2">
              Upload a document to folder:{" "}
              <span className="font-medium">{folder.name}</span>
            </p>
          </header>

          {/* Upload Form */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <CreateForm
              formAction={uploadDocument}
              submitButtonText="Upload Document"
              pendingButtonText="Uploading..."
              successMessage="Document uploaded successfully"
              redirectPath={`/dashboard/folders/${params.id}`}
            >
              <div className="space-y-6">
                <input
                  type="hidden"
                  name="project_id"
                  value={folder.project_id}
                />
                <input type="hidden" name="folder_id" value={params.id} />

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Document Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter document name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter document description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-medium">
                    Document File <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,.docx,.csv,.xlsx"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: PDF, DOCX, CSV, XLSX (Max 10MB)
                  </p>
                </div>
              </div>
            </CreateForm>
          </div>
        </div>
      </main>
    </>
  );
}
