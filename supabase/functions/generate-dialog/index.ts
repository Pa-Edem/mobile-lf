// supabase/functions/generate-dialog/index.ts
// Endpoint URL: // https://cfyknugijnlpapvyohhu.supabase.co/functions/v1/generate-dialog

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("--- New Request Started ---");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Создаем клиент с Service Role для доступа к БД
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Очищаем токен от слова 'Bearer ' если оно есть
    const token = authHeader.replace("Bearer ", "");

    // Проверяем пользователя через его же токен
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      // Если тут упало, значит токен по какой-то причине не нравится самому Supabase Auth
      return new Response(JSON.stringify({ error: "Invalid User Token", details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ User verified ID:", user.id);

    // Данные из body
    const body = await req.json();
    console.log("📦 Request body:", body);

    const { topic, words, level, tone, replicas, targetLanguage, uiLanguage } = body;

    // Получаем профиль
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, is_trial_active, manual_pro, manual_premium')
      .eq('id', user.id)
      .single();

    // Определяем эффективный план
    let effectivePlan = 'free';
    if (profile?.manual_premium) {
      effectivePlan = 'premium';
    } else if (profile?.manual_pro) {
      effectivePlan = 'pro';
    } else if (profile?.is_trial_active) {
      effectivePlan = 'pro';
    } else {
      effectivePlan = profile?.subscription_tier || 'free';
    }

    console.log('📊 Plan:', effectivePlan);

    // Получаем UI язык пользователя для переводов
    const userUiLanguage = uiLanguage || profile?.ui_language || 'en';
    
    // Маппинг UI языков на полные названия
    const languageNames: Record<string, string> = {
      'en': 'English',
      'ru': 'Russian',
    };
    
    const nativeLanguage = languageNames[userUiLanguage] || 'English';
    
    // Маппинг target языков на полные названия
    const targetLanguageNames: Record<string, string> = {
      'fi': 'Finnish',
      'en': 'English',
      'es': 'Spanish',
      'de': 'German',
      'fr': 'French',
      'it': 'Italian',
      'pt': 'Portuguese',
      'se': 'Swedish',
      'no': 'Norwegian',
    };
    
    const targetLanguageName = targetLanguageNames[targetLanguage] || targetLanguage;
    
    console.log('🌍 Target language:', targetLanguageName);
    console.log('🌍 Native language for translations:', nativeLanguage);

// Формируем промпт для Groq по структуре ROLE → CONTEXT → TASK → CONSTRAINTS → FORMAT
const systemPrompt = `### ROLE
You are an expert language learning content creator specializing in CEFR-aligned conversational dialogs. Your communication style is precise and pedagogically sound.

### CONTEXT
I am creating language learning materials for students at ${level} level (CEFR scale). The target audience is adult learners who want to practice realistic everyday conversations in ${targetLanguageName}. Their native language is ${nativeLanguage}.

The dialog should be about: "${topic}"
${words && words.length > 0 ? `It must naturally incorporate these vocabulary words: ${words.join(', ')}` : ''}

### TASK
Generate a realistic, natural conversation between two speakers with exactly ${replicas} exchanges (alternating turns).

Requirements for the dialog:
1. Vocabulary and grammar must match ${level} proficiency level
2. Formality level: ${tone}/10 (1=very casual everyday speech, 5=neutral, 10=very formal/official)
3. Conversation must feel authentic and useful for real-life situations
4. Include common idioms and expressions that native speakers actually use
${level.startsWith('B') || level.startsWith('C') ? `5. For ${level} level: use colloquialisms, informal speech patterns, specialized terms, complex structures` : ''}

For each dialog line, provide:
- Original text in ${targetLanguageName}
- Accurate translation in ${nativeLanguage}
- 4 multiple-choice options (1 correct + 3 plausible distractors)

Distractors should be:
- Grammatically plausible
- Similar vocabulary but wrong meaning
- Common learner mistakes
- NOT obviously absurd or nonsensical

### CONSTRAINTS
- Do NOT use markdown formatting (no \`\`\`json blocks)
- Do NOT add explanations or preambles
- Do NOT use obvious or joke distractors
- Use ONLY double quotes (") for JSON strings
- If quotes are needed inside text, use single quotes (')
- CRITICAL: All 3 arrays ("target", "native", "options") MUST have EXACTLY ${replicas} elements
- CRITICAL: NO extra elements beyond ${replicas} in any array
- CRITICAL: Each element in "options" must be an array of exactly 4 strings
- CRITICAL: NO null, undefined, or empty values anywhere in the JSON

### FORMAT
Return ONLY valid JSON in this exact structure:

{
  "target": ["First line in ${targetLanguageName}", "Second line in ${targetLanguageName}", ...],
  "native": ["First translation in ${nativeLanguage}", "Second translation in ${nativeLanguage}", ...],
  "options": [
    ["CORRECT translation", "Plausible wrong option 1", "Plausible wrong option 2", "Plausible wrong option 3"],
    ["CORRECT translation", "Plausible wrong option 1", "Plausible wrong option 2", "Plausible wrong option 3"],
    ...
  ]
}

CRITICAL: The first item in each "options" array MUST be identical to the corresponding "native" translation.

Example for Finnish/English, 2 exchanges:
{
  "target": ["Hei! Mitä sinä haluat?", "Haluaisin yhden kahvin, kiitos."],
  "native": ["Hi! What do you want?", "I would like one coffee, please."],
  "options": [
    ["Hi! What do you want?", "Goodbye!", "How are you?", "What time is it?"],
    ["I would like one coffee, please.", "I don't like coffee.", "Where is the cafe?", "I'm tired."]
  ]
}`;

    // Вызываем Groq API
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Generate a dialog about: ${topic}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error('❌ Groq error:', error);
      throw new Error('AI generation failed');
    }

    const groqData = await groqResponse.json();
    const aiContent = groqData.choices[0].message.content;

    console.log('✅ AI Response received');

    let content; 
    try {
      const cleanContent = aiContent.replace(/```json\n?|\n?```/g, "").trim();
      content = JSON.parse(cleanContent);

      // ========== ПОСТОБРАБОТКА: ДОБАВЛЯЕМ ТОЧКИ ==========
      // Добавляем точки к предложениям без пунктуации
      content.target = content.target.map((text: string) => {
        const trimmed = text.trim();
        // Если нет знака препинания в конце - добавляем точку
        if (!/[.!?]$/.test(trimmed)) {
          return trimmed + '.';
        }
        return trimmed;
      });

      content.native = content.native.map((text: string) => {
        const trimmed = text.trim();
        if (!/[.!?]$/.test(trimmed)) {
          return trimmed + '.';
        }
        return trimmed;
      });

      // Синхронизируем options[i][0] с обновлённым native[i]
      content.options = content.options.map((opts: string[], i: number) => {
        opts[0] = content.native[i];
        return opts;
      });
    // ====================================================

    // ========== ДОБАВИТЬ ЭТУ ВАЛИДАЦИЮ ==========
  // Проверяем длины массивов
  if (content.target.length !== content.native.length) {
    console.error('❌ Array length mismatch: target=' + content.target.length + ', native=' + content.native.length);
    throw new Error('Target and native arrays must have the same length');
  }

  if (content.target.length !== content.options.length) {
    console.error('❌ Array length mismatch: target=' + content.target.length + ', options=' + content.options.length);
    
    // Исправляем автоматически: обрезаем лишние или добавляем недостающие
    if (content.options.length > content.target.length) {
      console.log('⚠️ Trimming extra options elements');
      content.options = content.options.slice(0, content.target.length);
    } else {
      console.log('⚠️ Options array too short, cannot auto-fix');
      throw new Error('Options array is shorter than target array');
    }
  }

  // Проверяем на null в options
  const hasNulls = content.options.some((opt: any) => 
    opt === null || opt === undefined || (Array.isArray(opt) && opt.some((o: any) => o === null || o === undefined))
  );

  if (hasNulls) {
    console.error('❌ Options array contains null/undefined values');
    throw new Error('Options array contains invalid values');
  }

  // Проверяем что каждый элемент options - массив из 4 элементов
  const invalidOptions = content.options.some((opt: any) => !Array.isArray(opt) || opt.length !== 4);
  
  if (invalidOptions) {
    console.error('❌ Some options are not arrays of 4 elements');
    throw new Error('Each options element must be an array of exactly 4 strings');
  }

  console.log('✅ Validation passed: target=' + content.target.length + ', native=' + content.native.length + ', options=' + content.options.length);
  // ============================================
  
    } catch (parseError) {
      throw new Error("Failed to parse AI response: " + parseError.message);
    }

    // Сохраняем в БД используя supabaseAdmin (игнорируя RLS для системной записи)
    const { data: dialog, error: insertError } = await supabaseAdmin
      .from("dialogs")
      .insert({
        user_id: user.id,
        topic,
        level,
        target_language: targetLanguage,
        tone,
        replicas_count: content.target.length,
        required_words: words || null,
        content: content,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('✅ Dialog saved:', dialog.id);

    // Обновляем счётчики
try {
  const { error: counterError } = await supabaseAdmin.rpc('increment', {
    row_id: user.id,
    column_name: 'daily_generations_used',
  });

  if (counterError) {
    console.error('⚠️ Counter update failed:', counterError);
  } else {
    console.log('✅ Counter updated');
  }
} catch (err) {
  console.error('⚠️ Counter error:', err);
}

    return new Response(JSON.stringify({ success: true, data: { dialogId: dialog.id }, message: "Dialog created successfully", userId: user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});