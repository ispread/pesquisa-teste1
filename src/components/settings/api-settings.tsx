"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "../../../supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Copy, RefreshCw, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiSettingsProps {
  user: User;
}

export default function ApiSettings({ user }: ApiSettingsProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  // Simulate fetching API key
  useEffect(() => {
    // In a real app, you would fetch the actual API key from your backend
    // This is just a placeholder simulation
    const simulatedApiKey = `sk_${user.id.substring(0, 8)}_${Math.random().toString(36).substring(2, 10)}`;
    setApiKey(simulatedApiKey);
  }, [user.id]);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API key copied",
      description: "The API key has been copied to your clipboard.",
    });
  };

  const handleGenerateNewKey = async () => {
    setIsGenerating(true);

    try {
      // Simulate API key generation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newApiKey = `sk_${user.id.substring(0, 8)}_${Math.random().toString(36).substring(2, 10)}`;
      setApiKey(newApiKey);

      toast({
        title: "New API key generated",
        description: "Your new API key has been generated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate new API key",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <div className="flex items-start space-x-4 mb-6">
          <Key className="h-10 w-10 text-blue-500 mt-1" />
          <div>
            <h2 className="text-xl font-semibold">API Access</h2>
            <p className="text-gray-600">
              Use your API key to access the DocExtract API programmatically.
              Keep your API key secure and never share it publicly.
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Your API key has full access to your account. Protect it like a
            password.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Your API Key</Label>
            <div className="flex">
              <Input
                id="apiKey"
                value={apiKey}
                readOnly
                type="password"
                className="rounded-r-none font-mono"
              />
              <Button
                variant="outline"
                className="rounded-l-none border-l-0"
                onClick={handleCopyApiKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={handleGenerateNewKey}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Key
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Warning: Generating a new key will invalidate your existing key.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h2 className="text-xl font-semibold mb-6">API Documentation</h2>
        <p className="text-gray-600 mb-4">
          Learn how to use the DocExtract API to integrate document management
          and data extraction into your applications.
        </p>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Authentication</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>Authorization: Bearer YOUR_API_KEY</code>
            </pre>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Example Request</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`curl -X POST https://api.docextract.com/v1/documents \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -F "file=@document.pdf" \\\n  -F "project_id=your_project_id"`}</code>
            </pre>
          </div>
        </div>

        <Button variant="outline" className="mt-6" asChild>
          <a href="#" target="_blank" rel="noopener noreferrer">
            View Full Documentation
          </a>
        </Button>
      </div>
    </div>
  );
}
