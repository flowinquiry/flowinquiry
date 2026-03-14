"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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

/** Shared branding panel shown on the left on larger screens */
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

function ResetFinishContent() {
  const searchParams = useSearchParams();
  const keyParam = searchParams.get("key");
  const mode = searchParams.get("mode"); // "activation" | "reset" | null

  const isActivation = mode === "activation";

  const copy = {
    formTitle: isActivation ? "Set Up Your Account" : "Create New Password",
    formDescription: isActivation
      ? "Welcome to FlowInquiry! Choose a secure password to activate your account."
      : "Choose a strong password — at least 8 characters.",
    formIcon: isActivation ? UserCheck : KeyRound,
    submitLabel: isActivation ? "Activate Account" : "Reset Password",
    submittingLabel: isActivation ? "Activating…" : "Resetting…",
    successTitle: isActivation
      ? "Account Activated!"
      : "Password Reset Successful",
    successDescription: isActivation
      ? "Your account is ready. Redirecting to login in"
      : "Your password has been updated. Redirecting to login in",
    errorTitle: isActivation ? "Activation Failed" : "Something went wrong",
  };

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { setError } = useError();
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!keyParam) {
      setErrorMessage(
        "The activation link is missing or invalid. Please request a new one.",
      );
      setStatus("error");
    }
  }, [keyParam]);

  useEffect(() => {
    if (status !== "success") return;
    if (countdown === 0) {
      router.push("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  const handleSubmit = async (data: FormData) => {
    if (!keyParam) return;
    setStatus("submitting");
    try {
      await passwordReset(keyParam, data.password, setError);
      setStatus("success");
    } catch {
      setErrorMessage(
        isActivation
          ? "We couldn't activate your account. The link may have expired."
          : "An unexpected error occurred. Please try again later.",
      );
      setStatus("error");
    }
  };

  const FormIcon = copy.formIcon;

  // ── Success state ──────────────────────────────────────────
  if (status === "success") {
    return (
      <Card className="w-full max-w-lg lg:max-w-3xl overflow-hidden p-0">
        <div className="flex">
          <BrandPanel />
          <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-10 gap-6 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <div className="space-y-1">
              <CardTitle className="text-xl">{copy.successTitle}</CardTitle>
              <CardDescription>
                {copy.successDescription}{" "}
                <span className="font-semibold text-foreground">
                  {countdown}
                </span>{" "}
                second{countdown !== 1 ? "s" : ""}…
              </CardDescription>
            </div>
            <Button className="w-full" asChild>
              <Link href="/login">Go to Login Now</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (status === "error") {
    return (
      <Card className="w-full max-w-lg lg:max-w-3xl overflow-hidden p-0">
        <div className="flex">
          <BrandPanel />
          <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-10 gap-6 text-center">
            <XCircle className="h-14 w-14 text-destructive" />
            <div className="space-y-1">
              <CardTitle className="text-xl">{copy.errorTitle}</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </div>
            <p className="text-sm text-muted-foreground">
              If the issue persists, please contact the system administrator.
            </p>
            <div className="flex flex-col gap-2 w-full">
              {isActivation ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/forgot-password">
                    Request a new activation link
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/forgot-password">Request a new reset link</Link>
                </Button>
              )}
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ── Form state (idle / submitting) ─────────────────────────
  return (
    <Card className="w-full max-w-lg lg:max-w-3xl overflow-hidden p-0">
      <div className="flex">
        <BrandPanel />

        {/* Right: form */}
        <div className="flex flex-col justify-center w-full lg:w-1/2 p-10 gap-6">
          {/* Mobile logo (hidden on lg) */}
          <div className="flex flex-col items-center gap-1 lg:hidden">
            <AppLogo size={56} />
            <span className="text-base font-semibold text-gray-600 dark:text-gray-300">
              FlowInquiry
            </span>
          </div>

          <CardHeader className="p-0 space-y-1">
            <div className="flex items-center gap-2">
              <FormIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl">{copy.formTitle}</CardTitle>
            </div>
            <CardDescription>{copy.formDescription}</CardDescription>
          </CardHeader>

          {isActivation && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                You're setting up your password for the first time. Make sure to
                store it somewhere safe.
              </span>
            </div>
          )}

          <CardContent className="p-0 space-y-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-5"
              >
                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-500 dark:text-white">
                        {isActivation ? "Password" : "New Password"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={
                            isActivation
                              ? "Create a password"
                              : "Enter new password"
                          }
                          autoComplete="new-password"
                          className="bg-slate-100 dark:bg-slate-300 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                          {...field}
                        />
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
                      <FormLabel className="text-xs font-bold text-zinc-500 dark:text-white">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          className="bg-slate-100 dark:bg-slate-300 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {copy.submittingLabel}
                    </>
                  ) : (
                    copy.submitLabel
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm text-muted-foreground">
              {isActivation
                ? "Already have an account? "
                : "Remember your password? "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

const Page = () => {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ResetFinishContent />
    </Suspense>
  );
};

export default Page;
