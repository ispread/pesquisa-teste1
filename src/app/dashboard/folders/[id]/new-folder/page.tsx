import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../../supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FolderPlus } from "lucide-react";
import CreateForm from "@/components/create-form";
import { createFolder } from "@/app/actions/folder-actions";

export default async function NewSubfolderPage({
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

  // Fetch parent folder details
  const { data: parentFolder } = await supabase
    .from("folders")
    .select("*, projects(id, name)")
    .eq("id", params.id)
    .single();

  if (!parentFolder) {
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
            <h1 className="text-3xl font-bold">Create New Subfolder</h1>
            <p className="text-gray-500 mt-2">
              Create a subfolder inside{" "}
              <span className="font-medium">{parentFolder.name}</span>
            </p>
          </header>

          {/* Folder Form */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <CreateForm
              formAction={createFolder}
              submitButtonText="Create Subfolder"
              pendingButtonText="Creating..."
              successMessage="Subfolder created successfully"
              redirectPath={`/dashboard/folders/${params.id}`}
            >
              <div className="space-y-6">
                <input
                  type="hidden"
                  name="project_id"
                  value={parentFolder.project_id}
                />
                <input
                  type="hidden"
                  name="parent_folder_id"
                  value={params.id}
                />

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Folder Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter folder name"
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
                    placeholder="Enter folder description"
                    rows={4}
                  />
                </div>
              </div>
            </CreateForm>
          </div>
        </div>
      </main>
    </>
  );
}
