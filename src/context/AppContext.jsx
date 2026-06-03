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
      setProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
