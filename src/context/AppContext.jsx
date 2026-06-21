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
    return localStorage.getItem('salesmate_plan') || 'Pro'; // Basic, Pro, Growth
  });

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('salesmate_profile');
    return saved ? JSON.parse(saved) : {
      agencyName: 'Elite Properties',
      phone: '+966501234567',
      name: 'Salma Al-Harbi',
      email: 'salma@salesmate.ai'
    };
  });

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
    setUser({ email, role: email.includes('admin') ? 'admin' : 'salesperson' });
    return true;
  };

  const register = (email, password) => {
    // Mock register
    setUser({ email, role: 'salesperson' });
    setOnboarded(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setOnboarded(false);
  };

  return (
    <AppContext.Provider value={{
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
      isDetecting
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

