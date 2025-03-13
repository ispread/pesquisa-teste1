"use client";

import { useState } from "react";
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
import { toast } from "@/components/ui/use-toast";
import { createClient } from "../../supabase/client";
import { useRouter } from "next/navigation";
import FileUpload, { UploadedFile } from "./file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CheckCircle, ArrowRight, Loader2, Zap } from "lucide-react";
import TokenCounter from "@/components/token-counter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Project {
  id: string;
  name: string;
}

export default function MultiDocumentUpload({
  projects,
}: {
  projects: Project[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    [key: string]: { name: string; description: string; project_id: string };
  }>({});

  const handleUploadComplete = (files: UploadedFile[]) => {
    setUploadedFiles(files);

    // Initialize form data for each file
    const initialFormData: { [key: string]: any } = {};
    files.forEach((file) => {
      initialFormData[file.id] = {
        name: file.name,
        description: "",
        project_id: projects.length > 0 ? projects[0].id : "",
      };
    });

    setFormData(initialFormData);
    setActiveTab("details");
  };

  const handleInputChange = (fileId: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value,
      },
    }));
  };

  const handleSelectChange = (fileId: string, value: string) => {
    handleInputChange(fileId, "project_id", value);
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to save",
        description: "Please upload at least one file first.",
        variant: "destructive",
      });
      return;
    }

    // Validate all files have required fields
    const invalidFiles = uploadedFiles.filter(
      (file) => !formData[file.id]?.name || !formData[file.id]?.project_id,
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "Missing information",
        description: `Please provide name and project for all files.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create document records for each file
      const promises = uploadedFiles.map(async (file) => {
        const fileData = formData[file.id];

        // Estimate token count for the file
        const tokenCount = Math.round(file.size / 4); // Simple estimation

        // Create document without token_count first to avoid schema cache issues
        const { data, error } = await supabase
          .from("documents")
          .insert({
            name: fileData.name,
            description: fileData.description,
            project_id: fileData.project_id,
            file_path: file.path,
            file_type: file.type,
            file_size: file.size,
            user_id: user.id,
          })
          .select()
          .single();

        // Then update the token_count separately if needed
        if (data && !error) {
          await supabase
            .from("documents")
            .update({
              token_count: tokenCount || 0,
              token_usage: 0,
            })
            .eq("id", data.id);
        }

        if (error) throw error;
        return data;
      });

      const results = await Promise.all(promises);

      toast({
        title: "Documents saved",
        description: `Successfully saved ${results.length} document(s).`,
      });

      // Reset state
      setUploadedFiles([]);
      setFormData({});
      setActiveTab("upload");

      // Refresh the documents list
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error saving documents",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" disabled={isSubmitting}>
            1. Upload Files
          </TabsTrigger>
          <TabsTrigger
            value="details"
            disabled={uploadedFiles.length === 0 || isSubmitting}
          >
            2. Document Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload multiple documents at once. You can drag and drop files
                or browse to select them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>
                Provide information for each uploaded document.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center mb-4">
                      <FileText className="h-6 w-6 text-blue-500 mr-2" />
                      <h3 className="font-medium">{file.name}</h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${file.id}`}>
                          Document Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`name-${file.id}`}
                          value={formData[file.id]?.name || ""}
                          onChange={(e) =>
                            handleInputChange(file.id, "name", e.target.value)
                          }
                          placeholder="Enter document name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`project-${file.id}`}>
                          Project <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData[file.id]?.project_id || ""}
                          onValueChange={(value) =>
                            handleSelectChange(file.id, value)
                          }
                        >
                          <SelectTrigger id={`project-${file.id}`}>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`description-${file.id}`}>
                          Description
                        </Label>
                        <Textarea
                          id={`description-${file.id}`}
                          value={formData[file.id]?.description || ""}
                          onChange={(e) =>
                            handleInputChange(
                              file.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Enter document description"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2 mt-2">
                        <div className="flex items-center mb-1">
                          <Zap className="h-4 w-4 text-blue-600 mr-1" />
                          <Label className="text-sm">Token Estimate</Label>
                        </div>
                        <TokenCounter
                          fileType={file.type}
                          fileSize={file.size}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveTab("upload")}
                disabled={isSubmitting}
              >
                Back to Upload
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save All Documents
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
