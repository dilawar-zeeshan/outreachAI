import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, anonKey);

export const sendChatMessage = async (message, history = []) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || anonKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    let errMsg = errorDetails;
    try {
      const parsed = JSON.parse(errorDetails);
      if (parsed.error) errMsg = parsed.error;
    } catch (e) {}
    throw new Error(errMsg);
  }

  return response.json();
};

export const sendEmail = async (email, subject, message, niche) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || anonKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ email, subject, message, niche }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    let errMsg = errorDetails;
    try {
      const parsed = JSON.parse(errorDetails);
      if (parsed.error) errMsg = parsed.error;
    } catch (e) {}
    throw new Error(errMsg);
  }

  return response.json();
};

export const getKnowledgeBase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || anonKey;

    const response = await fetch(`${supabaseUrl}/functions/v1/knowledge`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        const errorDetails = await response.text();
        let errMsg = errorDetails;
        try {
          const parsed = JSON.parse(errorDetails);
          if (parsed.error) errMsg = parsed.error;
        } catch (e) {}
        throw new Error(errMsg);
    }

    return response.json(); 
};

export const updateKnowledgeBase = async (documents) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || anonKey;

    const response = await fetch(`${supabaseUrl}/functions/v1/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ documents })
    });

    if (!response.ok) {
        const errorDetails = await response.text();
        let errMsg = errorDetails;
        try {
          const parsed = JSON.parse(errorDetails);
          if (parsed.error) errMsg = parsed.error;
        } catch (e) {}
        throw new Error(errMsg);
    }

    return response.json(); 
};

export const getEmailHistory = async (page = 0, limit = 20) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || anonKey;

    const response = await fetch(`${supabaseUrl}/functions/v1/email-history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to fetch history: ${err}`);
    }

    return response.json(); 
};
