import { createContext, useState } from "react";

// This file creates a context to store and share the current user's details (like name, email, etc.) across the whole app.
// Other parts of the app can use this to get or update the user's info.
export const UserDetailContext = createContext();

// This component provides the user details to all its child components.
// It lets the app remember who is logged in and share their info everywhere.
export function UserDetailProvider({ children }) {
  const [userDetail, setUserDetail] = useState(null);

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      {children}
    </UserDetailContext.Provider>
  );
}