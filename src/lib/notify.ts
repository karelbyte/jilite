import "server-only";

export interface WebhookMessage {
  text: string;
  taskUrl?: string;
}

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

export async function postWebhook(msg: WebhookMessage): Promise<void> {
  await Promise.allSettled([postSlack(msg), postDiscord(msg)]);
}

async function postSlack(msg: WebhookMessage) {
  if (!SLACK_WEBHOOK) return;
  const payload = {
    text: msg.taskUrl ? `<${msg.taskUrl}|${msg.text}>` : msg.text,
  };
  await fetch(SLACK_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function postDiscord(msg: WebhookMessage) {
  if (!DISCORD_WEBHOOK) return;
  const payload = {
    content: msg.taskUrl ? `${msg.text}\n${msg.taskUrl}` : msg.text,
  };
  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
