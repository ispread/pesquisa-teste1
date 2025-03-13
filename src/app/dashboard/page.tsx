import { createClient } from "../../../supabase/server";
import DashboardNavbar from "@/components/dashboard-navbar";
import {
  FolderPlus,
  FileText,
  Plus,
  BarChart3,
  ArrowUpTrendingIcon,
  Layers,
  Database,
} from "lucide-react";
import StorageUsageCard from "@/components/storage-usage-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Dashboard() {
  const supabase = await createClient();

  // Fetch user's projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch recent documents
  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch user profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Fetch subscription data
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user?.id)
    .eq("status", "active")
    .maybeSingle();

  // Calculate stats
  const projectCount = projects?.length || 0;
  const documentCount = recentDocuments?.length || 0;

  // Get current date for greeting
  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon";
  } else if (currentHour >= 18) {
    greeting = "Good evening";
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section with Greeting */}
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {greeting},{" "}
                {profile?.full_name || user?.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-gray-500 mt-1">
                Here's an overview of your document management
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/dashboard/projects/new">
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Link>
              </Button>
            </div>
          </header>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projects
                </CardTitle>
                <FolderPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectCount}</div>
                <p className="text-xs text-muted-foreground">
                  Across all workspaces
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentCount}</div>
                <p className="text-xs text-muted-foreground">
                  Total uploaded documents
                </p>
              </CardContent>
            </Card>
            <StorageUsageCard subscription={subscription} />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Extractions
                </CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Data points extracted
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Message for New Users */}
          {(!projects || projects.length === 0) && (
            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
              <FileText size={64} className="text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                Welcome to DocExtract
              </h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Start organizing your documents and extracting valuable data.
                Create your first project to get started.
              </p>
              <Button asChild size="lg">
                <Link href="/dashboard/projects/new">
                  <FolderPlus className="mr-2 h-5 w-5" /> Create Your First
                  Project
                </Link>
              </Button>
            </div>
          )}

          {/* Projects Section */}
          {projects && projects.length > 0 && (
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Projects</h2>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/projects">View All</Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.slice(0, 3).map((project) => (
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    key={project.id}
                    className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-lg mb-2">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {project.description || "No description"}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-400">
                        Created:{" "}
                        {new Date(project.created_at).toLocaleDateString(
                          "en-US",
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent Documents Section */}
          {recentDocuments && recentDocuments.length > 0 && (
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Recent Documents</h2>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/documents">View All</Link>
                </Button>
              </div>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900">
                              {doc.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.file_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(doc.file_size / 1024).toFixed(2)} KB
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString("en-US")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                asChild
                variant="outline"
                className="h-auto py-6 flex flex-col items-center justify-center gap-2"
              >
                <Link href="/dashboard/projects/new">
                  <FolderPlus className="h-8 w-8 mb-2" />
                  <span className="text-base font-medium">New Project</span>
                  <span className="text-xs text-muted-foreground">
                    Create a new project workspace
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto py-6 flex flex-col items-center justify-center gap-2"
              >
                <Link href="/dashboard/documents/multi-upload">
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="text-base font-medium">
                    Upload Documents
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Add multiple documents to extract data
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto py-6 flex flex-col items-center justify-center gap-2"
              >
                <Link href="/dashboard/settings">
                  <Database className="h-8 w-8 mb-2" />
                  <span className="text-base font-medium">Manage Account</span>
                  <span className="text-xs text-muted-foreground">
                    Update your profile and settings
                  </span>
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
