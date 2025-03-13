"use client";

import { createClient } from "../../../../../supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, UploadCloud, X, File } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

// Server component to fetch projects
export async function getProjects() {
  const supabase = createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("name");
  return projects || [];
}

export default function UploadDocumentPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    project_id: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch projects when component mounts
    const fetchProjects = async () => {
      const supabase = createClient();
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("name");

      if (!projects || projects.length === 0) {
        router.push("/dashboard/projects/new?message=create-project-first");
        return;
      }

      setProjects(projects);
    };

    fetchProjects();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, project_id: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Check file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, CSV, or XLSX file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size should not exceed 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Set file and update document name if not already set
    setFile(selectedFile);
    if (!formData.name) {
      setFormData((prev) => ({ ...prev, name: selectedFile.name }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.project_id || !file) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and upload a file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record in database
      const { data: docData, error: dbError } = await supabase
        .from("documents")
        .insert({
          name: formData.name,
          description: formData.description,
          project_id: formData.project_id,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          user_id: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
      });

      // Redirect to document page if we have the ID, otherwise to documents list
      if (docData?.id) {
        router.push(`/dashboard/documents/${docData.id}`);
      } else {
        router.push("/dashboard/documents");
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description:
          error.message || "An error occurred while uploading the document.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Upload Document</h1>
            <p className="text-gray-500 mt-2">
              Upload a document to extract data from it
            </p>
          </header>

          {/* Upload Form */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Document Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter document name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project" className="text-sm font-medium">
                  Project <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.project_id}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter document description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Document File <span className="text-red-500">*</span>
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"} ${file ? "bg-gray-50" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={file ? undefined : handleBrowseClick}
                >
                  {!file ? (
                    <>
                      <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-400">
                          Supported formats: PDF, DOCX, CSV, XLSX (Max 10MB)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={handleBrowseClick}
                        >
                          <Upload className="mr-2 h-4 w-4" /> Select File
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                      <div className="flex items-center">
                        <File className="h-8 w-8 text-blue-500 mr-3" />
                        <div className="text-left">
                          <p className="font-medium truncate max-w-xs">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.csv,.xlsx"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-4">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/documents">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" /> Upload Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
