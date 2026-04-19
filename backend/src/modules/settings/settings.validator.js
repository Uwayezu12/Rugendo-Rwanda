import { z } from 'zod';
import { ALLOWED_SETTINGS_KEYS } from './settings.service.js';

export function validateSettingKey(key) {
  if (!ALLOWED_SETTINGS_KEYS.includes(key)) {
    return `Unknown setting key: "${key}". Allowed keys: ${ALLOWED_SETTINGS_KEYS.join(', ')}.`;
  }
  return null;
}

export const settingValueSchema = z.object({
  value: z.string({ required_error: 'value is required' }).min(1, 'value must not be empty'),
});
