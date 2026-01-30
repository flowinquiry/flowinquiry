import { access } from "node:fs/promises";

export function appendJsonPart(form: FormData, field: string, value: unknown) {
  const payload = JSON.stringify(value);
  form.append(field, new Blob([payload], { type: "application/json" }));
}

export async function appendFile(
  form: FormData,
  field: string,
  path: string,
) {
  await access(path);
  form.append(field, Bun.file(path));
}

export async function appendFiles(
  form: FormData,
  field: string,
  paths: string[],
) {
  for (const path of paths) {
    await appendFile(form, field, path);
  }
}
