import { env } from '../../config/env.js';
import { MockVoiceProvider } from './MockVoiceProvider.js';
import { RetellVoiceProvider } from './RetellVoiceProvider.js';
import { CustomAIProvider } from './CustomAIProvider.js';

let activeProvider = null;

export function getVoiceProvider() {
  if (!activeProvider) {
    if (env.VOICE_PROVIDER === 'retell') {
      activeProvider = new RetellVoiceProvider();
    } else if (env.VOICE_PROVIDER === 'custom') {
      activeProvider = new CustomAIProvider();
    } else {
      activeProvider = new MockVoiceProvider();
    }
  }
  return activeProvider;
}

