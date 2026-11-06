import { getStoreSettings, updateStoreSettings } from '../services/settingsService.js';

export async function getSettings(req, res, next) {
  try {
    const settings = await getStoreSettings();
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const updated = await updateStoreSettings(req.body);
    return res.status(200).json({
      success: true,
      message: 'Store settings updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

