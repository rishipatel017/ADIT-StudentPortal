import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  validateToken: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuthCookie = (newToken: string | null) => {
    if (typeof document === 'undefined') return;
    if (!newToken) {
      document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax';
      return;
    }
    document.cookie = `authToken=${encodeURIComponent(newToken)}; Path=/; Max-Age=604800; SameSite=Lax`;
  };

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    const bootstrap = async () => {
      if (storedToken && storedUser) {
        setToken(storedToken);
        setAuthCookie(storedToken);

        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
          console.error('Token validation failed:', error);
          setUser(null);
          setToken(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setAuthCookie(null);
          sessionStorage.clear();
        }
      }
      setIsLoading(false);
    };

    bootstrap();
  }, []);

  // Periodic token validation (every 5 minutes)
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (error) {
        console.error('Token validation failed:', error);
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setAuthCookie(null);
        sessionStorage.clear();
        clearInterval(interval);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [token]);

  const login = async (email: string, password: string, role?: string) => {
    try {
      setIsLoading(true);
      const data = await authService.login({ email, password, role });
      
      if (data.access_token && data.user) {
        const { access_token, user: userData } = data;
        
        setToken(access_token);
        setUser(userData);
        
        localStorage.setItem('authToken', access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        setAuthCookie(access_token);
        
        // Redirect based on role
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const next = params.get('next');
          if (next && next.startsWith('/dashboard')) {
            window.location.href = next;
          } else {
            const rolePath = userData.role.toLowerCase();
            window.location.href = `/dashboard/${rolePath}`;
          }
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear client-side session
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setAuthCookie(null);
      sessionStorage.clear();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  };

  const register = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      
      if (response.access_token && response.user) {
        const { access_token, user: userData } = response;
        
        setToken(access_token);
        setUser(userData);
        
        localStorage.setItem('authToken', access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (typeof window !== 'undefined') {
          window.location.href = `/dashboard`;
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await authService.resetPassword(token, password);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(oldPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (token) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, token might be invalid
      await logout();
    }
  };

  const validateToken = async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      // Clear session on error
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setAuthCookie(null);
      sessionStorage.clear();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    setUser,
    validateToken,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
