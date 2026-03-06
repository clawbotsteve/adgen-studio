import { env } from "./env";

export const notifySlack = async (message: string) => {
  if (!env.slackWebhookUrl) return;

  await fetch(env.slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
};
