import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { Spinner } from "../components/common/Spinner";
import { ThemeProvider } from "../contexts/ThemeContext";
import { queryClient } from "../api/queryClient";
import { persistor, store } from "./store";
import { router } from "./router";

export function AppProviders() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<Spinner />} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <RouterProvider router={router} />
            </ThemeProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
