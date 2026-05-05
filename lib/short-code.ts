import { customAlphabet } from "nanoid";

export const SHORT_CODE_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const SHORT_CODE_LENGTH = 7;

const nano = customAlphabet(SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH);

export function generateShortCode(): string {
  return nano();
}

export interface MintOptions {
  maxAttempts?: number;
}

export async function mintUniqueShortCode(
  exists: (candidate: string) => Promise<boolean>,
  options: MintOptions = {},
): Promise<string> {
  const maxAttempts = options.maxAttempts ?? 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = generateShortCode();
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(
    `Could not mint a unique short code after ${maxAttempts} attempts`,
  );
}
