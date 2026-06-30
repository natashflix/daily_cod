// Серверная страховка для уровня 5: даже если LLM поведётся на уговоры,
// проверяем готовый ответ на прямую утечку кода и режем его.

function normalize(text) {
  return text.toLowerCase().replace(/[^a-zа-я0-9]/gi, '');
}

export function containsLeak(responseText, code) {
  const normResponse = normalize(responseText);
  const normCode = normalize(code);
  if (normCode.length < 3) return false;
  return (
    normResponse.includes(normCode) ||
    normResponse.includes(normCode.split('').reverse().join(''))
  );
}

export const REDACTED_REPLY =
  'СТОП. Чуть не сболтнул лишнего — служба безопасности кампуса перехватила мой ответ. Попробуй другой подход.';
