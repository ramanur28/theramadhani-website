import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../public/admin/ai-studio.js';

// Access the initialized DecapAIStudio instance
const studio = (typeof window !== 'undefined' && (window as any).DecapAIStudio) || (globalThis as any).DecapAIStudio;

describe('AI Client & Model Configurations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    studio.state.provider = 'openai';
    studio.state.openaiKey = 'test-openai-key';
    studio.state.geminiKey = 'test-gemini-key';
    studio.state.openaiModel = 'gpt-6-luna';
    studio.state.geminiModel = 'gemini-3.8-flash';
  });

  describe('OpenAI Model Payload Formatting & Temperature Rules', () => {
    it('omits temperature when calling reasoning model gpt-6-luna', async () => {
      let interceptedBody: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        interceptedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Test response from GPT-6 Luna' } }],
          }),
        };
      });

      studio.state.openaiModel = 'gpt-6-luna';
      const result = await studio.callOpenAI({ prompt: 'Test prompt' });

      expect(result).toBe('Test response from GPT-6 Luna');
      expect(interceptedBody).not.toBeNull();
      expect(interceptedBody.model).toBe('gpt-6-luna');
      // Crucial requirement: Reasoning models must not pass temperature
      expect(interceptedBody.temperature).toBeUndefined();
    });

    it('omits temperature when calling gpt-5.6-luna', async () => {
      let interceptedBody: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        interceptedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response from GPT-5.6 Luna' } }],
          }),
        };
      });

      studio.state.openaiModel = 'gpt-5.6-luna';
      await studio.callOpenAI({ prompt: 'Test prompt' });

      expect(interceptedBody.model).toBe('gpt-5.6-luna');
      expect(interceptedBody.temperature).toBeUndefined();
    });

    it('formats gpt-5.4 with model and temperature: 0.6', async () => {
      let interceptedBody: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        interceptedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response from GPT-5.4' } }],
          }),
        };
      });

      studio.state.openaiModel = 'gpt-5.4';
      await studio.callOpenAI({ prompt: 'Test prompt' });

      expect(interceptedBody.model).toBe('gpt-5.4');
      expect(interceptedBody.temperature).toBe(0.6);
    });

    it('includes temperature: 0.6 when calling gpt-5.4-mini', async () => {
      let interceptedBody: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        interceptedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response from GPT-5.4 Mini' } }],
          }),
        };
      });

      studio.state.openaiModel = 'gpt-5.4-mini';
      await studio.callOpenAI({ prompt: 'Test prompt' });

      expect(interceptedBody.model).toBe('gpt-5.4-mini');
      expect(interceptedBody.temperature).toBe(0.6);
    });

    it('includes temperature: 0.6 when calling gpt-4o-mini', async () => {
      let interceptedBody: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        interceptedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response from GPT-4o Mini' } }],
          }),
        };
      });

      studio.state.openaiModel = 'gpt-4o-mini';
      await studio.callOpenAI({ prompt: 'Test prompt' });

      expect(interceptedBody.model).toBe('gpt-4o-mini');
      expect(interceptedBody.temperature).toBe(0.6);
    });

    it('handles image_url for multimodal requests in OpenAI format', async () => {
      let interceptedBody: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        interceptedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Vision analysis output' } }],
          }),
        };
      });

      studio.state.openaiModel = 'gpt-4o';
      await studio.callOpenAI({
        prompt: 'Analyze this image',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });

      expect(interceptedBody.messages[0].content).toHaveLength(2);
      expect(interceptedBody.messages[0].content[1].type).toBe('image_url');
      expect(interceptedBody.messages[0].content[1].image_url.url).toContain('data:image/png;base64');
    });

    it('throws error when OpenAI API Key is missing', async () => {
      studio.state.openaiKey = '';
      await expect(studio.callOpenAI({ prompt: 'Hello' })).rejects.toThrow('OpenAI API Key belum diisi');
    });
  });

  describe('Google Gemini API Client', () => {
    it('formats Gemini 3.8 Flash payload with inline_data for images', async () => {
      let interceptedBody: any = null;
      let interceptedUrl: any = null;

      global.fetch = vi.fn().mockImplementation(async (url, opts) => {
        interceptedUrl = url;
        interceptedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Gemini response text' }] } }],
          }),
        };
      });

      studio.state.provider = 'gemini';
      studio.state.geminiModel = 'gemini-3.8-flash';
      const result = await studio.callGemini({
        prompt: 'Test Gemini Prompt',
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
        mimeType: 'image/jpeg',
      });

      expect(result).toBe('Gemini response text');
      expect(interceptedUrl).toContain('gemini-3.8-flash');
      expect(interceptedBody.contents[0].parts[1].inline_data.data).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB');
      expect(interceptedBody.contents[0].parts[1].inline_data.mime_type).toBe('image/jpeg');
    });

    it('throws error when Gemini API Key is missing', async () => {
      studio.state.geminiKey = '';
      await expect(studio.callGemini({ prompt: 'Hello' })).rejects.toThrow('Google Gemini API Key belum diisi');
    });
  });

  describe('Model Badge Name Resolution', () => {
    it('returns human-friendly names for models including GPT-5.4, GPT-5.4 Mini, and Gemini 3.8 Flash', () => {
      studio.state.provider = 'openai';
      studio.state.openaiModel = 'gpt-6-luna';
      expect(studio.getActiveModelName()).toBe('GPT-6 Luna');

      studio.state.openaiModel = 'gpt-5.6-luna';
      expect(studio.getActiveModelName()).toBe('GPT-5.6 Luna');

      studio.state.openaiModel = 'gpt-5.4';
      expect(studio.getActiveModelName()).toBe('GPT-5.4');

      studio.state.openaiModel = 'gpt-5.4-mini';
      expect(studio.getActiveModelName()).toBe('GPT-5.4 Mini');

      studio.state.openaiModel = 'gpt-4o-mini';
      expect(studio.getActiveModelName()).toBe('GPT-4o Mini');

      studio.state.openaiModel = 'gpt-4o';
      expect(studio.getActiveModelName()).toBe('GPT-4o');

      studio.state.openaiModel = 'custom-llm-v1';
      expect(studio.getActiveModelName()).toBe('custom-llm-v1');

      studio.state.provider = 'gemini';
      studio.state.geminiModel = 'gemini-3.8-flash';
      expect(studio.getActiveModelName()).toBe('Gemini 3.8 Flash');

      studio.state.geminiModel = 'gemini-3.8-pro';
      expect(studio.getActiveModelName()).toBe('Gemini 3.8 Pro');
    });
  });
});
