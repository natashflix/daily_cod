// Тонкая обёртка над Anthropic Messages API для уровней 3-5.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export class LlmNotConfiguredError extends Error {}

export async function askGuardBot(systemPrompt, history) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LlmNotConfiguredError(
      'ANTHROPIC_API_KEY не задан — добавь его в .env, см. .env.example',
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: systemPrompt,
      messages: history,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text = data.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return text || '...';
}
