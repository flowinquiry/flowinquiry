"use server";
import { createTranslator } from "next-intl";

import { auth } from "@/auth";
import { loadMessages } from "@/lib/load-locales-messages";

export async function getAppTranslations() {
  const session = await auth();
  const resolvedLocale = session?.user?.langKey ?? "en";
  const messages = await loadMessages(resolvedLocale);
  const t = createTranslator({ locale: resolvedLocale, messages });

  return {
    authorities: {
      list: (key: string, values?: Record<string, any>) =>
        t(`authorities.list.${key}`, values),
    },
    users: {
      list: (key: string, values?: Record<string, any>) =>
        t(`users.list.${key}`, values),
      common: (key: string, values?: Record<string, any>) =>
        t(`users.common.${key}`, values),
    },
    common: {
      buttons: (key: string, values?: Record<string, any>) =>
        t(`common.buttons.${key}`, values),
      navigation: (key: string, values?: Record<string, any>) =>
        t(`common.navigation.${key}`, values),
    },
    settings: {
      list: (key: string, values?: Record<string, any>) =>
        t(`settings.list.${key}`, values),
    },
    mail: (key: string, values?: Record<string, any>) =>
      t(`mail.${key}`, values),
    workflows: {
      list: (key: string, values?: Record<string, any>) =>
        t(`workflows.list.${key}`, values),
    },
  };
}
