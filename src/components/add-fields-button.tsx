"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AddFieldsButton() {
  const handleClick = () => {
    document.getElementById("add-fields-dialog")?.click();
  };

  return (
    <Button variant="outline" onClick={handleClick}>
      <Plus className="mr-2 h-4 w-4" /> Add Fields
    </Button>
  );
}
