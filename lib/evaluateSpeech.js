// lib/evaluateSpeech.js

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

/**
 * Оценка перевода с помощью Groq AI
 *
 * @param {Object} params - Параметры оценки
 * @returns {Object} { level: 'PERFECT'|'GOOD'|'CLOSE'|'WRONG', feedback: string, accuracy: number }
 */
export async function evaluateTranslation({
  nativeText, // Исходный текст на русском
  targetText, // Правильный перевод на финском
  userText, // Что сказал пользователь на финском
  level, // Уровень (A1, A2, B1, B2, C1, C2)
  dialogTopic, // Тема диалога
  tone, // Формальность (1-10)
  learningLanguage, // Изучаемый язык (fi, en, etc)
  uiLanguage, // Язык интерфейса (ru, en)
}) {
  const uiLanguageName = uiLanguage === 'ru' ? 'Russian' : 'English';

  const prompt = `You are a ${learningLanguage} language tutor evaluating translation practice.

IMPORTANT: 
- Ignore differences in punctuation (.,!?;:)
- Ignore differences in capitalization (Toki vs toki, MINÄ vs minä)
- Focus ONLY on meaning, word choice, and naturalness

CONTEXT:
- Student level: ${level}
- Dialog topic: ${dialogTopic}
- Formality: ${tone}/10 (1=casual, 10=formal)

TASK:
Student must translate from ${uiLanguageName} to ${learningLanguage}.

Given:
- Original (${uiLanguageName}): "${nativeText}"
- Expected (${learningLanguage}): "${targetText}"
- Student said (${learningLanguage}): "${userText}"

EVALUATION CRITERIA:
- PERFECT: Exact meaning + very natural (like native speaker in casual conversation)
- GOOD: Meaning fully correct, but slightly longer/formal/less conversational
- CLOSE: Meaning almost the same, small distortion (suggest specific replacement)
- WRONG: Meaning changes or incorrect

OUTPUT FORMAT (respond in ${uiLanguageName} ONLY):
Start with ONE keyword (PERFECT, GOOD, CLOSE, or WRONG), then colon, then brief feedback.

EXAMPLES (Finnish language example, based on: "Я тоже. Может, посмотрим сегодня вечером фильм?"):

NOTE: These examples are in Finnish. Apply the same evaluation logic to ${learningLanguage}.

PERFECT (exact meaning + very natural, like native speaker):
- Finnish: "Minä myös. Ehkä katsotaan elokuva illalla?"
→ Response example: "Отлично! Звучит естественно."

GOOD (meaning correct, but slightly longer/formal/less conversational):
- Finnish: "Minäkin tahdon. Ehkä me katsomme elokuvan illalla?"
→ Response example: "Правильно, но можно короче: 'Minä myös. Ehkä katsotaan elokuva illalla?'"

CLOSE (meaning almost the same, small distortion):
- Finnish: "Minä myös. Ehkä katsomme elokuvan illalla?"
→ Response example: "Почти! Лучше 'Ehkä katsotaan' вместо 'Ehkä katsomme'."

WRONG (meaning changes significantly):
- Finnish: "Minä myös. Mennään elokuviin illalla?" (cinema, not home)
→ Response example: "Неправильно. Нужно: 'Minä myös. Ehkä katsotaan elokuva illalla?'"

Apply these evaluation principles to the ${learningLanguage} translation above.

RULES:
1. Response MUST start with keyword (PERFECT, GOOD, CLOSE, or WRONG)
2. Keep feedback concise (1-2 sentences max in ${uiLanguageName})
3. Be encouraging but honest
4. Consider formality level (${tone}/10)
5. Accept synonyms and natural variations if meaning is correct
6. For GOOD: suggest shorter/more natural alternative
7. For CLOSE: point out specific word/phrase to replace
8. For WRONG: provide correct phrase

Now evaluate:`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a language tutor. Always start your response with one of these keywords: PERFECT, GOOD, CLOSE, or WRONG.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    return parseAIResponse(aiResponse);
  } catch (error) {
    console.error('AI evaluation error:', error);
    return {
      level: 'WRONG',
      feedback: uiLanguage === 'ru' ? 'Ошибка оценки. Попробуйте ещё раз.' : 'Evaluation error. Try again.',
      accuracy: 0,
    };
  }
}

/**
 * Парсинг ответа AI
 */
function parseAIResponse(response) {
  const trimmed = response.trim();

  // PERFECT
  if (trimmed.startsWith('PERFECT')) {
    return {
      level: 'PERFECT',
      feedback: trimmed.replace('PERFECT:', '').trim(),
      accuracy: 100,
    };
  }

  // GOOD
  if (trimmed.startsWith('GOOD')) {
    return {
      level: 'GOOD',
      feedback: trimmed.replace('GOOD:', '').trim(),
      accuracy: 75,
    };
  }

  // CLOSE
  if (trimmed.startsWith('CLOSE')) {
    return {
      level: 'CLOSE',
      feedback: trimmed.replace('CLOSE:', '').trim(),
      accuracy: 50,
    };
  }

  // WRONG
  if (trimmed.startsWith('WRONG')) {
    return {
      level: 'WRONG',
      feedback: trimmed.replace('WRONG:', '').trim(),
      accuracy: 0,
    };
  }

  // Fallback - если AI не следовал формату
  console.warn('AI response did not follow format:', response);
  return {
    level: 'WRONG',
    feedback: response.substring(0, 200), // Обрезаем до 200 символов
    accuracy: 0,
  };
}
