import { streamText } from 'ai';

export async function callCustomApi(prompt: string) {
  const response = await fetch('https://n8n.drjoy.vn/webhook-test/chat-input', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatInput: prompt,
      sessionId: 'test',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch response from custom API');
  }

  // Assuming the API returns JSON
  const data = await response.json();
  return data;
}


