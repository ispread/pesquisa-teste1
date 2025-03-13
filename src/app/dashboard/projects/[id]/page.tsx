import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../supabase/server";
import {
  FileText,
  FolderPlus,
  Upload,
  Plus,
  Database,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeleteForm from "@/components/delete-form";
import EditFolderDialog from "@/components/edit-folder-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProjectDocumentsTable from "./documents-table";
import { deleteProject } from "@/app/actions/project-actions";
import { deleteFolder } from "@/app/actions/folder-actions";
import { deleteExtractionField } from "@/app/actions/extraction-field-actions";
import EditExtractionFieldDialog from "@/components/edit-extraction-field-dialog";
import EditProjectDialog from "@/components/edit-project-dialog";
import AddFieldsDialog from "@/components/add-fields-dialog";
import AddFieldsButton from "@/components/add-fields-button";
import CreateExtractionFieldButton from "@/components/create-extraction-field-button";

export default async function ProjectDetailPage({
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

  // Fetch folders in this project
  const { data: folders } = await supabase
    .from("folders")
    .select("*")
    .eq("project_id", params.id)
    .is("parent_folder_id", null)
    .order("name");

  // Fetch documents in this project (not in any folder)
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", params.id)
    .is("folder_id", null)
    .order("created_at", { ascending: false });

  // Fetch extraction fields for this project
  const { data: extractionFields } = await supabase
    .from("extraction_fields")
    .select("*")
    .eq("project_id", params.id)
    .order("name");

  // We'll use a form element with action instead of FormData

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <div className="flex gap-2">
                  <EditProjectDialog project={project} size="sm" />
                  <DeleteForm
                    itemName={project.name}
                    itemType="project"
                    size="sm"
                    formAction={deleteProject}
                    itemId={params.id}
                  />
                </div>
              </div>
              {project.description && (
                <p className="text-gray-500 mt-1">{project.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/projects/${params.id}/folders/new`}>
                  <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/documents/multi-upload">
                  <Upload className="mr-2 h-4 w-4" /> Upload Documents
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/projects/${params.id}/fields/new`}>
                  <Plus className="mr-2 h-4 w-4" /> New Extraction Field
                </Link>
              </Button>
            </div>
          </header>

          {/* Project Content */}
          <AddFieldsDialog projectId={params.id} />
          <div className="hidden">Add Fields</div>
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="documents">Documents & Folders</TabsTrigger>
              <TabsTrigger value="extraction-fields">
                Extraction Fields
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              {/* Folders Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Folders</h2>
                {!folders || folders.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
                    <p className="text-gray-500">
                      No folders yet. Create a folder to organize your
                      documents.
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link
                        href={`/dashboard/projects/${params.id}/folders/new`}
                      >
                        <FolderPlus className="mr-2 h-4 w-4" /> Create Folder
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {folders.map((folder) => {
                      // Use form element with data attribute instead of FormData

                      return (
                        <div
                          key={folder.id}
                          className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow group relative"
                        >
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/folders/${folder.id}`}
                                  >
                                    View Folder
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <EditFolderDialog
                                    folder={folder}
                                    variant="ghost"
                                    className="w-full justify-start p-0 h-auto font-normal"
                                  />
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <DeleteForm
                                    itemName={folder.name}
                                    itemType="folder"
                                    variant="ghost"
                                    className="w-full justify-start p-0 h-auto font-normal"
                                    formAction={deleteFolder}
                                    itemId={folder.id}
                                  />
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <Link
                            href={`/dashboard/folders/${folder.id}`}
                            className="flex items-center"
                          >
                            <FolderPlus className="h-10 w-10 text-blue-500 mr-4" />
                            <div>
                              <h3 className="font-semibold">{folder.name}</h3>
                              {folder.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {folder.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Documents Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Documents</h2>
                {!documents || documents.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
                    <p className="text-gray-500">
                      No documents yet. Upload a document to get started.
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/dashboard/projects/${params.id}/upload`}>
                        <Upload className="mr-2 h-4 w-4" /> Upload Document
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <ProjectDocumentsTable documents={documents} />
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="extraction-fields" className="space-y-6">
              {/* Extraction Fields Section */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Extraction Fields</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/projects/${params.id}/fields`}>
                        Manage Fields
                      </Link>
                    </Button>
                    <AddFieldsButton />
                  </div>
                </div>
                {!extractionFields || extractionFields.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
                    <p className="text-gray-500">
                      No extraction fields defined yet. Create a field to
                      extract data from your documents.
                    </p>
                    <CreateExtractionFieldButton />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {extractionFields.slice(0, 3).map((field) => (
                      <div
                        key={field.id}
                        className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow group relative"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">
                            {field.name}
                          </h3>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <EditExtractionFieldDialog
                              field={field}
                              size="sm"
                            />
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
                          <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                            {field.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
