import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  FolderKanban,
  Database,
  BrainCircuit,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Document Management & Data Extraction
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform helps you organize, manage, and extract valuable data
              from your documents with AI-powered analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FolderKanban className="w-6 h-6" />,
                title: "Organized Structure",
                description:
                  "Hierarchical projects and folders for intuitive document management",
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Multiple Formats",
                description: "Support for PDF, Word, CSV, Excel and more",
              },
              {
                icon: <BrainCircuit className="w-6 h-6" />,
                title: "AI Data Extraction",
                description:
                  "Extract specific data fields using advanced AI analysis",
              },
              {
                icon: <Database className="w-6 h-6" />,
                title: "Secure Storage",
                description:
                  "Enterprise-grade security for all your sensitive documents",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform simplifies document management and data extraction in
              just a few steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mb-4 font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
              <p className="text-gray-600">
                Upload your documents and organize them into projects and
                folders
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mb-4 font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Define Extraction Fields
              </h3>
              <p className="text-gray-600">
                Specify what data you need to extract from your documents
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mb-4 font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Extract & Use Data</h3>
              <p className="text-gray-600">
                Our AI analyzes your documents and extracts the specified data
                fields
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Documents Processed Daily</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Data Extraction Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Happy Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your document management needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Organize Your Documents?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Start extracting valuable data from your documents today.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
