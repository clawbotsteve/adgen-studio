import crypto from "node:crypto";
import { env } from "./env";

type GoogleTokenResponse = { access_token: string; token_type: string; expires_in: number };

const base64Url = (data: string) => Buffer.from(data).toString("base64url");

const getServiceAccountToken = async (): Promise<string> => {
  if (!env.driveServiceAccountEmail || !env.driveServiceAccountPrivateKey) {
    throw new Error("Storage upload is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: env.driveServiceAccountEmail,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(env.driveServiceAccountPrivateKey.replace(/\\n/g, "\n")).toString("base64url");
  const assertion = `${unsigned}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) throw new Error("Failed to authorize storage account.");
  const json = (await resp.json()) as GoogleTokenResponse;
  return json.access_token;
};

export const uploadImageFromUrlToDrive = async ({ imageUrl, filename, folderId }: { imageUrl: string; filename: string; folderId?: string | null; }): Promise<string> => {
  const token = await getServiceAccountToken();
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Failed to fetch generated file.");
  const bytes = Buffer.from(await imgRes.arrayBuffer());

  const metadata = {
    name: filename,
    parents: [folderId || env.driveRootFolderId].filter(Boolean),
  };

  const boundary = `boundary_${Date.now()}`;
  const multipart = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: image/png\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const uploadResp = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });

  if (!uploadResp.ok) throw new Error("Failed to upload file to storage.");
  const json = (await uploadResp.json()) as { id: string; webViewLink?: string };
  return json.webViewLink || `https://drive.google.com/file/d/${json.id}/view`;
};
