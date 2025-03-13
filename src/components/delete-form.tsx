"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface DeleteFormProps {
  itemName: string;
  itemType: "project" | "folder" | "document" | "field";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  formAction: any;
  itemId: string;
  onDeleteSuccess?: () => void;
}

export default function DeleteForm({
  itemName,
  itemType,
  variant = "outline",
  size = "default",
  className,
  formAction,
  itemId,
  onDeleteSuccess,
}: DeleteFormProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    setIsDeleting(true);

    // Submit the form
    const form = document.getElementById(
      `delete-form-${itemId}`,
    ) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }

    // Close the dialog
    setIsOpen(false);

    // Show a toast notification
    toast({
      title: `Deleting ${itemType}...`,
      description: `${itemName} is being deleted.`,
    });

    // Refresh the page data after a short delay
    setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
      setIsDeleting(false);
    }, 500);
  };

  return (
    <>
      <form id={`delete-form-${itemId}`} action={formAction}>
        <input type="hidden" name="id" value={itemId} />
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant={variant} size={size} className={className}>
              {isDeleting || isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isDeleting || isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {itemType}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {itemType} "{itemName}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </>
  );
}
