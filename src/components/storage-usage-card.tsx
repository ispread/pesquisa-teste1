"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Database } from "lucide-react";
import { calculateStorageUsed, formatBytes } from "@/utils/storage-utils";

interface StorageUsageCardProps {
  subscription?: any;
}

export default function StorageUsageCard({
  subscription,
}: StorageUsageCardProps) {
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Define storage limits based on subscription
  const storageLimit = subscription
    ? 10 * 1024 * 1024 * 1024
    : 1 * 1024 * 1024 * 1024; // 10GB for paid, 1GB for free

  useEffect(() => {
    const fetchStorageUsage = async () => {
      setIsLoading(true);
      try {
        const usedBytes = await calculateStorageUsed();
        setStorageUsed(usedBytes);
      } catch (error) {
        console.error("Failed to fetch storage usage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorageUsage();
  }, []);

  // Calculate percentage used
  const percentUsed = Math.min(100, (storageUsed / storageLimit) * 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
        <Database className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? "Loading..." : formatBytes(storageUsed)}
        </div>
        <p className="text-xs text-muted-foreground">
          of {subscription ? "10 GB" : "1 GB"}
        </p>
        {!isLoading && (
          <div className="mt-3">
            <Progress value={percentUsed} className="h-2" />
            <p className="text-xs text-right mt-1">
              {percentUsed.toFixed(1)}% used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
