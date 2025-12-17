const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function checkGroqHealth(): Promise<boolean> {
  console.log('[Groq Health] Starting check, API key present:', !!GROQ_API_KEY);
  console.log('[Groq Health] API key length:', GROQ_API_KEY?.length);
  
  if (!GROQ_API_KEY) {
    console.log('[Groq Health] FAILED: API key missing');
    return false;
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Reply with only "OK".' },
          { role: 'user', content: 'Respond with OK' },
        ],
        temperature: 0.1,
        max_tokens: 5,
      }),
    });

    console.log('[Groq Health] Response status:', res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.log('[Groq Health] FAILED: API error', res.status, errorText);
      return false;
    }

    const data = await res.json();
    console.log('[Groq Health] Response data:', JSON.stringify(data, null, 2));
    const hasContent = !!data.choices?.[0]?.message?.content;
    console.log('[Groq Health] Result:', hasContent);
    return hasContent;
  } catch (error) {
    console.error('[Groq Health] Exception:', error);
    return false;
  }
}

export async function queryGroq(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

