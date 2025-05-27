import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

// Function to safely get user from localStorage
const getInitialUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return null; // Return null if localStorage is inaccessible
  }
};

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(
    getInitialUser()
  );

  const updateUser = (data) => {
    setCurrentUser(data);
  };

  useEffect(() => {
    // Safely set user in localStorage
    try {
      localStorage.setItem("user", JSON.stringify(currentUser));
    } catch (error) {
      console.error("Error setting localStorage:", error);
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser,updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
