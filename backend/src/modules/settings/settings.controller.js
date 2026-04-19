import { success, badRequest, serverError } from '../../utils/apiResponse.js';
import { getAllSettings, getPublicAuthPanelData, upsertSetting } from './settings.service.js';
import { validateSettingKey, settingValueSchema } from './settings.validator.js';

export async function getSettingsHandler(_req, res) {
  try {
    const data = await getAllSettings();
    return success(res, data, 'Platform settings');
  } catch (err) {
    console.error('getSettingsHandler:', err);
    return serverError(res, 'Could not load platform settings');
  }
}

export async function getPublicAuthPanelHandler(_req, res) {
  try {
    const data = await getPublicAuthPanelData();
    return success(res, data, 'Auth panel data');
  } catch (err) {
    console.error('getPublicAuthPanelHandler:', err);
    return serverError(res, 'Could not load auth panel data');
  }
}

export async function updateSettingHandler(req, res) {
  try {
    const { key } = req.params;

    const keyError = validateSettingKey(key);
    if (keyError) return badRequest(res, keyError);

    const parsed = settingValueSchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Validation failed', parsed.error.flatten().fieldErrors);
    }

    const row = await upsertSetting(key, parsed.data.value);
    return success(res, { key: row.key, value: row.value, updatedAt: row.updatedAt }, 'Setting updated');
  } catch (err) {
    console.error('updateSettingHandler:', err);
    return serverError(res, 'Could not update setting');
  }
}
