"use server";

import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";

export async function createExtractionField(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const name = formData.get("name") as string;
  const dataType = formData.get("data_type") as string;
  const description = formData.get("description") as string;
  const projectId = formData.get("project_id") as string;

  // Get selected folder IDs (if any)
  const folderIds = formData.getAll("folder_ids") as string[];

  if (!name || !dataType || !projectId) {
    return { error: "Field name, data type, and project ID are required" };
  }

  try {
    // First create the extraction field
    const { data: field, error } = await supabase
      .from("extraction_fields")
      .insert({
        name,
        data_type: dataType,
        description,
        project_id: projectId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // If folders were selected, create associations
    if (folderIds.length > 0 && field) {
      const folderAssociations = folderIds.map((folderId) => ({
        extraction_field_id: field.id,
        folder_id: folderId,
      }));

      const { error: assocError } = await supabase
        .from("extraction_field_folders")
        .insert(folderAssociations);

      if (assocError) throw assocError;
    }

    // Return a success object instead of redirecting directly
    return { success: true, projectId };
  } catch (error: any) {
    return { error: error.message || "Failed to create extraction field" };
  }
}

export async function updateExtractionField(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const fieldId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const dataType = formData.get("data_type") as string;
  const description = formData.get("description") as string;
  const folderIds = formData.getAll("folder_ids") as string[];

  if (!fieldId || !name || !dataType) {
    return { error: "Field ID, name, and data type are required" };
  }

  try {
    // Get the field to find its project ID
    const { data: existingField, error: fetchError } = await supabase
      .from("extraction_fields")
      .select("project_id")
      .eq("id", fieldId)
      .single();

    if (fetchError) throw fetchError;

    // Update the extraction field
    const { error } = await supabase
      .from("extraction_fields")
      .update({
        name,
        data_type: dataType,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fieldId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Delete existing folder associations
    const { error: deleteError } = await supabase
      .from("extraction_field_folders")
      .delete()
      .eq("extraction_field_id", fieldId);

    if (deleteError) throw deleteError;

    // If folders were selected, create new associations
    if (folderIds.length > 0) {
      const folderAssociations = folderIds.map((folderId) => ({
        extraction_field_id: fieldId,
        folder_id: folderId,
      }));

      const { error: assocError } = await supabase
        .from("extraction_field_folders")
        .insert(folderAssociations);

      if (assocError) throw assocError;
    }

    return redirect(`/dashboard/projects/${existingField.project_id}`);
  } catch (error: any) {
    return { error: error.message || "Failed to update extraction field" };
  }
}

export async function deleteExtractionField(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const fieldId = formData.get("id")?.toString();

  if (!fieldId) {
    return { error: "Field ID is required" };
  }

  try {
    // Get the field to find its project ID
    const { data: field, error: fetchError } = await supabase
      .from("extraction_fields")
      .select("project_id")
      .eq("id", fieldId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) throw fetchError;

    // Delete folder associations first
    const { error: assocError } = await supabase
      .from("extraction_field_folders")
      .delete()
      .eq("extraction_field_id", fieldId);

    if (assocError) throw assocError;

    // Delete extraction results associated with this field
    const { error: resultsError } = await supabase
      .from("extraction_results")
      .delete()
      .eq("extraction_field_id", fieldId);

    if (resultsError) throw resultsError;

    // Delete the field
    const { error } = await supabase
      .from("extraction_fields")
      .delete()
      .eq("id", fieldId)
      .eq("user_id", user.id);

    if (error) throw error;

    return redirect(`/dashboard/projects/${field.project_id}`);
  } catch (error: any) {
    return { error: error.message || "Failed to delete extraction field" };
  }
}
