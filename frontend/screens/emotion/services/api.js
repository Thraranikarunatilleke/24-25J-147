import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://192.168.148.243:5001';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  PREDICT_FACE: `${API_BASE_URL}/predict-face`,
  PREDICT_AUDIO: `${API_BASE_URL}/predict-audio`,
  PROCESS_VIDEO: `${API_BASE_URL}/process-video`,
};

const createFetchConfig = (body, isMultipart = false) => {
  const config = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    body,
  };

  // Android-specific headers
  if (Platform.OS === 'android') {
    config.headers['User-Agent'] = 'ReactNative/Android';
    // Don't set Content-Type for multipart on Android, let the browser set it
    if (!isMultipart) {
      config.headers['Content-Type'] = 'application/json';
    }
  } else {
    // iOS can handle Content-Type explicitly
    if (isMultipart) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
  }

  return config;
};

// Enhanced error handling for Android
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("HTTP ${response.status}: ${errorText}");
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    const text = await response.text();
    console.warn('Non-JSON response received:', text);
    return { error: 'Invalid response format' };
  }
};

export const checkServerHealth = async () => {
  try {
    console.log('Checking server health at:', API_ENDPOINTS.HEALTH);
    
    const response = await fetch(API_ENDPOINTS.HEALTH, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(Platform.OS === 'android' && { 'User-Agent': 'ReactNative/Android' }),
      },
      // Android-specific timeout
      timeout: Platform.OS === 'android' ? 10000 : 5000,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error("Health check failed: ${error.message}");
  }
};

export const predictFaceEmotion = async (imageUri) => {
  try {
    console.log('Predicting face emotion for:', imageUri);
    
    // Android-specific file validation
    if (Platform.OS === 'android') {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }
      console.log('File info:', fileInfo);
    }

    const formData = new FormData();
    
    // Platform-specific file append
    const fileObject = {
      uri: imageUri,
      name: 'image.jpg',
    };

    if (Platform.OS === 'android') {
      // Android requires explicit MIME type
      fileObject.type = 'image/jpeg';
    } else {
      // iOS can often determine type automatically
      fileObject.type = 'image/jpeg';
    }

    formData.append('image_file', fileObject);

    console.log('Sending request to:', API_ENDPOINTS.PREDICT_FACE);
    
    const response = await fetch(
      API_ENDPOINTS.PREDICT_FACE,
      createFetchConfig(formData, true)
    );

    const result = await handleResponse(response);
    console.log('Face prediction result:', result);
    
    return result;
  } catch (error) {
    console.error('Face emotion prediction failed:', error);
    throw new Error("Face prediction failed: ${error.message}");
  }
};

export const predictAudioEmotion = async (audioUri) => {
  try {
    console.log('Predicting audio emotion for:', audioUri);
    
    // Android-specific file validation
    if (Platform.OS === 'android') {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      console.log('Audio file info:', fileInfo);
    }

    const formData = new FormData();
    
    // Platform-specific audio file handling
    const fileObject = {
      uri: audioUri,
      name: 'audio.m4a',
    };

    if (Platform.OS === 'android') {
      // Android-specific MIME type for audio
      fileObject.type = 'audio/m4a';
    } else {
      fileObject.type = 'audio/m4a';
    }

    formData.append('audio_file', fileObject);

    console.log('Sending audio request to:', API_ENDPOINTS.PREDICT_AUDIO);
    
    const response = await fetch(
      API_ENDPOINTS.PREDICT_AUDIO,
      createFetchConfig(formData, true)
    );

    const result = await handleResponse(response);
    console.log('Audio prediction result:', result);
    
    return result;
  } catch (error) {
    console.error('Audio emotion prediction failed:', error);
    throw new Error("Audio prediction failed: ${error.message}");
  }
};

// Android-specific network debugging
export const debugNetworkConnection = async () => {
  console.log('=== Network Debug Info ===');
  console.log('Platform:', Platform.OS);
  console.log('API Base URL:', API_BASE_URL);
  
  try {
    // Test basic connectivity
    const startTime = Date.now();
    const response = await fetch(API_ENDPOINTS.HEALTH, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(Platform.OS === 'android' && { 'User-Agent': 'ReactNative/Android' }),
      },
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('Response status:', response.status);
    console.log('Response time:', responseTime, 'ms');
    console.log('Response headers:', JSON.stringify([...response.headers.entries()]));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      return { success: true, data, responseTime };
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return { success: false, error: errorText, responseTime };
    }
  } catch (error) {
    console.error('Network debug failed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  checkServerHealth,
  predictFaceEmotion,
  predictAudioEmotion,
  debugNetworkConnection,
};