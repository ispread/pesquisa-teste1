import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/server";
import { FileText, Search, Upload, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import DocumentsTable from "./documents-table";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*, projects(name)")
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h1 className="text-3xl font-bold">Documents</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button asChild>
                <Link href="/dashboard/documents/multi-upload">
                  <Upload className="mr-2 h-4 w-4" /> Upload Documents
                </Link>
              </Button>
            </div>
          </header>

          {/* Documents List */}
          {!documents || documents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
              <FileText size={64} className="text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Documents Yet</h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Upload your first document to start extracting valuable data.
              </p>
              <Button asChild size="lg">
                <Link href="/dashboard/documents/multi-upload">
                  <Upload className="mr-2 h-5 w-5" /> Upload Your First Document
                </Link>
              </Button>
            </div>
          ) : (
            <DocumentsTable documents={documents} />
          )}
        </div>
      </main>
    </>
  );
}
