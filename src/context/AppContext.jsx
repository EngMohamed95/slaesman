import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('salesmate_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem('salesmate_onboarded') === 'true';
  });
  const [plan, setPlan] = useState(() => {
    return localStorage.getItem('salesmate_plan') || 'Trial'; // Default to Trial for free trial
  });

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('salesmate_profile');
    return saved ? JSON.parse(saved) : {
      agencyName: 'Elite Properties',
      phone: '+966501234567',
      name: 'Salma Al-Harbi',
      email: 'salma@adtodeal.com'
    };
  });

  // Global Theme Mode State ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('salesmate_theme') || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('salesmate_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Currency State
  const [selectedCurrency, setSelectedCurrency] = useState('SAR');
  const [detectedCountry, setDetectedCountry] = useState('المملكة العربية السعودية 🇸🇦');
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsDetecting(true);
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;
          const countryName = data.country_name;
          const countryFlag = data.country_emoji || '';
          setDetectedCountry(`${countryName} ${countryFlag}`);
          
          if (countryCode === 'SA') setSelectedCurrency('SAR');
          else if (countryCode === 'AE') setSelectedCurrency('AED');
          else if (countryCode === 'EG') setSelectedCurrency('EGP');
          else if (countryCode === 'JO') setSelectedCurrency('JOD');
          else setSelectedCurrency('USD');
        } else {
          throw new Error('Fallback to timezone');
        }
      } catch (err) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.includes('Riyadh') || tz.includes('Qatar') || tz.includes('Kuwait')) {
          setSelectedCurrency('SAR');
          setDetectedCountry('المملكة العربية السعودية 🇸🇦');
        } else if (tz.includes('Dubai')) {
          setSelectedCurrency('AED');
          setDetectedCountry('الإمارات العربية المتحدة 🇦🇪');
        } else if (tz.includes('Cairo')) {
          setSelectedCurrency('EGP');
          setDetectedCountry('جمهورية مصر العربية 🇪🇬');
        } else if (tz.includes('Amman')) {
          setSelectedCurrency('JOD');
          setDetectedCountry('الأردن 🇯🇴');
        } else {
          setSelectedCurrency('USD');
          setDetectedCountry('دولي 🇺🇸');
        }
      } finally {
        setIsDetecting(false);
      }
    };
    detectLocation();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('salesmate_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('salesmate_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('salesmate_onboarded', onboarded);
  }, [onboarded]);

  useEffect(() => {
    localStorage.setItem('salesmate_plan', plan);
  }, [plan]);

  useEffect(() => {
    localStorage.setItem('salesmate_profile', JSON.stringify(profile));
  }, [profile]);

  const login = (email, password) => {
    // Mock login
    const matchedRole = email.includes('admin') ? 'admin' : 'salesperson';
    setUser({ email, role: matchedRole });
    
    // Fetch saved plan or default
    const defaultPlan = matchedRole === 'admin' ? 'Growth' : 'Trial';
    const savedUserPlan = localStorage.getItem(`salesmate_plan_${email}`) || defaultPlan;
    setPlan(savedUserPlan);
    return true;
  };

  const register = (email, password, chosenPlan = 'Trial') => {
    // Mock register
    setUser({ email, role: email.includes('admin') ? 'admin' : 'salesperson' });
    setPlan(chosenPlan);
    localStorage.setItem(`salesmate_plan_${email}`, chosenPlan);
    setOnboarded(false);
    // Reset query count for new basic users
    localStorage.setItem('salesmate_ai_query_count', '0');
    return true;
  };

  const logout = () => {
    setUser(null);
    setOnboarded(false);
  };

  const validateFeatureAccess = (featureKey) => {
    // Admin bypass
    if (user?.role === 'admin') return true;
    
    // admin feature is locked for everyone else
    if (featureKey === 'admin') return false;
    
    if (plan === 'Basic') {
      // Basic unlocks only dashboard, crm, tasks, aiAssistant, whatsapp, reports, settings
      const basicPages = ['dashboard', 'crm', 'tasks', 'aiAssistant', 'whatsapp', 'reports', 'settings'];
      return basicPages.includes(featureKey);
    }
    
    if (plan === 'Pro') {
      // Pro unlocks everything except campaigns and admin
      return featureKey !== 'campaigns';
    }
    
    if (plan === 'Growth') {
      // Growth unlocks everything except admin panel which requires admin role
      return true;
    }

    if (plan === 'Trial') {
      // Trial behaves like Basic: restricts socialCreator and campaigns
      const basicPages = ['dashboard', 'crm', 'tasks', 'aiAssistant', 'whatsapp', 'reports', 'settings'];
      return basicPages.includes(featureKey);
    }
    
    return true;
  };

  const checkAILimit = () => {
    if (plan !== 'Basic') return { allowed: true };
    const count = Number(localStorage.getItem('salesmate_ai_query_count') || 0);
    if (count >= 3) {
      return { allowed: false, count };
    }
    return { allowed: true, count };
  };

  const incrementAICount = () => {
    if (plan !== 'Basic') return;
    const count = Number(localStorage.getItem('salesmate_ai_query_count') || 0);
    localStorage.setItem('salesmate_ai_query_count', (count + 1).toString());
  };

  const resetAICount = () => {
    localStorage.setItem('salesmate_ai_query_count', '0');
  };

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      user,
      setUser,
      login,
      register,
      logout,
      onboarded,
      setOnboarded,
      plan,
      setPlan,
      profile,
      setProfile,
      selectedCurrency,
      setSelectedCurrency,
      detectedCountry,
      setDetectedCountry,
      isDetecting,
      validateFeatureAccess,
      checkAILimit,
      incrementAICount,
      resetAICount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

