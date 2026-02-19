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
    const groqApiKey = Deno.env.get("GROQ_API_KEY") ?? "";

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

    // Validate Groq key
    if (!groqApiKey) {
      console.error("GROQ_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
You are an expert language learning content creator specializing in CEFR-aligned conversational dialogs and vocabulary acquisition. Your communication style is precise and pedagogically sound.

### CONTEXT
I am creating language learning materials for students at ${level} level (CEFR scale). The target audience is adult learners who want to practice realistic everyday conversations in ${targetLanguageName}. Their native language is ${nativeLanguage}.

The dialog theme is: "${topic}"

${words && words.length > 0 
  ? `### MANDATORY VOCABULARY
CRITICAL: You MUST use ALL of these words when creating collocations AND in the dialog:
${words.map((word, i) => `${i + 1}. "${word}"`).join('\n')}

Requirements for mandatory words:
- Create collocations that include these words
- These collocations MUST appear in the dialog
- The remaining collocations can be about the topic
` 
  : ''}

### TASK STRUCTURE
Your task has TWO stages:

STAGE 1: Generate ${vocabularyCount} common collocations related to "${topic}"

Requirements:
- Each collocation should be 2-3 words (NOT single words)
${words && words.length > 0 
  ? `- CRITICAL: At least ${words.length} collocations MUST include the mandatory words listed above` 
  : ''}
- Include diverse grammatical structures:
  * verb + noun (e.g., "clean the room")
  * adjective + noun (e.g., "wet mop")
  * adverb + verb (e.g., "carefully wipe")
  * noun + noun combinations
- Make them practical and commonly used in everyday speech
- Appropriate for ${level} proficiency level

STAGE 2: Create a realistic conversation using these collocations

Requirements:
- Exactly ${replicas} exchanges (alternating turns between two speakers)
- Use at least ${minUsedCollocations} of the generated collocations naturally in the dialog
${words && words.length > 0 
  ? `- CRITICAL: ALL collocations containing mandatory words MUST appear in the dialog` 
  : ''}
- Each collocation used in dialog must have an "example" field with the exact sentence from dialog

### REQUIREMENTS FOR DIALOG
1. Vocabulary and grammar must match ${level} proficiency level
2. Formality level: ${tone}/10 (1=very casual everyday speech, 5=neutral, 10=very formal/official)
3. Conversation must feel authentic and useful for real-life situations
4. Include common idioms and expressions that native speakers actually use
5. Collocations must appear naturally, not forced
${words && words.length > 0 
  ? `6. CRITICAL: Every mandatory word must appear in the dialog through its collocation` 
  : ''}
${level.startsWith('B') || level.startsWith('C') 
  ? `${words && words.length > 0 ? '7' : '6'}. For ${level} level: use colloquialisms, informal speech patterns, specialized terms, complex structures` 
  : ''}

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
- CRITICAL: The "vocabulary" array must have EXACTLY ${vocabularyCount} elements
- CRITICAL: Each vocabulary item used in dialog MUST have "example" field with exact sentence
${words && words.length > 0 
  ? `- CRITICAL: At least ${words.length} collocations must contain the mandatory words` 
  : ''}
- CRITICAL: NO null, undefined, or empty values anywhere in the JSON

### FORMAT
Return ONLY valid JSON in this exact structure:

{
  "vocabulary": [
    {
      "collocation": "collocation in ${targetLanguageName}",
      "translation": "translation in ${nativeLanguage}",
      "example": "exact sentence from dialog where this collocation appears"
    }
  ],
  "target": ["First line in ${targetLanguageName}", "Second line in ${targetLanguageName}", ...],
  "native": ["First translation in ${nativeLanguage}", "Second translation in ${nativeLanguage}", ...],
  "options": [
    ["CORRECT translation", "Plausible wrong option 1", "Plausible wrong option 2", "Plausible wrong option 3"],
    ["CORRECT translation", "Plausible wrong option 1", "Plausible wrong option 2", "Plausible wrong option 3"],
    ...
  ]
}

CRITICAL RULES:
- The first item in each "options" array MUST be identical to the corresponding "native" translation
- "vocabulary" array must have ${vocabularyCount} elements
- At least ${minUsedCollocations} collocations must have "example" field filled
${words && words.length > 0 
  ? `- ALL ${words.length} collocations containing mandatory words MUST have "example" field filled
- Collocations with mandatory words MUST actually appear in the "target" dialog lines` 
  : ''}
- Collocations with "example" field MUST actually appear in the "target" dialog lines

Example for Finnish/Russian, 2 exchanges, topic "Уборка"${words && words.length > 0 ? ', mandatory words: "keittiö", "lattia"' : ''}:
{
  "vocabulary": [
    {
      "collocation": "siivota keittiö",
      "translation": "убирать кухню",
      "example": "Pitää siivota keittiö tänään."
    },
    {
      "collocation": "likainen lattia",
      "translation": "грязный пол",
      "example": "Joo, lattia on aika likainen."
    },
    {
      "collocation": "märkä moppi",
      "translation": "влажная швабра",
      "example": ""
    }
  ],
  "target": ["Pitää siivota keittiö tänään.", "Joo, lattia on aika likainen."],
  "native": ["Нужно убрать кухню сегодня.", "Да, пол довольно грязный."],
  "options": [
    ["Нужно убрать кухню сегодня.", "Кухня очень чистая.", "Где находится кухня?", "Я не люблю готовить."],
    ["Да, пол довольно грязный.", "Нет, всё чисто.", "Пол новый.", "Я устал."]
  ]
}`;

    console.log("🤖 Calling Groq API...");
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a dialog about: ${topic}` },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("❌ Groq error:", errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqResponse.json();
    const aiContent = groqData.choices?.[0]?.message?.content ?? "";

    console.log("✅ AI response received");

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
      const { error: counterError } = await supabaseAdmin.rpc("increment", {
        row_id: user.id,
        column_name: "daily_generations_used",
      });
      if (counterError) console.warn("⚠️ Counter update failed:", counterError);
      else console.log("✅ Counter updated");
    } catch (e) {
      console.warn("⚠️ Counter RPC failed", e);
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