import axios from 'axios';

// Backend URL - since this runs on the same computer, use localhost
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const recognizeSign = async (frameBase64, signLanguage, outputLanguage) => {
  try {
    const response = await axios.post(`${API_URL}/recognize`, {
      frame: frameBase64,
      sign_language: signLanguage,
      output_language: outputLanguage,
      recent_signs: []
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Recognition error:', error.message);
    throw new Error(error.response?.data?.detail || error.message || 'Recognition failed');
  }
};

export const testConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    throw new Error('Backend connection failed');
  }
};