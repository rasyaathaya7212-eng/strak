/**
 * LLM Provider Router
 * Routes LLM requests to the custom provider
 */

import { CustomProvider } from '../providers/custom';
import { Config, LLMRequest, LLMResponse } from '../types';

export class LLMRouter {
  private provider: CustomProvider;

  constructor(config: Config) {
    this.provider = new CustomProvider(config);
  }

  /**
   * Chat with LLM
   */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    return await this.provider.chat(request);
  }
}
