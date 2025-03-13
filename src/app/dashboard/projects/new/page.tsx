import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import CreateForm from "@/components/create-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/app/actions/project-actions";

export default async function NewProjectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Create New Project</h1>
            <p className="text-gray-500 mt-2">
              Projects help you organize your documents and extraction fields
            </p>
          </header>

          {/* Project Form */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <CreateForm
              formAction={createProject}
              submitButtonText="Create Project"
              pendingButtonText="Creating..."
              successMessage="Project created successfully"
              redirectPath="/dashboard/projects"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter project name"
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
                    placeholder="Enter project description"
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
