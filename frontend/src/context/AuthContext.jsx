import { createContext, useContext, useState } from 'react';
import api from '../utils/api';
const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const login = async (email, password, mfaToken) => {
    const { data } = await api.post('/auth/login', { email, password, token: mfaToken });
    localStorage.setItem('token', data.token);
    setToken(data.token);
  };
  const logout = () => { localStorage.removeItem('token'); setToken(null); };
  return <Ctx.Provider value={{ token, isAdmin: !!token, login, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
