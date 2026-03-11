"use client";

import { toast } from "sonner";
import { z } from "zod";

export const validateForm = <T>(
  formDataObject: T,
  schema: z.ZodSchema<T>,
  form: any,
) => {
  form.clearErrors(); // Clear existing errors
  // Validate against schema
  const validation = schema.safeParse(formDataObject);

  if (!validation.success) {
    // If validation fails, set errors on the form
    validation.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      form.setError(field, { message: issue.message });
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
