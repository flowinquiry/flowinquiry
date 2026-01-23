import { toast } from "sonner";

import { HttpError } from "@/lib/errors";

export async function navigateToRecord<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>, // The main function to execute with parameters
  notFoundMessage: string, // Custom message for 404 errors
  ...args: Args // Spread operator to pass parameters to `fn`
): Promise<T> {
  try {
    return await fn(...args); // Pass arguments to `fn`
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === HttpError.NOT_FOUND) {
        toast.error(notFoundMessage);
        return Promise.reject("Resource not found"); // Ensure a return after 404 handling
      } else {
        // Rethrow other HttpErrors for higher-level handling
        throw error;
      }
    } else if (
      error instanceof Error &&
      (error.name === "Not Found" || error.message.includes("Not Found"))
    ) {
      toast.error(notFoundMessage);
      return Promise.reject("Resource not found");
    } else {
      // Rethrow any unexpected errors for higher-level handling
      throw error;
    }
  }
}
