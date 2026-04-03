import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          
          const response = await api.get('/auth/me');
          setUser({ ...response.data.user, loggedIn: true });
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData || { loggedIn: true });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const toggleNewsletterOptIn = async () => {
    if (!user) return;
    try {
      const response = await api.patch('/auth/newsletter', { optIn: !user.newsletterOptIn });
      setUser(prevUser => ({
        ...prevUser,
        newsletterOptIn: response.data.newsletterOptIn !== undefined 
          ? response.data.newsletterOptIn 
          : !prevUser.newsletterOptIn
      }));
      return response.data;
    } catch (error) {
      console.error("Error toggling newsletter:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, login, logout, loading, 
      isAuthModalOpen, openAuthModal, closeAuthModal,
      toggleNewsletterOptIn
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
