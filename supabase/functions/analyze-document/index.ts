import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { documentId, extractionFieldIds } = await req.json();

    if (
      !documentId ||
      !extractionFieldIds ||
      !Array.isArray(extractionFieldIds)
    ) {
      throw new Error(
        "Missing required parameters: documentId and extractionFieldIds array",
      );
    }

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get document details
    const { data: document, error: documentError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (documentError || !document) {
      throw new Error(`Document not found: ${documentError?.message}`);
    }

    // Get extraction fields
    const { data: extractionFields, error: fieldsError } = await supabaseAdmin
      .from("extraction_fields")
      .select("*")
      .in("id", extractionFieldIds);

    if (fieldsError || !extractionFields) {
      throw new Error(
        `Error fetching extraction fields: ${fieldsError?.message}`,
      );
    }

    // Get document URL
    const {
      data: { signedUrl },
      error: urlError,
    } = await supabaseAdmin.storage
      .from("documents")
      .createSignedUrl(document.file_path, 60); // 60 seconds expiration

    if (urlError || !signedUrl) {
      throw new Error(`Error creating signed URL: ${urlError?.message}`);
    }

    // In a real implementation, this would call an AI service like Gemini
    // For now, we'll simulate extraction with random data
    const results = [];

    for (const field of extractionFields) {
      // Simulate AI extraction with random data based on field type
      let extractedValue;
      const confidenceScore = 0.7 + Math.random() * 0.3; // Random score between 0.7 and 1.0

      switch (field.data_type) {
        case "text":
          extractedValue = `Sample extracted text for ${field.name}`;
          break;
        case "number":
          extractedValue = Math.floor(Math.random() * 1000).toString();
          break;
        case "date":
          const randomDate = new Date();
          randomDate.setDate(
            randomDate.getDate() - Math.floor(Math.random() * 365),
          );
          extractedValue = randomDate.toISOString().split("T")[0];
          break;
        case "boolean":
          extractedValue = Math.random() > 0.5 ? "true" : "false";
          break;
        default:
          extractedValue = `Extracted value for ${field.name}`;
      }

      // Insert extraction result
      const { data: result, error: insertError } = await supabaseAdmin
        .from("extraction_results")
        .insert({
          document_id: documentId,
          extraction_field_id: field.id,
          extracted_value: extractedValue,
          confidence_score: confidenceScore,
          user_id: document.user_id,
        })
        .select()
        .single();

      if (insertError) {
        console.error(
          `Error inserting extraction result: ${insertError.message}`,
        );
      } else {
        results.push(result);
      }
    }

    // Update document's last_analyzed_at timestamp
    await supabaseAdmin
      .from("documents")
      .update({ last_analyzed_at: new Date().toISOString() })
      .eq("id", documentId);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing document analysis:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
