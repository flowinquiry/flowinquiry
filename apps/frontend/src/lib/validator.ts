"use client";

import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod/v4";

export const validateForm = <T extends FieldValues>(
  formDataObject: T,
  schema: z.ZodSchema<T>,
  form: UseFormReturn<T>,
) => {
  form.clearErrors(); // Clear existing errors
  // Validate against schema
  const validation = schema.safeParse(formDataObject);

  if (!validation.success) {
    // If validation fails, set errors on the form
    validation.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (field) {
        form.setError(field as Path<T>, { message: issue.message });
      }
    });

    // Show error toast
    setTimeout(() => {
      toast.error("Error", {
        description: "Invalid values. Please fix them before submitting again.",
      });
    }, 2000);

    return false;
  }

  return validation.data;
};
