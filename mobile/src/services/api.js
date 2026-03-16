import axios from 'axios';

// Your computer's IP address on the local network
const API_URL = process.env.BACKEND_URL || 'http://172.24.65.238:8000';

console.log('Connecting to backend at:', API_URL);

export const recognizeSign = async (frameBase64, signLanguage, outputLanguage) => {
  try {
    const response = await axios.post(`${API_URL}/recognize`, {
      frame: frameBase64,
      sign_language: signLanguage,
      output_language: outputLanguage,
      recent_signs: []
    }, {
      timeout: 15000, // Increased timeout to 15s for better reliability on local networks
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Recognition error: Request timed out after 15s');
    } else {
      console.error('Recognition error:', error.message);
    }
    return { text: null, confidence: 0 };
  }
};
