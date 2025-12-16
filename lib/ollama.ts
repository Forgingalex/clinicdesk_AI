export async function queryOllama(prompt: string): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.response?.trim() || null;
  } catch {
    return null;
  }
}



