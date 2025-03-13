"use server";

import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import { estimateDocumentTokens } from "@/utils/token-counter";

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const projectId = formData.get("project_id") as string;
  const file = formData.get("file") as File;
  const folderId = (formData.get("folder_id") as string) || null;

  if (!name || !projectId || !file) {
    return { error: "Missing required fields" };
  }

  try {
    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // First insert document without token_count to avoid schema cache issues
    const { data, error: dbError } = await supabase
      .from("documents")
      .insert({
        name,
        description,
        project_id: projectId,
        folder_id: folderId,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        user_id: user.id,
      })
      .select()
      .single();

    // Then update token count in a separate operation
    if (data && !dbError) {
      // Estimate token count
      const tokenCount = estimateDocumentTokens(file.type, file.size);

      await supabase
        .from("documents")
        .update({
          token_count: tokenCount || 0,
          token_usage: 0,
        })
        .eq("id", data.id);
    }

    if (dbError) throw dbError;

    return redirect(`/dashboard/documents/${data.id}`);
  } catch (error: any) {
    return { error: error.message || "Failed to upload document" };
  }
}

export async function updateDocument(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const documentId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!documentId || !name) {
    return { error: "Document ID and name are required" };
  }

  try {
    const { error } = await supabase
      .from("documents")
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (error) throw error;

    return redirect(`/dashboard/documents/${documentId}`);
  } catch (error: any) {
    return { error: error.message || "Failed to update document" };
  }
}

export async function deleteDocument(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const documentId = formData.get("id")?.toString();

  if (!documentId) {
    return { error: "Document ID is required" };
  }

  try {
    // Get document details to find the file path
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) throw fetchError;

    // Delete extraction results associated with this document
    const { error: extractionError } = await supabase
      .from("extraction_results")
      .delete()
      .eq("document_id", documentId);

    if (extractionError) throw extractionError;

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([document.file_path]);

    if (storageError) throw storageError;

    // Delete the document record
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (dbError) throw dbError;

    // Redirect to folder or documents page
    if (document.folder_id) {
      return redirect(`/dashboard/folders/${document.folder_id}`);
    } else {
      return redirect(`/dashboard/projects/${document.project_id}`);
    }
  } catch (error: any) {
    return { error: error.message || "Failed to delete document" };
  }
}
