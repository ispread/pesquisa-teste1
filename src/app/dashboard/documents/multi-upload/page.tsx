import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import MultiDocumentUpload from "@/components/multi-document-upload";

export default async function MultiUploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch projects for the select dropdown
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  if (!projects || projects.length === 0) {
    return redirect("/dashboard/projects/new?message=create-project-first");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Multi-Document Upload</h1>
            <p className="text-gray-500 mt-2">
              Upload multiple documents at once and organize them efficiently
            </p>
          </header>

          <MultiDocumentUpload projects={projects} />
        </div>
      </main>
    </>
  );
}
