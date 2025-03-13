import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../../supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search, Database, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import DeleteForm from "@/components/delete-form";
import { deleteExtractionField } from "@/app/actions/extraction-field-actions";
import EditExtractionFieldDialog from "@/components/edit-extraction-field-dialog";
import InlineExtractionFieldForm from "@/components/inline-extraction-field-form";

export default async function ExtractionFieldsPage({
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

  // Fetch project details
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!project) {
    return redirect("/dashboard/projects");
  }

  // Fetch extraction fields for this project
  const { data: extractionFields } = await supabase
    .from("extraction_fields")
    .select("*")
    .eq("project_id", params.id)
    .order("name");

  // Fetch folders in this project for selection
  const { data: folders } = await supabase
    .from("folders")
    .select("id, name")
    .eq("project_id", params.id)
    .order("name");

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Extraction Fields</h1>
              <p className="text-gray-500 mt-1">Project: {project.name}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search fields..."
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button asChild>
                <Link href={`/dashboard/projects/${params.id}/fields/new`}>
                  <Plus className="mr-2 h-4 w-4" /> New Field
                </Link>
              </Button>
            </div>
          </header>

          {/* Inline Field Creation Form */}
          <div className="bg-white rounded-xl p-6 border shadow-sm mb-8 max-h-[70vh] overflow-hidden">
            <InlineExtractionFieldForm
              projectId={params.id}
              folders={folders || []}
            />
          </div>

          {/* Fields List */}
          <h2 className="text-xl font-semibold mb-4">Existing Fields</h2>
          {!extractionFields || extractionFields.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
              <Database size={64} className="text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                No Extraction Fields Yet
              </h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Create your first extraction field using the form above to start
                extracting data from your documents.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {extractionFields.map((field) => (
                <div
                  key={field.id}
                  className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 text-blue-500 mr-2" />
                      <h3 className="font-semibold text-lg">{field.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <EditExtractionFieldDialog field={field} size="sm" />
                      <DeleteForm
                        itemName={field.name}
                        itemType="field"
                        size="sm"
                        formAction={deleteExtractionField}
                        itemId={field.id}
                      />
                    </div>
                  </div>

                  <div className="flex items-center mt-1 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {field.data_type}
                    </span>
                  </div>

                  {field.description && (
                    <p className="text-sm text-gray-500 mt-2">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
