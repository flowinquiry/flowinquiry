"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
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
import { forgotPassword } from "@/lib/actions/users.action";
import { useError } from "@/providers/error-provider";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});
type FormData = z.infer<typeof formSchema>;

const ForgotPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { setError } = useError();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleSubmit = async (data: FormData) => {
    await forgotPassword(data.email, setError);
    setSubmittedEmail(data.email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div
        className="flex justify-center items-start min-h-screen"
        style={{ paddingTop: "100px" }}
      >
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Email Sent</CardTitle>
            <CardDescription>
              A password reset link has been sent to:
              <strong> {submittedEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Please check your inbox and follow the instructions in the email
              to reset your password. If you don't see it, check your spam or
              junk folder.
            </p>
            <div className="flex justify-between">
              <a href="/login" className="hover:underline text-primary text-sm">
                Back to Log In
              </a>
              <Button onClick={() => setIsSubmitted(false)} variant="secondary">
                Resend
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex justify-center items-start min-h-screen"
      style={{ paddingTop: "100px" }}
    >
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid grid-cols-1 gap-6"
            >
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email<span className="text-destructive"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} required placeholder="Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-sm">
                If you remember your password, you can{" "}
                <a href="/login" className="hover:underline text-primary">
                  log in
                </a>
              </div>
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
