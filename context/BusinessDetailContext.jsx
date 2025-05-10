import { createContext } from "react";

// This file creates a context to store and share the current business's details (like name, address, workers, etc.) across the app.
// Other parts of the app can use this to get or update the business info.
export const BusinessDetailContext = createContext();