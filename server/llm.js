// Обёртка над OpenAI Chat Completions API для уровней 3-5.

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export class LlmNotConfiguredError extends Error {}

export async function askGuardBot(systemPrompt, history) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new LlmNotConfiguredError(
      'OPENAI_API_KEY не задан — добавь его в .env, см. .env.example',
    );
  }

  // OpenAI: system prompt идёт первым сообщением в messages с role "system".
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
  ];

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '...';
}
