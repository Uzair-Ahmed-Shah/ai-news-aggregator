import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginView) {
        const response = await api.post('/auth/login', { email, password });
        login(response.data.token, { name: response.data.user.name, loggedIn: true });
        closeAuthModal();
      } else {
        const response = await api.post('/auth/register', { name, email, password });
        login(response.data.token, { name: response.data.user.name, loggedIn: true });
        closeAuthModal();
      }
    } catch (err) {
      const serverError = err.response?.data?.error || err.response?.data?.message;
      setError(serverError || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden relative">
        <button 
          onClick={closeAuthModal} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLoginView ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            {isLoginView 
              ? 'Enter your credentials to access your account' 
              : 'Join to save articles and get personalized content'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border-none rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-shadow outline-none"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border-none rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-shadow outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border-none rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-shadow outline-none"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 mt-6 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading 
                ? 'Processing...' 
                : (isLoginView ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError('');
              }}
              className="text-white font-medium hover:underline focus:outline-none"
            >
              {isLoginView ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
