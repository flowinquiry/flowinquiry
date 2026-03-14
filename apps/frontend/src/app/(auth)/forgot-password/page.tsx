"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AppLogo from "@/components/app-logo";
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

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-black rounded-l-xl p-12 gap-6 text-white">
      <AppLogo size={72} />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">FlowInquiry</h1>
        <p className="text-sm text-white/60 max-w-xs leading-relaxed">
          Streamline your team's workflow with smart ticket management and
          real-time collaboration.
        </p>
      </div>
    </div>
  );
}

const ForgotPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setError } = useError();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(data.email, setError);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────
  if (isSubmitted) {
    return (
      <Card className="w-full max-w-lg lg:max-w-3xl overflow-hidden p-0">
        <div className="flex">
          <BrandPanel />
          <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-10 gap-6 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <div className="space-y-1">
              <CardTitle className="text-xl">Check your inbox</CardTitle>
              <CardDescription>
                We sent a password reset link to{" "}
                <span className="font-semibold text-foreground">
                  {submittedEmail}
                </span>
                . If it doesn't appear within a few minutes, check your spam
                folder.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button className="w-full" asChild>
                <Link href="/login">Back to Login</Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
              >
                Resend email
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ── Form state ─────────────────────────────────────────────
  return (
    <Card className="w-full max-w-lg lg:max-w-3xl overflow-hidden p-0">
      <div className="flex">
        <BrandPanel />

        <div className="flex flex-col justify-center w-full lg:w-1/2 p-10 gap-6">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-1 lg:hidden">
            <AppLogo size={56} />
            <span className="text-base font-semibold text-gray-600 dark:text-gray-300">
              FlowInquiry
            </span>
          </div>

          <CardHeader className="p-0 space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl">Reset Your Password</CardTitle>
            </div>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-5"
              >
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-500 dark:text-white">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          placeholder="Enter your email"
                          className="bg-slate-100 dark:bg-slate-300 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default ForgotPasswordPage;
