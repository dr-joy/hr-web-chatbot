import { openai } from '@ai-sdk/openai';
import { Ollama } from 'ollama';
import type {
  LanguageModelV1,
  LanguageModelV1Prompt,
  LanguageModelV1StreamPart,
} from 'ai';

export type ModelProvider = 'openai' | 'ollama';

export interface ModelConfig {
  provider: ModelProvider;
  openaiApiKey?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

// Create Ollama client
export const createOllamaClient = (config: ModelConfig) => {
  return new Ollama({
    host: config.ollamaBaseUrl || 'http://localhost:11434',
  });
};

interface Message {
  role: string;
  content: string;
}

// Convert LanguageModelV1Prompt to string
const promptToString = (prompt: LanguageModelV1Prompt): string => {
  if (typeof prompt === 'string') return prompt;
  if (Array.isArray(prompt)) {
    return prompt
      .map((p) => {
        if (typeof p === 'string') return p;
        if ('role' in p && 'content' in p) {
          return `${(p as Message).role}: ${(p as Message).content}`;
        }
        return JSON.stringify(p);
      })
      .join('\n');
  }
  return JSON.stringify(prompt);
};

// Create model provider based on configuration
export const createModelProvider = (config: ModelConfig): LanguageModelV1 => {
  if (config.provider === 'ollama') {
    const ollama = createOllamaClient(config);
    const model = config.ollamaModel || 'llama2';

    return {
      specificationVersion: 'v1',
      provider: 'ollama',
      modelId: model,
      defaultObjectGenerationMode: 'json',
      doGenerate: async ({ prompt }) => {
        const promptStr = promptToString(prompt);
        const response = await ollama.generate({
          model,
          prompt: promptStr,
        });
        return {
          text: response.response,
          usage: { promptTokens: 0, completionTokens: 0 },
          finishReason: 'stop',
          rawCall: { rawPrompt: prompt, rawSettings: {} },
        };
      },
      doStream: async ({ prompt }) => {
        const promptStr = promptToString(prompt);
        const stream = await ollama.generate({
          model,
          prompt: promptStr,
          stream: true,
        });

        // Convert Ollama stream to ReadableStream
        const readableStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                controller.enqueue({
                  type: 'text-delta',
                  textDelta: chunk.response,
                } as LanguageModelV1StreamPart);
              }
              controller.enqueue({
                type: 'finish',
                finishReason: 'stop',
                usage: { promptTokens: 0, completionTokens: 0 },
              } as LanguageModelV1StreamPart);
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });

        return {
          stream: readableStream,
          rawCall: { rawPrompt: prompt, rawSettings: {} },
        };
      },
    };
  } else {
    return openai('gpt-4-turbo-preview');
  }
};
