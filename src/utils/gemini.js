export const getGeminiApiKey = () => {
  return localStorage.getItem('salesmate_gemini_api_key') || '';
};

export const setGeminiApiKey = (key) => {
  if (key) {
    localStorage.setItem('salesmate_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('salesmate_gemini_api_key');
  }
};

export const isGeminiActive = () => {
  return !!getGeminiApiKey();
};

export const callGeminiApi = async (prompt, systemInstruction = '', returnJson = false) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('API Key is missing');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [
        {
          text: systemInstruction
        }
      ]
    };
  }

  if (returnJson) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text.trim();
};
