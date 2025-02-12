import React from "react";
import ActiveSectionContextProvider from "./active-section";

type ProviderProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProviderProps) {
  return (
    <ActiveSectionContextProvider>{children}</ActiveSectionContextProvider>
  );
}
