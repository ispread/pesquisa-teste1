"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface EditFormProps {
  formAction: any;
  submitButtonText: string;
  pendingButtonText: string;
  successMessage: string;
  redirectPath?: string;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
  onCancel?: () => void;
}

export default function EditForm({
  formAction,
  submitButtonText,
  pendingButtonText,
  successMessage,
  redirectPath,
  className,
  variant = "default",
  size = "default",
  children,
  onCancel,
}: EditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await formAction(formData);

      // If there's an error in the result, show it
      if (result && result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Show success message
      toast({
        title: "Success",
        description: successMessage,
      });

      // If we have a redirect path, navigate to it
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        // Otherwise refresh the current page
        startTransition(() => {
          router.refresh();
        });
      }

      // Call onCancel to close dialog if provided
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      <div className="pt-4 flex justify-end space-x-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || isPending}
          variant={variant}
          size={size}
        >
          {isSubmitting || isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {pendingButtonText}
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </div>
    </form>
  );
}
