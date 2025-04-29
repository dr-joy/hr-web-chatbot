import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { createModelProvider } from './model-config';

const modelConfig = {
  provider: (process.env.MODEL_PROVIDER as 'openai' | 'ollama') || 'ollama',
  openaiApiKey: process.env.OPENAI_API_KEY,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  ollamaModel: process.env.OLLAMA_MODEL,
};

const modelProvider = createModelProvider(modelConfig);

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
    languageModels: {
      'chat-model': modelProvider,
      'chat-model-reasoning': wrapLanguageModel({
        model: modelProvider,
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),
      'title-model': modelProvider,
      'artifact-model': modelProvider,
    },
  });
