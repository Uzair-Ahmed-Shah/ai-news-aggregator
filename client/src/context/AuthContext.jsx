import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [savedArticleIds, setSavedArticleIds] = useState([]);
  const [likedArticleIds, setLikedArticleIds] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          
          const response = await api.get('/auth/me');
          setUser({ ...response.data.user, loggedIn: true });
          
          // Fetch user activity (likes) and saved articles
          const [savedRes, activityRes] = await Promise.all([
            api.get('/user/saved'),
            api.get('/user/activity')
          ]);
          setSavedArticleIds(savedRes.data.map(a => a.id));
          setLikedArticleIds(activityRes.data.map(a => a.id));
          
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setSavedArticleIds([]);
          setLikedArticleIds([]);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData || { loggedIn: true });
    
    // Load lists immediately upon fresh login without reload
    try {
      const [savedRes, activityRes] = await Promise.all([
        api.get('/user/saved', { headers: { Authorization: `Bearer ${newToken}` } }),
        api.get('/user/activity', { headers: { Authorization: `Bearer ${newToken}` } })
      ]);
      setSavedArticleIds(savedRes.data.map(a => a.id));
      setLikedArticleIds(activityRes.data.map(a => a.id));
    } catch(e) {
      console.error('Failed to load user lists', e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSavedArticleIds([]);
    setLikedArticleIds([]);
  };

  const toggleSaveArticle = async (articleId) => {
    if (!user) return;
    try {
      const response = await api.post(`/articles/${articleId}/save`);
      if (response.data.saved) {
        setSavedArticleIds(prev => [...prev, articleId]);
      } else {
        setSavedArticleIds(prev => prev.filter(id => id !== articleId));
      }
      return response.data;
    } catch (err) {
      console.error("Failed to toggle save", err);
    }
  };

  const toggleLikeArticle = async (articleId) => {
    if (!user) return;
    try {
      const response = await api.post(`/articles/${articleId}/like`);
      if (response.data.liked) {
        setLikedArticleIds(prev => [...prev, articleId]);
      } else {
        setLikedArticleIds(prev => prev.filter(id => id !== articleId));
      }
      return response.data;
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
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
      toggleNewsletterOptIn,
      savedArticleIds, likedArticleIds, toggleSaveArticle, toggleLikeArticle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
