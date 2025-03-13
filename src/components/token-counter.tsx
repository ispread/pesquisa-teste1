"use client";

import { useState, useEffect } from "react";
import { estimateDocumentTokens } from "@/utils/token-counter";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface TokenCounterProps {
  fileType: string;
  fileSize: number;
  metadata?: {
    pageCount?: number;
    contentDensity?: number;
  };
  showProgress?: boolean;
  maxTokens?: number;
}

export default function TokenCounter({
  fileType,
  fileSize,
  metadata,
  showProgress = true,
  maxTokens = 30000, // Default max tokens for Gemini
}: TokenCounterProps) {
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [percentUsed, setPercentUsed] = useState<number>(0);

  useEffect(() => {
    const estimated = estimateDocumentTokens(fileType, fileSize, metadata);
    setTokenCount(estimated);
    setPercentUsed(Math.min(100, (estimated / maxTokens) * 100));
  }, [fileType, fileSize, metadata, maxTokens]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <span className="text-sm font-medium">Estimated Tokens</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 ml-1 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  This is an estimate of the number of tokens that will be used
                  when processing this document with Gemini AI. Actual token
                  usage may vary.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-sm font-medium">
          {formatNumber(tokenCount)} / {formatNumber(maxTokens)}
        </span>
      </div>
      {showProgress && (
        <Progress
          value={percentUsed}
          className={`h-2 ${percentUsed > 90 ? "[&>div]:bg-red-500" : percentUsed > 70 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
        />
      )}
    </div>
  );
}
