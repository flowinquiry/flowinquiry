"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { passwordReset } from "@/lib/actions/users.action";
import { useError } from "@/providers/error-provider";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ActivationContent() {
  const searchParams = useSearchParams();
  const keyParam = searchParams.get("key");

  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const { setError } = useError();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const [countdown, setCountdown] = useState(5); // Countdown timer (in seconds)
  const router = useRouter();

  useEffect(() => {
    if (status === "success") {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      // Redirect when countdown reaches 0
      if (countdown === 0) {
        clearInterval(timer);
        router.push("/login");
      }

      // Cleanup timer on component unmount or countdown completion
      return () => clearInterval(timer);
    }
  }, [status, countdown, router]);

  const handleRedirectNow = () => {
    router.push("/login");
  };

  useEffect(() => {
    if (status === "submitted" && keyParam) {
      const activateUser = async (key: string) => {
        try {
          await passwordReset(key, form.getValues("password"), setError);
          setStatus("success");
        } catch (error) {
          setErrorMessage(
            "An unexpected error occurred. Please retry again later.",
          );
          setStatus("error");
        }
      };
      activateUser(keyParam);
    } else if (!keyParam) {
      setErrorMessage("Activation key is missing.");
      setStatus("error");
    }
  }, [status, keyParam, form]);

  const handleSubmit = (data: FormData) => {
    setStatus("submitted");
  };

  return (
    <div>
      {status === "loading" && (
        <div
          className="flex justify-center items-start min-h-screen"
          style={{ paddingTop: "100px" }}
        >
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Create Your Password</CardTitle>
              <CardDescription>
                To secure your account, please create a strong password. This
                will help keep your information safe and ensure only you have
                access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="grid grid-cols-1 gap-6"
                >
                  <FormField
                    name="password"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="confirmPassword"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Re-enter Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
      {status === "submitted" && <p>Activating your account...</p>}
      {status === "success" && (
        <div
          className="flex justify-center items-start min-h-screen"
          style={{ paddingTop: "100px" }}
        >
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>
                Your account has been activated successfully!
              </CardTitle>
              <CardDescription>
                Redirecting to login in {countdown} seconds...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                <a
                  onClick={handleRedirectNow}
                  className="cursor-pointer underline"
                >
                  Click here to go to the login page now
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {status === "error" && (
        <div
          className="flex justify-center items-start min-h-screen"
          style={{ paddingTop: "100px" }}
        >
          <p>{errorMessage}</p>
          <p>If the issue persists, please contact the system administrator.</p>
        </div>
      )}
    </div>
  );
}

const Page = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ActivationContent />
    </Suspense>
  );
};

export default Page;
