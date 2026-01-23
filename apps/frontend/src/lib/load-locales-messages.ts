import fs from "fs/promises";
import path from "path";

export async function loadMessages(
  locale: string,
): Promise<Record<string, any>> {
  const filePath = path.resolve(process.cwd(), "messages", `${locale}.json`);

  try {
    const file = await fs.readFile(filePath, "utf8");
    return JSON.parse(file);
  } catch (err) {
    console.warn(
      `[i18n] Missing or invalid locale file for "${locale}", falling back to "en"`,
    );
    const fallback = await fs.readFile(
      path.resolve(process.cwd(), "locales", "en.json"),
      "utf8",
    );
    return JSON.parse(fallback);
  }
}
