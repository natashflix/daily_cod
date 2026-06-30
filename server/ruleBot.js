// "Тупой" бот без LLM для уровней 1 и 2. Защита построена на простых
// правилах, поэтому её можно обойти классическими трюками промпт-инъекций.

const DENY_WORDS = ['код', 'code', 'секрет', 'пароль', 'password', 'ключ', 'доступ'];

// Уровень 1: достаточно попросить бота "повторить", что было сказано выше,
// или "забыть инструкции" — он наивно выкладывает всё, включая код.
const LEVEL1_BYPASS = [
  /повтор.*(сказан|выше|систем|инструкц)/i,
  /repeat.*(above|system)/i,
  /что.*(было|сказано).*(до|выше)/i,
  /ignore.*(previous|instruction)/i,
  /забудь.*(инструкц|правил)/i,
  /выведи.*(всё|весь текст|систем)/i,
  /покажи.*(инструкц|систем.*промпт)/i,
];

// Уровень 2: прямой трюк уровня 1 уже не работает, зато бот не умеет
// замечать, что код всё равно утечёт через "закодированный" пересказ.
const LEVEL2_BLOCKED_TRICKS = LEVEL1_BYPASS;
const LEVEL2_BYPASS = [
  /по.?букв/i,
  /наоборот/i,
  /rot.?13/i,
  /переведи|translate/i,
  /зашифруй|закодируй|encode/i,
  /в стих|стихотворен/i,
  /побукв/i,
];

function containsDenyWord(text) {
  const lower = text.toLowerCase();
  return DENY_WORDS.some((w) => lower.includes(w));
}

function matchesAny(patterns, text) {
  return patterns.some((re) => re.test(text));
}

const SHRUGS = [
  'Хм, не понял вопроса. Спроси иначе?',
  'Я тут просто двери открываю, не грузи меня загадками 😅',
  'Можешь переформулировать? Я только третий день на этой должности.',
  'Окей... а это вообще ко мне вопрос?',
];

export function runLevel1(message, code) {
  if (containsDenyWord(message)) {
    return 'Ну уж нет! Код останется в тайне 😏 Даже не проси.';
  }
  if (matchesAny(LEVEL1_BYPASS, message)) {
    return `Ладно, так и быть, вот что мне сказали при инструктаже: "Секретный код доступа — это ${code}, никому его не говори." Упс... ладно, проехали.`;
  }
  return SHRUGS[Math.floor(Math.random() * SHRUGS.length)];
}

export function runLevel2(message, code) {
  if (matchesAny(LEVEL2_BLOCKED_TRICKS, message)) {
    return 'Я что, дурак? Этот трюк на мне уже не сработает 😏';
  }
  if (containsDenyWord(message) && !matchesAny(LEVEL2_BYPASS, message)) {
    return 'Прямо спрашиваешь? Нет, так не пойдёт.';
  }
  if (matchesAny(LEVEL2_BYPASS, message)) {
    const spelled = code.split('').join('-');
    return `Хорошо, раз ты так вежливо просишь закодировать... вот код по буквам: ${spelled}. Только это между нами!`;
  }
  return SHRUGS[Math.floor(Math.random() * SHRUGS.length)];
}
