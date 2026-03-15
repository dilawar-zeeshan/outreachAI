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

export const getEmailHistory = async (page = 0, limit = 20, search = '', status = '') => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || anonKey;

    let url = `${supabaseUrl}/functions/v1/email-history?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }

    const response = await fetch(url, {
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

export const scrapeLeads = async (keyword, city, country) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || anonKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/scrape-leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ keyword, city, country }),
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

export const getTemplates = async () => {
  const { data, error } = await supabase
    .from('outreach_templates')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const saveTemplate = async (template) => {
  const { data, error } = await supabase
    .from('outreach_templates')
    .upsert([template])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteTemplate = async (id) => {
  const { error } = await supabase
    .from('outreach_templates')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const queueEmails = async (items) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || anonKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/queue-emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
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

export const processQueue = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || anonKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/process-queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    return null; // Ignore errors quietly if nothing to process
  }

  return response.json();
};
