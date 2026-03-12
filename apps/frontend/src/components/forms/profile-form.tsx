"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ImageCropper } from "@/components/image-cropper";
import { UserAvatar } from "@/components/shared/avatar-display";
import { CountrySelectField } from "@/components/shared/countries-select";
import TimezoneSelect from "@/components/shared/timezones-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExtInputField, ExtTextAreaField } from "@/components/ui/ext-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useImageCropper } from "@/hooks/use-image-cropper";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  changePassword,
  findUserById,
  updateUser,
} from "@/lib/actions/users.action";
import { useError } from "@/providers/error-provider";
import { UserDTOSchema } from "@/types/users";

const userSchemaWithFile = UserDTOSchema.extend({
  file: z.any().optional(),
});

const passwordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current Password must be at least 1 characters"),
  newPassword: z.string().min(8, "New Password must be at least 6 characters"),
});

type UserTypeWithFile = z.infer<typeof userSchemaWithFile>;

export const ProfileForm = () => {
  const router = useRouter();
  const { data: session, update } = useSession();
  const t = useAppClientTranslations();
  const {
    selectedFile,
    setSelectedFile,
    isDialogOpen,
    setDialogOpen,
    getRootProps,
    getInputProps,
  } = useImageCropper();

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    session?.user?.imageUrl,
  );
  const [user, setUser] = useState<UserTypeWithFile | undefined>(undefined);
  const { setError } = useError();
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
  });

  // For session synchronization
  useEffect(() => {
    // Initialize avatarUrl from session when component mounts or session changes
    if (session?.user?.imageUrl) {
      setAvatarUrl(session.user.imageUrl);
    }
  }, []); // Only run on mount

  const onSubmit = async (data: UserTypeWithFile) => {
    const formData = new FormData();
    const userJsonBlob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
    formData.append("userDTO", userJsonBlob);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    // Update user and get the updated user data
    const updatedUser = await updateUser(formData, setError);

    // Handle avatar URL update with cache busting
    if (selectedFile && updatedUser?.imageUrl) {
      try {
        // Get the base URL without any query parameters
        const baseImageUrl = updatedUser.imageUrl.split("?")[0];

        // Create a cache-busting URL
        const cacheBustedUrl = `${baseImageUrl}?v=${Date.now()}`;

        // Update our local state immediately for the UI
        setAvatarUrl(cacheBustedUrl);

        // Force next-auth session update
        // We need to update the session object, but we can't rely on it updating immediately
        await update({
          ...session,
          user: {
            ...session?.user,
            imageUrl: cacheBustedUrl,
          },
        });
      } catch (error) {
        console.error("Error updating avatar:", error);
      }
    } else {
      // If no new avatar, just update the session normally
      await update();
    }
    // Reset file selection state
    setSelectedFile(null);

    toast.success(t.users.profile("save_success"));
  };

  const handleChangePassword = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await changePassword(data.currentPassword, data.newPassword, setError);
      setPasswordDialogOpen(false);
      setConfirmationOpen(true);
    } catch (error) {
      toast.error("Can not change the password");
    }
  };

  useEffect(() => {
    async function loadUserInfo() {
      const userData = await findUserById(Number(session?.user?.id), setError);
      setUser({ ...userData, file: undefined });
      if (userData) {
        form.reset(userData);
      }
    }
    loadUserInfo();
  }, []);

  const form = useForm<UserTypeWithFile>({
    resolver: zodResolver(userSchemaWithFile),
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const displayName =
    [form.watch("firstName"), form.watch("lastName")]
      .filter(Boolean)
      .join(" ") ||
    session?.user?.name ||
    "";
  const email = form.watch("email") || session?.user?.email || "";

  return (
    <div className="flex flex-col gap-4" data-testid="profile-form-container">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 gap-6"
          data-testid="profile-form"
        >
          <div className="flex flex-col gap-4">
            {/* ── Hero / Avatar card ── */}
            <Card className="overflow-hidden p-0 gap-0">
              {/* gradient banner */}
              <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 relative" />

              {/* avatar row */}
              <div className="px-6 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
                  {/* avatar */}
                  <div
                    className="flex flex-col items-center sm:items-start gap-1"
                    data-testid="profile-avatar-container"
                  >
                    {selectedFile ? (
                      <ImageCropper
                        dialogOpen={isDialogOpen}
                        setDialogOpen={setDialogOpen}
                        selectedFile={selectedFile}
                        setSelectedFile={setSelectedFile}
                        data-testid="profile-image-cropper"
                      />
                    ) : (
                      <div
                        className="relative group cursor-pointer"
                        {...getRootProps()}
                      >
                        <input
                          {...getInputProps()}
                          data-testid="profile-avatar-input"
                        />
                        <UserAvatar
                          size="w-24 h-24"
                          className="ring-4 ring-background shadow-md group-hover:ring-primary transition-all duration-200"
                          imageUrl={avatarUrl}
                          data-testid="profile-avatar"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-0.5">
                          <Camera className="h-5 w-5 text-white" />
                          <span className="text-[9px] text-white font-medium leading-none">
                            Upload
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* name + email + change-password button */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:pb-1 text-center sm:text-left">
                    <div>
                      {displayName && (
                        <p className="font-semibold text-lg leading-tight">
                          {displayName}
                        </p>
                      )}
                      {email && (
                        <p className="text-sm text-muted-foreground">{email}</p>
                      )}
                    </div>

                    <Dialog
                      open={isPasswordDialogOpen}
                      onOpenChange={setPasswordDialogOpen}
                      data-testid="change-password-dialog"
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 shrink-0"
                          data-testid="change-password-button"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          {t.users.profile("change_password")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="change-password-dialog-content">
                        <DialogHeader>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-md bg-primary/10">
                              <Lock className="h-4 w-4 text-primary" />
                            </div>
                            <DialogTitle data-testid="change-password-dialog-title">
                              {t.users.profile("change_password")}
                            </DialogTitle>
                          </div>
                        </DialogHeader>
                        <Form {...passwordForm}>
                          <form
                            onSubmit={passwordForm.handleSubmit(
                              handleChangePassword,
                            )}
                            className="grid grid-cols-1 gap-4"
                            data-testid="change-password-form"
                          >
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t.users.profile("current_password")}
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        {...field}
                                        type={
                                          showPasswords.currentPassword
                                            ? "text"
                                            : "password"
                                        }
                                        data-testid="current-password-input"
                                      />
                                      <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() =>
                                          setShowPasswords((prev) => ({
                                            ...prev,
                                            currentPassword:
                                              !prev.currentPassword,
                                          }))
                                        }
                                        data-testid="toggle-current-password-visibility"
                                      >
                                        {showPasswords.currentPassword ? (
                                          <EyeOff size={16} />
                                        ) : (
                                          <Eye size={16} />
                                        )}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t.users.profile("new_password")}
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        {...field}
                                        type={
                                          showPasswords.newPassword
                                            ? "text"
                                            : "password"
                                        }
                                        data-testid="new-password-input"
                                      />
                                      <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() =>
                                          setShowPasswords((prev) => ({
                                            ...prev,
                                            newPassword: !prev.newPassword,
                                          }))
                                        }
                                        data-testid="toggle-new-password-visibility"
                                      >
                                        {showPasswords.newPassword ? (
                                          <EyeOff size={16} />
                                        ) : (
                                          <Eye size={16} />
                                        )}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex flex-row gap-3 pt-2 justify-end">
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => setPasswordDialogOpen(false)}
                                data-testid="cancel-password-button"
                              >
                                {t.common.buttons("cancel")}
                              </Button>
                              <Button
                                type="submit"
                                data-testid="save-password-button"
                              >
                                {t.common.buttons("save")}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </Card>
            {/* ── Personal info + Location side by side on wide screens ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ── Personal info card ── */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Update your name, email and bio
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-5">
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    data-testid="profile-form-fields"
                  >
                    {/* Email — full width */}
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.users.form("email")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  readOnly
                                  className="bg-muted/50 cursor-not-allowed pr-20"
                                  data-testid="profile-email-input"
                                />
                                <Badge
                                  variant="secondary"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] gap-1 py-0"
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  Verified
                                </Badge>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* First / Last name */}
                    <ExtInputField
                      form={form}
                      required={true}
                      fieldName="firstName"
                      label={t.users.form("first_name")}
                      data-testid="profile-first-name-input"
                    />
                    <ExtInputField
                      form={form}
                      required={true}
                      fieldName="lastName"
                      label={t.users.form("last_name")}
                      data-testid="profile-last-name-input"
                    />

                    {/* Timezone — full width */}
                    <div className="sm:col-span-2">
                      <TimezoneSelect
                        form={form}
                        required={true}
                        fieldName="timezone"
                        label={t.users.form("timezone")}
                        data-testid="profile-timezone-select"
                      />
                    </div>

                    {/* About — full width (ExtTextAreaField has its own md:col-span-2 wrapper) */}
                    <div className="sm:col-span-2">
                      <ExtTextAreaField
                        form={form}
                        fieldName="about"
                        label="About"
                        data-testid="profile-about-textarea"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Location card ── */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Location
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Your address and location details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <ExtInputField
                        form={form}
                        fieldName="address"
                        label={t.users.form("address")}
                        data-testid="profile-address-input"
                      />
                    </div>
                    <ExtInputField
                      form={form}
                      fieldName="city"
                      label={t.users.form("city")}
                      data-testid="profile-city-input"
                    />
                    <ExtInputField
                      form={form}
                      fieldName="state"
                      label={t.users.form("state") ?? "State"}
                      data-testid="profile-state-input"
                    />
                    <div className="sm:col-span-2">
                      <CountrySelectField
                        form={form}
                        fieldName="country"
                        label={t.users.form("country")}
                        data-testid="profile-country-select"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>{" "}
            {/* end lg:grid-cols-2 */}
          </div>

          {/* ── Sticky action bar ── */}
          <div
            className="mt-auto sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border bg-background/80 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60"
            data-testid="profile-form-buttons"
          >
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              data-testid="profile-discard-button"
            >
              {t.common.buttons("discard")}
            </Button>
            <Button type="submit" data-testid="profile-submit-button">
              {t.common.buttons("submit")}
            </Button>
          </div>
        </form>
      </Form>

      {/* ── Password changed confirmation ── */}
      <Dialog
        open={isConfirmationOpen}
        onOpenChange={setConfirmationOpen}
        data-testid="password-confirmation-dialog"
      >
        <DialogContent data-testid="password-confirmation-dialog-content">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-md bg-green-500/10">
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </div>
              <DialogTitle data-testid="password-confirmation-dialog-title">
                Password Updated
              </DialogTitle>
            </div>
          </DialogHeader>
          <p
            className="text-sm text-muted-foreground"
            data-testid="password-confirmation-message"
          >
            Your password has been updated successfully!
          </p>
          <div className="mt-2 flex justify-end">
            <Button
              onClick={() => setConfirmationOpen(false)}
              data-testid="password-confirmation-close-button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
