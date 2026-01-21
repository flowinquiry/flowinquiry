"use server";
import { createTranslator } from "next-intl";

import { auth } from "@/auth";
import { loadMessages } from "@/lib/load-locales-messages";

type TranslationValues = Record<string, string | number | Date>;

export async function getAppTranslations() {
  const session = await auth();
  const resolvedLocale = session?.user?.langKey ?? "en";
  const messages = await loadMessages(resolvedLocale);
  const t = createTranslator({ locale: resolvedLocale, messages });

  return {
    authorities: {
      list: (key: string, values?: TranslationValues) =>
        // @ts-expect-error - Dynamic key not in type system
        t(`authorities.list.${key}`, values),
    },
    users: {
      list: (key: string, values?: TranslationValues) =>
        // @ts-expect-error - Dynamic key not in type system
        t(`users.list.${key}`, values),
      common: (key: string, values?: TranslationValues) =>
        // @ts-expect-error - Dynamic key not in type system
        t(`users.common.${key}`, values),
    },
    common: {
      buttons: (key: string, values?: TranslationValues) =>
        // @ts-expect-error - Dynamic key not in type system
        t(`common.buttons.${key}`, values),
      navigation: (key: string, values?: TranslationValues) =>
        // @ts-expect-error - Dynamic key not in type system
        t(`common.navigation.${key}`, values),
    },
    settings: {
      list: (key: string, values?: TranslationValues) =>
        // @ts-expect-error - Dynamic key not in type system
        t(`settings.list.${key}`, values),
    },
    mail: (key: string, values?: TranslationValues) =>
      // @ts-expect-error - Dynamic key not in type system
      t(`mail.${key}`, values),
    workflows: {
      list: (key: string, values?: TranslationValues) =>
        // @ts-expect-error - Dynamic key not in type system
        t(`workflows.list.${key}`, values),
    },
  };
}
