import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';

/**
 * Contexto de autenticación que expone el estado del usuario
 * y métodos para iniciar/cerrar sesión y registrarse.
 * @type {React.Context<{ user: object|null, loading: boolean, login: Function, register: Function, logout: Function }>}
 */
const AuthContext = createContext(null);

/**
 * Proveedor de autenticación. Escucha cambios de estado de Firebase Auth
 * y provee métodos de login/registro/logout a sus hijos.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(firebaseUser => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Inicia sesión con email y contraseña.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import('@react-native-firebase/auth').UserCredential>}
   */
  async function login(email, password) {
    return auth().signInWithEmailAndPassword(email, password);
  }

  /**
   * Registra un nuevo usuario con email y contraseña.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import('@react-native-firebase/auth').UserCredential>}
   */
  async function register(email, password) {
    return auth().createUserWithEmailAndPassword(email, password);
  }

  /** Cierra la sesión del usuario actual. @returns {Promise<void>} */
  async function logout() {
    return auth().signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto de autenticación.
 * @returns {{ user: object|null, loading: boolean, login: Function, register: Function, logout: Function }}
 * @throws {Error} Si se usa fuera de AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
