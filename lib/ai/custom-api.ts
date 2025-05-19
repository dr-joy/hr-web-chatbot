import { streamText } from 'ai';

export async function callCustomApi(prompt: string) {
  const response = await fetch('http://192.168.4.24:8001/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch response from custom API');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No reader available');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);
                const data = JSON.parse(jsonStr);
                controller.enqueue(data.text);
              } catch (e) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
} 