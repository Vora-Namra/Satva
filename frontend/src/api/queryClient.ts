import { QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Something went wrong";
        toast.error(message);
      },
    },
  },
});
