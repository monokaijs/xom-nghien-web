import { useState, useEffect } from 'react';

interface ContactConfig {
  email: string;
  phone: string;
  supportHours: string;
  responseTime: string;
  socialMedia: {
    discord: string;
    facebook: string;
    telegram: string;
  };
}

interface ContactResponse {
  contact: ContactConfig;
}

export function useContactConfig() {
  const [config, setConfig] = useState<ContactConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/contact');
        if (!response.ok) {
          throw new Error('Failed to fetch contact config');
        }
        const data: ContactResponse = await response.json();
        setConfig(data.contact);
      } catch (err) {
        console.error('Error fetching contact config:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback config
        setConfig({
          email: 'teamthecheckmate@gmail.com',
          phone: '',
          supportHours: '24/7',
          responseTime: 'Trong vòng 24 giờ',
          socialMedia: {
            discord: '',
            facebook: '',
            telegram: ''
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, isLoading, error };
}
