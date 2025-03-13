import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/server";
import { FolderPlus, Search, Plus, MoreHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import EditProjectDialog from "@/components/edit-project-dialog";
import DeleteForm from "@/components/delete-form";
import { deleteProject } from "@/app/actions/project-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h1 className="text-3xl font-bold">Projects</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button asChild>
                <Link href="/dashboard/projects/new">
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Link>
              </Button>
            </div>
          </header>

          {/* Projects Grid */}
          {!projects || projects.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
              <FolderPlus size={64} className="text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Projects Yet</h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Create your first project to start organizing documents and
                extracting data.
              </p>
              <Button asChild size="lg">
                <Link href="/dashboard/projects/new">
                  <FolderPlus className="mr-2 h-5 w-5" /> Create Your First
                  Project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                // Use form element with data attribute instead of FormData

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow group relative"
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
                            <Link href={`/dashboard/projects/${project.id}`}>
                              View Project
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <EditProjectDialog
                              project={project}
                              variant="ghost"
                              className="w-full justify-start p-0 h-auto font-normal"
                            />
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <DeleteForm
                              itemName={project.name}
                              itemType="project"
                              variant="ghost"
                              className="w-full justify-start p-0 h-auto font-normal"
                              formAction={deleteProject}
                              itemId={project.id}
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Link href={`/dashboard/projects/${project.id}`}>
                      <h3 className="font-semibold text-lg mb-2">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {project.description || "No description"}
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-gray-400">
                          Created:{" "}
                          {new Date(project.created_at).toLocaleDateString(
                            "en-US",
                          )}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Project
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
