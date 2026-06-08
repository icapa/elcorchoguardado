"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  authorizedEmails: string[];
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthorized: false,
  authorizedEmails: [],
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);

  useEffect(() => {
    // Parse authorized emails from environment variable
    const emailsEnv = process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || "";
    const emailList = emailsEnv
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
    setAuthorizedEmails(emailList);

    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const userEmail = currentUser.email.toLowerCase();
        setIsAuthorized(emailList.includes(userEmail));
      } else {
        setIsAuthorized(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthorized, authorizedEmails, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
