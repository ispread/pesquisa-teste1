import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FolderPlus,
  Upload,
  ArrowLeft,
  MoreHorizontal,
  FolderOpen,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeleteForm from "@/components/delete-form";
import EditFolderDialog from "@/components/edit-folder-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteFolder } from "@/app/actions/folder-actions";
import FolderExtractionForm from "@/components/folder-extraction-form";

export default async function FolderDetailPage({
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
  const { data: folder, error } = await supabase
    .from("folders")
    .select("*, projects(name)")
    .eq("id", params.id)
    .single();

  if (error || !folder) {
    return redirect("/dashboard/projects");
  }

  // Fetch subfolders in this folder
  const { data: subfolders } = await supabase
    .from("folders")
    .select("*")
    .eq("parent_folder_id", params.id)
    .order("name");

  // Fetch documents in this folder
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("folder_id", params.id)
    .order("created_at", { ascending: false });

  // Fetch extraction results for documents in this folder
  const { data: extractionResults } = await supabase
    .from("extraction_results")
    .select("*, extraction_fields(name, data_type)")
    .in("document_id", documents?.map((doc) => doc.id) || []);

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
                  <Link href={`/dashboard/projects/${folder.project_id}`}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Project
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{folder.name}</h1>
                <div className="flex gap-2">
                  <EditFolderDialog folder={folder} size="sm" />
                  <DeleteForm
                    itemName={folder.name}
                    itemType="folder"
                    size="sm"
                    formAction={deleteFolder}
                    itemId={params.id}
                  />
                </div>
              </div>
              {folder.description && (
                <p className="text-gray-500 mt-1">{folder.description}</p>
              )}
              <p className="text-gray-500 mt-1">
                Project:{" "}
                <Link
                  href={`/dashboard/projects/${folder.project_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {folder.projects?.name}
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/folders/${params.id}/new-folder`}>
                  <FolderPlus className="mr-2 h-4 w-4" /> New Subfolder
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/folders/${params.id}/upload`}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Document
                </Link>
              </Button>
            </div>
          </header>

          {/* Folder Content */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="content">Folder Contents</TabsTrigger>
              <TabsTrigger value="extraction">Data Extraction</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              {/* Subfolders Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Subfolders</h2>
                {!subfolders || subfolders.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
                    <p className="text-gray-500">
                      No subfolders yet. Create a subfolder to further organize
                      your documents.
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/dashboard/folders/${params.id}/new-folder`}>
                        <FolderPlus className="mr-2 h-4 w-4" /> Create Subfolder
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subfolders.map((subfolder) => (
                      <div
                        key={subfolder.id}
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
                                  href={`/dashboard/folders/${subfolder.id}`}
                                >
                                  View Folder
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <EditFolderDialog
                                  folder={subfolder}
                                  variant="ghost"
                                  className="w-full justify-start p-0 h-auto font-normal"
                                />
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <DeleteForm
                                  itemName={subfolder.name}
                                  itemType="folder"
                                  variant="ghost"
                                  className="w-full justify-start p-0 h-auto font-normal"
                                  formAction={deleteFolder}
                                  itemId={subfolder.id}
                                />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <Link
                          href={`/dashboard/folders/${subfolder.id}`}
                          className="flex items-center"
                        >
                          <FolderOpen className="h-10 w-10 text-blue-500 mr-4" />
                          <div>
                            <h3 className="font-semibold">{subfolder.name}</h3>
                            {subfolder.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {subfolder.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Documents Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Documents</h2>
                {!documents || documents.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
                    <p className="text-gray-500">
                      No documents in this folder yet. Upload a document to get
                      started.
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/dashboard/folders/${params.id}/upload`}>
                        <Upload className="mr-2 h-4 w-4" /> Upload Document
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50">
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
                              {doc.file_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(doc.file_size / 1024).toFixed(2)} KB
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString(
                                "en-US",
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {doc.last_analyzed_at
                                ? new Date(
                                    doc.last_analyzed_at,
                                  ).toLocaleDateString()
                                : "Never"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="extraction" className="space-y-6">
              <FolderExtractionForm
                folderId={params.id}
                folderName={folder.name}
                projectId={folder.project_id}
                documents={documents || []}
                existingResults={extractionResults || []}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
