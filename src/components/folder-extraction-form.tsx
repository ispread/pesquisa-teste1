"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "../../supabase/client";
import { useRouter } from "next/navigation";
import {
  Database,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Tag,
  FolderOpen,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface ExtractionField {
  id: string;
  name: string;
  data_type: string;
  description: string | null;
  folder_ids?: string[];
}

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  project_id: string;
  folder_id: string | null;
  last_analyzed_at: string | null;
}

interface ExtractionResult {
  id: string;
  document_id: string;
  extraction_field_id: string;
  extracted_value: string | null;
  confidence_score: number | null;
  extracted_at: string;
  extraction_fields?: {
    name: string;
    data_type: string;
  };
}

interface FolderExtractionFormProps {
  folderId: string;
  folderName: string;
  projectId: string;
  documents: Document[];
  existingResults?: ExtractionResult[];
}

export default function FolderExtractionForm({
  folderId,
  folderName,
  projectId,
  documents,
  existingResults = [],
}: FolderExtractionFormProps) {
  const [activeTab, setActiveTab] = useState(
    existingResults.length > 0 ? "results" : "extract",
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [extractionFields, setExtractionFields] = useState<ExtractionField[]>(
    [],
  );
  const [extractionResults, setExtractionResults] =
    useState<ExtractionResult[]>(existingResults);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchExtractionFields = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // First, get all extraction fields for this project
        const { data: allFields, error: fieldsError } = await supabase
          .from("extraction_fields")
          .select("*")
          .eq("project_id", projectId)
          .order("name");

        if (fieldsError) throw fieldsError;

        if (!allFields || allFields.length === 0) {
          setExtractionFields([]);
          setIsLoading(false);
          return;
        }

        // Then, get folder associations for these fields
        const { data: fieldFolders, error: foldersError } = await supabase
          .from("extraction_field_folders")
          .select("extraction_field_id, folder_id")
          .in(
            "extraction_field_id",
            allFields.map((field) => field.id),
          );

        if (foldersError) throw foldersError;

        // Create a map of field IDs to their associated folder IDs
        const fieldToFolders = new Map<string, string[]>();
        fieldFolders?.forEach((item) => {
          const folders = fieldToFolders.get(item.extraction_field_id) || [];
          folders.push(item.folder_id);
          fieldToFolders.set(item.extraction_field_id, folders);
        });

        // Filter fields based on folder associations
        // A field is applicable if:
        // 1. It has no folder associations (applies to all folders)
        // 2. It is explicitly associated with this folder
        const applicableFields = allFields.filter((field) => {
          const associatedFolders = fieldToFolders.get(field.id) || [];
          return (
            associatedFolders.length === 0 ||
            associatedFolders.includes(folderId)
          );
        });

        // Add folder_ids to each field
        const fieldsWithFolders = applicableFields.map((field) => ({
          ...field,
          folder_ids: fieldToFolders.get(field.id) || [],
        }));

        setExtractionFields(fieldsWithFolders);
      } catch (error) {
        console.error("Error fetching extraction fields:", error);
        toast({
          title: "Error",
          description: "Failed to load extraction fields",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtractionFields();
  }, [projectId, folderId]);

  const toggleFieldSelection = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId],
    );
  };

  const selectAllFields = () => {
    if (selectedFields.length === extractionFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(extractionFields.map((field) => field.id));
    }
  };

  const handleExtract = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field to extract.",
        variant: "destructive",
      });
      return;
    }

    if (documents.length === 0) {
      toast({
        title: "No documents",
        description: "This folder doesn't contain any documents to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    setProgress(0);
    const supabase = createClient();

    try {
      // Process each document in the folder
      const allResults = [];
      const totalDocuments = documents.length;
      let processedDocuments = 0;

      for (const document of documents) {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 5;
          });
        }, 500);

        // Call the analyze-document edge function for each document
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-analyze-document",
          {
            body: {
              documentId: document.id,
              extractionFieldIds: selectedFields,
            },
          },
        );

        clearInterval(progressInterval);

        if (error) {
          console.error(`Error analyzing document ${document.name}:`, error);
          continue; // Continue with next document even if this one fails
        }

        if (data?.results) {
          allResults.push(...data.results);
        }

        // Update progress based on completed documents
        processedDocuments++;
        setProgress((processedDocuments / totalDocuments) * 100);
      }

      // Set final progress to 100%
      setProgress(100);

      // Update the extraction results
      setExtractionResults(allResults);
      setActiveTab("results");

      toast({
        title: "Extraction complete",
        description: `Successfully extracted ${allResults.length} field(s) from ${documents.length} document(s).`,
      });

      // Refresh the page to get the updated documents with last_analyzed_at
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Extraction failed",
        description: error.message || "An error occurred during extraction.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const formatValue = (value: string | null, dataType: string) => {
    if (value === null) return "N/A";

    switch (dataType) {
      case "date":
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      case "boolean":
        return value.toLowerCase() === "true" ? "Yes" : "No";
      default:
        return value;
    }
  };

  const formatConfidence = (score: number | null) => {
    if (score === null) return "N/A";
    return `${Math.round(score * 100)}%`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-blue-500" />
          <CardTitle>Extract Data from Folder: {folderName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="extract" disabled={isExtracting}>
              Extract Data
            </TabsTrigger>
            <TabsTrigger
              value="results"
              disabled={extractionResults.length === 0 || isExtracting}
            >
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading extraction fields...</p>
              </div>
            ) : extractionFields.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Extraction Fields Available
                </h3>
                <p className="text-gray-500 mb-4">
                  You need to create extraction fields in this project before
                  you can extract data from this folder.
                </p>
                <Button asChild>
                  <a href={`/dashboard/projects/${projectId}/fields/new`}>
                    Create Extraction Field
                  </a>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">Select Fields to Extract</h3>
                    <p className="text-sm text-gray-500">
                      {documents.length} document(s) will be analyzed
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllFields}
                    disabled={isExtracting}
                  >
                    {selectedFields.length === extractionFields.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {extractionFields.map((field) => (
                    <div
                      key={field.id}
                      className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${selectedFields.includes(field.id) ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}
                      onClick={() => toggleFieldSelection(field.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.id)}
                          onChange={() => toggleFieldSelection(field.id)}
                          className="mr-3 h-4 w-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium">{field.name}</span>
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {field.data_type}
                            </span>
                            {field.folder_ids &&
                              field.folder_ids.length > 0 && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Folder-specific
                                </span>
                              )}
                          </div>
                          {field.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {field.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {isExtracting ? (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          Extracting data from {documents.length} document(s)...
                        </span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    <div className="flex justify-center">
                      <Button disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Documents
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleExtract}
                    disabled={
                      selectedFields.length === 0 || documents.length === 0
                    }
                    className="w-full mt-6"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Extract Selected Fields from {documents.length} Document
                    {documents.length !== 1 ? "s" : ""}
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4 mt-4">
            {extractionResults.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                <p className="text-gray-500 mb-4">
                  Extract data from documents in this folder to see results
                  here.
                </p>
                <Button onClick={() => setActiveTab("extract")}>
                  Go to Extraction
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="font-medium">
                      {extractionResults.length} Field
                      {extractionResults.length !== 1 ? "s" : ""} Extracted
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    From {documents.length} document
                    {documents.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Extracted Value</TableHead>
                        <TableHead className="text-right">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractionResults.map((result) => {
                        // Find the document this result belongs to
                        const document = documents.find(
                          (doc) => doc.id === result.document_id,
                        );

                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">
                              {result.extraction_fields?.name ||
                                "Unknown Field"}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {result.extraction_fields?.data_type || "text"}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {document?.name || "Unknown Document"}
                            </TableCell>
                            <TableCell>
                              {formatValue(
                                result.extracted_value,
                                result.extraction_fields?.data_type || "text",
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <div
                                  className={`h-2 w-16 rounded-full mr-2 ${result.confidence_score && result.confidence_score > 0.8 ? "bg-green-500" : result.confidence_score && result.confidence_score > 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{
                                    width: result.confidence_score
                                      ? `${result.confidence_score * 100}%`
                                      : "0%",
                                  }}
                                />
                                {formatConfidence(result.confidence_score)}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("extract")}
                  >
                    Extract More Fields
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
