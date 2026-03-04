"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Heading } from "@/components/heading";
import { ImageCropper } from "@/components/image-cropper";
import { UserAvatar } from "@/components/shared/avatar-display";
import { CountrySelectField } from "@/components/shared/countries-select";
import TimezoneSelect from "@/components/shared/timezones-select";
import { Button } from "@/components/ui/button";
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

  // State to store the avatar URL with cache busting
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

        // This is a backup approach if the update isn't working
        // Force a page refresh after a short delay to ensure session gets the new imageUrl
        // Uncomment this if you're still having issues
        // setTimeout(() => {
        //   router.refresh();
        // }, 500);
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

  return (
    <div
      className="grid grid-cols-1 gap-4"
      data-testid="profile-form-container"
    >
      <Heading
        title={t.users.profile("title")}
        description={t.users.profile("description")}
        data-testid="profile-form-heading"
      />
      <Separator />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-row gap-4"
          data-testid="profile-form"
        >
          <div
            className="flex flex-col items-center space-y-2"
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
              <>
                <input
                  {...getInputProps()}
                  data-testid="profile-avatar-input"
                />
                <UserAvatar
                  {...getRootProps()}
                  size="w-36 h-36"
                  className="cursor-pointer ring-offset-2 ring-2 ring-slate-200"
                  imageUrl={avatarUrl}
                  data-testid="profile-avatar"
                />
              </>
            )}
            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setPasswordDialogOpen}
              data-testid="change-password-dialog"
            >
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  className="mt-2"
                  data-testid="change-password-button"
                >
                  {t.users.profile("change_password")}
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="change-password-dialog-content">
                <DialogHeader>
                  <DialogTitle data-testid="change-password-dialog-title">
                    {t.users.profile("change_password")}
                  </DialogTitle>
                </DialogHeader>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                    className="grid grid-cols-1 gap-4"
                    data-testid="change-password-form"
                  >
                    {/* Current Password Field */}
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    currentPassword: !prev.currentPassword,
                                  }))
                                }
                                data-testid="toggle-current-password-visibility"
                              >
                                {showPasswords.currentPassword ? (
                                  <EyeOff size={20} />
                                ) : (
                                  <Eye size={20} />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* New Password Field */}
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    newPassword: !prev.newPassword,
                                  }))
                                }
                                data-testid="toggle-new-password-visibility"
                              >
                                {showPasswords.newPassword ? (
                                  <EyeOff size={20} />
                                ) : (
                                  <Eye size={20} />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit and Cancel Buttons */}
                    <div className="flex flex-row gap-4">
                      <Button type="submit" data-testid="save-password-button">
                        {t.common.buttons("save")}
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => setPasswordDialogOpen(false)}
                        data-testid="cancel-password-button"
                      >
                        {t.common.buttons("cancel")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-testid="profile-form-fields"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.users.form("email")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly
                      data-testid="profile-email-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TimezoneSelect
              form={form}
              required={true}
              fieldName="timezone"
              label={t.users.form("timezone")}
              data-testid="profile-timezone-select"
            />
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
            <ExtTextAreaField
              form={form}
              fieldName="about"
              label="About"
              data-testid="profile-about-textarea"
            />
            <ExtInputField
              form={form}
              fieldName="address"
              label={t.users.form("address")}
              data-testid="profile-address-input"
            />
            <ExtInputField
              form={form}
              fieldName="city"
              label={t.users.form("city")}
              data-testid="profile-city-input"
            />
            <ExtInputField
              form={form}
              fieldName="state"
              label={t.users.form("city")}
              data-testid="profile-state-input"
            />
            <CountrySelectField
              form={form}
              fieldName="country"
              label={t.users.form("country")}
              data-testid="profile-country-select"
            />
            <div
              className="md:col-span-2 flex flex-row gap-4"
              data-testid="profile-form-buttons"
            >
              <Button type="submit" data-testid="profile-submit-button">
                {t.common.buttons("submit")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.back()}
                data-testid="profile-discard-button"
              >
                {t.common.buttons("discard")}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <Dialog
        open={isConfirmationOpen}
        onOpenChange={setConfirmationOpen}
        data-testid="password-confirmation-dialog"
      >
        <DialogContent data-testid="password-confirmation-dialog-content">
          <DialogHeader>
            <DialogTitle data-testid="password-confirmation-dialog-title">
              Password Updated
            </DialogTitle>
          </DialogHeader>
          <p data-testid="password-confirmation-message">
            Your password has been updated successfully!
          </p>
          <div className="mt-4">
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
