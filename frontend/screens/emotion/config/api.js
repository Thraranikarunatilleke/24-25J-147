import Constants from 'expo-constants';

export const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://192.168.1.101:5001';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  PREDICT_FACE: `${API_BASE_URL}/predict-face`,
  PREDICT_AUDIO: `${API_BASE_URL}/predict-audio`,
  PROCESS_VIDEO: `${API_BASE_URL}/process-video`,
};

export const checkServerHealth = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.HEALTH);
    return await response.json();
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  checkServerHealth
};