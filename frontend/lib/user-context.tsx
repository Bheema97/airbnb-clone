"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export interface User {
  id: number;
  name: string;
  role: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch users for the demo switcher
    fetchApi<User[]>("/users")
      .then((data) => {
        setUsers(data);
        if (data.length > 0) {
          const savedId = Number(window.localStorage.getItem("stayfinder-demo-user"));
          setCurrentUser(data.find((user) => user.id === savedId) || data[0]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const selectUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) window.localStorage.setItem("stayfinder-demo-user", String(user.id));
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: selectUser, users, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
