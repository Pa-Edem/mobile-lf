// supabase/functions/generate-dialog/index.ts
// Endpoint URL: // https://cfyknugijnlpapvyohhu.supabase.co/functions/v1/generate-dialog

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

console.log("Function generate-dialog starting");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body first
const body = await req.json();
console.log("📦 Request received");

// Try to get token from header OR from body (fallback for React Native)
let token = "";
const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
if (authHeader) {
  token = authHeader.replace(/^Bearer\s+/i, "").trim();
  console.log("🔑 Token from header");
} else if (body.token) {
  token = body.token;
  console.log("🔑 Token from body (React Native workaround)");
}

if (!token) {
  console.error("❌ No token provided (neither in header nor body)");
  return new Response(JSON.stringify({ error: "No authorization token" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

console.log("✅ Token received (length:", token.length, ")");

    // Create a client with the auth context of the incoming request
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    console.log("🔍 Checking auth with client...");
    console.log("  - supabaseUrl:", supabaseUrl);
    console.log("  - anonKey (first 20):", anonKey.substring(0, 20));
    console.log("  - token (first 20):", token.substring(0, 20));

    // Verify token & get user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    console.log("📊 Auth result:");
    console.log("  - user:", user ? `✅ ${user.id}` : "❌ null");
    console.log("  - error:", userError ? `❌ ${userError.message}` : "✅ none");

    if (userError) {
      console.error("❌ Full error details:", JSON.stringify(userError, null, 2));
    }

    if (userError || !user?.id) {
      console.error("❌ Auth verification failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Invalid User Token", details: userError?.message  }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ User verified:", user.id);

    // Parse body
    // const body = await req.json();
    // console.log("📦 Request body:", body);
    
    const { topic, words, level, tone, replicas, targetLanguage, uiLanguage } = body;

    // Validate Gemini key
if (!geminiApiKey) {
  console.error("GEMINI_API_KEY not configured");
  return new Response(JSON.stringify({ error: "AI key not configured" }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

console.log("✅ Using Gemini 2.5 Flash");

    // Получаем профиль для языков
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('ui_language')
      .eq('id', user.id)
      .single();

    const userUiLanguage = uiLanguage || profile?.ui_language || 'en';
    const languageNames: Record<string, string> = {
      'en': 'English',
      'ru': 'Russian',
    };
    const nativeLanguage = languageNames[userUiLanguage] || 'English';
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

// Build prompt
const vocabularyCount = Math.ceil(replicas * 1.5);
const minUsedCollocations = Math.floor(vocabularyCount * 0.67);

const systemPrompt = `### ROLE

You are an expert linguist and Senior Instructional Designer. Your specialty is creating educational content that complies with CEFR standards and combines grammatical accuracy with natural spoken language.

### CONTEXT

Creating an interactive learning module:

- Level: ${level}
- Language pair: ${targetLanguageName} (target) → ${nativeLanguage} (native)
- Topic: "${topic}"
- Audience: Practice-oriented adult learners
- Formality: ${tone}/10 (1 = very casual, 5 = neutral, 10 = very formal/official)

### TASK & LOGIC

Complete the task, strictly adhering to the chain-of-thought proportions:

1. **Vocabulary Generation:** Generate exactly ${vocabularyCount} thematic collocations (2-4 words). This is an extended list for vocabulary expansion.
2. **Dialogue Creation:** Write a dialogue with exactly ${replicas} phrases between two speakers.
3. **Vocabulary Integration:** Naturally use at least ${minUsedCollocations} collocations from the generated list in the dialogue. The remaining phrases from the vocabulary remain without examples.
4. **Testing:** Create 4 translation options (1 correct + 3 distractors) for each phrase.

### LINGUISTIC & DYNAMIC CONSTRAINTS

- Line Length: Each phrase should be 1-2 sentences (5-15 words for natural flow)
- Difficulty: Strictly correspond to ${level} level. For B2+, use common phrases and idioms; for A2, use basic structures
- Formality: Match tone level ${tone}/10 in vocabulary choice and grammar
- Distractors: Should appear logical and plausible. Avoid absurd or obviously stupid options
  ${words && words.length > 0
  ? `- Required Words: Integrate these words into collocations and dialogue: ${words.join(', ')}`
  : ''}

### TECHNICAL CONSTRAINTS

- Format: Pure JSON only. No introduction, code blocks, or trailing text
- Validation: The first element in each "options" array is always the correct answer (matching "native")
- Characters: Double quotes only ("). Within text, use single quotes (')
- Arrays: All arrays must have EXACT counts specified below

### OUTPUT FORMAT

CRITICAL VALIDATION:

- "vocabulary" array: EXACTLY ${vocabularyCount} elements
- "target" array: EXACTLY ${replicas} elements
- "native" array: EXACTLY ${replicas} elements
- "options" array: EXACTLY ${replicas} elements (each with 4 strings)
- At least ${minUsedCollocations} vocabulary items must have "example" field filled with exact sentence from dialogue

Return ONLY this JSON structure:

{
"vocabulary": [
{
"collocation": "phrase in ${targetLanguageName}",
"translation": "translation in ${nativeLanguage}",
"example": "exact sentence from dialogue where this appears (empty string '' if not used)"
}
],
"target": ["Phrase 1 in ${targetLanguageName}", "Phrase 2 in ${targetLanguageName}", ...],
"native": ["Translation 1 in ${nativeLanguage}", "Translation 2 in ${nativeLanguage}", ...],
"options": [
["CORRECT translation", "Plausible wrong 1", "Plausible wrong 2", "Plausible wrong 3"],
["CORRECT translation", "Plausible wrong 1", "Plausible wrong 2", "Plausible wrong 3"],
...
]
}
`;

    console.log("🤖 Calling Gemini 2.5 Flash API...");
    const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  }
);

    if (!geminiResponse.ok) {
  const errText = await geminiResponse.text();
  console.error("❌ Gemini error:", errText);
  return new Response(JSON.stringify({ error: "AI generation failed" }), {
    status: 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const geminiData = await geminiResponse.json();
const aiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

if (!aiContent) {
  console.error("❌ Empty response from Gemini");
  return new Response(JSON.stringify({ error: "Empty AI response" }), {
    status: 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

console.log("✅ Gemini response received");

    // Parse AI JSON
    const cleanContent = aiContent.replace(/```json\n?|\n?```/g, "").trim();
    let content;
    try {
      content = JSON.parse(cleanContent);

      // Add punctuation
      content.target = content.target.map((text: string) => {
        const trimmed = text.trim();
        if (!/[.!?]$/.test(trimmed)) return trimmed + '.';
        return trimmed;
      });

      content.native = content.native.map((text: string) => {
        const trimmed = text.trim();
        if (!/[.!?]$/.test(trimmed)) return trimmed + '.';
        return trimmed;
      });

      // Sync options[i][0] with native[i]
      content.options = content.options.map((opts: string[], i: number) => {
        opts[0] = content.native[i];
        return opts;
      });
    } catch (e) {
      console.error("❌ Failed to parse AI response", e);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validation
    const { vocabulary, target, native, options } = content;

    if (!Array.isArray(vocabulary) || !Array.isArray(target) || !Array.isArray(native) || !Array.isArray(options)) {
      throw new Error('Invalid content structure');
    }

    console.log("✅ Validation passed");

    // Use admin client for DB insert
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: dialog, error: insertError } = await supabaseAdmin
      .from("dialogs")
      .insert({
        user_id: user.id,
        topic,
        level,
        tone,
        target_language: targetLanguage,
        replicas_count: target.length,
        required_words: words || null,
        vocabulary_count: vocabulary.length,
        content: content,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ DB insert error:", insertError);
      throw insertError;
    }

    console.log("✅ Dialog saved:", dialog.id);

    // Update counters
try {
  // Сначала проверяем существует ли запись
  const { data: existingCounter } = await supabaseAdmin
    .from('usage_counters')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (!existingCounter) {
    // Создаём новую запись
    console.log('📝 Creating usage_counters for user:', user.id);
    await supabaseAdmin.from('usage_counters').insert({
      user_id: user.id,
      daily_generations_used: 1,
      daily_pro_features_used: 0,
      total_dialogs_count: 1,
      carry_over_generations: 0,
      carry_over_pro_features: 0,
    });
    console.log('✅ usage_counters created');
  } else {
    // Обновляем существующую через RPC
    const { error: counterError } = await supabaseAdmin.rpc("increment", {
      row_id: user.id,
      column_name: "daily_generations_used",
    });
    if (counterError) {
      console.warn("⚠️ Counter update failed:", counterError);
    } else {
      console.log("✅ Counter updated");
    }
  }
} catch (e) {
  console.warn("⚠️ Counter update failed", e);
}

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { dialogId: dialog.id }, 
        message: "Dialog created successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("💥 Function Error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});