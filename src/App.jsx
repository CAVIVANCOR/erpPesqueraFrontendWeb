import React from "react";
import { PrimeReactProvider } from "primereact/api";
import AppRoutes from "./routes";

function App() {
  return (
    <PrimeReactProvider>
      <AppRoutes />
    </PrimeReactProvider>
  );
}

export default App;