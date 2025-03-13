"use server";

import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    // Handle validation error
    return { error: "Project name is required" };
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Return the data instead of redirecting
    return { success: true, projectId: data?.id };
  } catch (error: any) {
    return { error: error.message || "Failed to create project" };
  }
}

export async function updateProject(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const projectId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!projectId || !name) {
    return { error: "Project ID and name are required" };
  }

  try {
    const { error } = await supabase
      .from("projects")
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) throw error;

    return redirect(`/dashboard/projects/${projectId}`);
  } catch (error: any) {
    return { error: error.message || "Failed to update project" };
  }
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const projectId = formData.get("id")?.toString();

  if (!projectId) {
    return { error: "Project ID is required" };
  }

  try {
    // First check if there are any documents in this project
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("id")
      .eq("project_id", projectId)
      .limit(1);

    if (docError) throw docError;

    if (documents && documents.length > 0) {
      return {
        error:
          "Cannot delete project with existing documents. Please delete all documents first.",
      };
    }

    // Check if there are any folders in this project
    const { data: folders, error: folderError } = await supabase
      .from("folders")
      .select("id")
      .eq("project_id", projectId)
      .limit(1);

    if (folderError) throw folderError;

    if (folders && folders.length > 0) {
      return {
        error:
          "Cannot delete project with existing folders. Please delete all folders first.",
      };
    }

    // Delete extraction fields associated with this project
    const { error: fieldError } = await supabase
      .from("extraction_fields")
      .delete()
      .eq("project_id", projectId);

    if (fieldError) throw fieldError;

    // Delete the project
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) throw error;

    return redirect("/dashboard/projects");
  } catch (error: any) {
    return { error: error.message || "Failed to delete project" };
  }
}
