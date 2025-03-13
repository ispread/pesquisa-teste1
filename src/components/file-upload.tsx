"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "../../supabase/client";
import {
  UploadCloud,
  X,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedFileTypes?: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  url?: string;
}

export default function FileUpload({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10, // 10MB default
  acceptedFileTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles);
    }
  };

  const validateAndAddFiles = (selectedFiles: File[]) => {
    // Check if adding these files would exceed the max files limit
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} files at once.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    const invalidFiles: { name: string; reason: string }[] = [];

    selectedFiles.forEach((file) => {
      // Check file type
      if (!acceptedFileTypes.includes(file.type)) {
        invalidFiles.push({
          name: file.name,
          reason: "Invalid file type",
        });
        return;
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        invalidFiles.push({
          name: file.name,
          reason: `File size exceeds ${maxSize}MB limit`,
        });
        return;
      }

      // Check for duplicate files
      if (files.some((existingFile) => existingFile.name === file.name)) {
        invalidFiles.push({
          name: file.name,
          reason: "File already added",
        });
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      toast({
        title: `${invalidFiles.length} file(s) couldn't be added`,
        description: (
          <ul className="list-disc pl-4 mt-2 text-sm">
            {invalidFiles.map((file, index) => (
              <li key={index}>
                {file.name}: {file.reason}
              </li>
            ))}
          </ul>
        ),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        validateAndAddFiles(Array.from(e.dataTransfer.files));
      }
    },
    [files.length],
  );

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const supabase = createClient();

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const uploadedFilesArray: UploadedFile[] = [];

      // Initialize progress for all files
      const initialProgress: { [key: string]: number } = {};
      files.forEach((file) => {
        initialProgress[file.name] = 0;
      });
      setUploadProgress(initialProgress);

      // Upload files one by one
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Create upload client with progress tracking
        const { data, error } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        // Manually update progress to 100% since onUploadProgress may not work reliably
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: 100,
        }));

        if (error) throw error;

        // Get URL for the file
        const { data: urlData } = await supabase.storage
          .from("documents")
          .createSignedUrl(filePath, 60 * 60); // 1 hour expiration

        uploadedFilesArray.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          url: urlData?.signedUrl,
        });
      }

      setUploadedFiles(uploadedFilesArray);
      onUploadComplete(uploadedFilesArray);

      // Clear the files list after successful upload
      setFiles([]);
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${uploadedFilesArray.length} file(s).`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={files.length === 0 ? handleBrowseClick : undefined}
      >
        {files.length === 0 ? (
          <div className="text-center">
            <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Drag and drop your files here, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: PDF, DOCX, CSV, XLSX (Max {maxSize}MB per
                file, up to {maxFiles} files)
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                onClick={handleBrowseClick}
              >
                <UploadCloud className="mr-2 h-4 w-4" /> Select Files
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBrowseClick}
              >
                Add More Files
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border group hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center overflow-hidden">
                    <File className="h-8 w-8 text-blue-500 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  {uploading ? (
                    <div className="w-24 flex-shrink-0">
                      <Progress
                        value={uploadProgress[file.name] || 0}
                        className="h-2"
                      />
                      <p className="text-xs text-right mt-1">
                        {uploadProgress[file.name] || 0}%
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={uploadFiles}
                disabled={uploading}
                className="mt-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload {files.length} file{files.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-medium text-gray-700 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Uploaded Files
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-100 bg-green-50"
              >
                <div className="flex items-center overflow-hidden">
                  <File className="h-8 w-8 text-green-500 mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.csv,.xlsx"
        multiple
        onChange={handleFileChange}
      />
    </div>
  );
}
