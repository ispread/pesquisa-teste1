import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../../../supabase/server";
import { redirect } from "next/navigation";
import CreateForm from "@/components/create-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createExtractionField } from "@/app/actions/extraction-field-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function NewExtractionFieldPage({
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

  // Fetch folders in this project for selection
  const { data: folders } = await supabase
    .from("folders")
    .select("id, name, parent_folder_id")
    .eq("project_id", params.id)
    .order("name");

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Create Extraction Field</h1>
            <p className="text-gray-500 mt-2">
              Define a field to extract from your documents in project:{" "}
              {project.name}
            </p>
          </header>

          {/* Field Form */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <CreateForm
              formAction={createExtractionField}
              submitButtonText="Create Field"
              pendingButtonText="Creating..."
              successMessage="Extraction field created successfully"
              redirectPath={`/dashboard/projects/${params.id}/fields`}
            >
              <div className="space-y-6">
                <input type="hidden" name="project_id" value={params.id} />

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Field Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter field name (e.g. Invoice Number, Date, Total Amount)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="data_type" className="text-sm font-medium">
                    Data Type <span className="text-red-500">*</span>
                  </label>
                  <Select name="data_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter field description (e.g. The invoice number located at the top right)"
                    rows={3}
                  />
                </div>

                {folders && folders.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Apply to Folders
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Select folders where this extraction field should be
                      applied. If none are selected, it will apply to all
                      documents in the project.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                      {folders.map((folder) => (
                        <div
                          key={folder.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`folder-${folder.id}`}
                            name="folder_ids"
                            value={folder.id}
                            className="rounded border-gray-300"
                          />
                          <label
                            htmlFor={`folder-${folder.id}`}
                            className="text-sm"
                          >
                            {folder.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CreateForm>
          </div>
        </div>
      </main>
    </>
  );
}
