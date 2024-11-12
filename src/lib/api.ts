import axios from "axios";
import { signIn } from "next-auth/react";
import config from "@/config";
import { useToast } from "@/src/hooks/use-toast";

// Nouvelle fonction sans toast pour les appels non-React
export const basicApiCall = async <T>(url: string, params: any, showToast = true): Promise<T> => {
  try {
    const response = await (showToast ? apiClientWithToast : apiClient).post<T>(`/api${url}`, params);
    return response.data;
  } catch (e: any) {
    console.error(e?.message);
    throw e;
  }
}

export const basicApiGetCall = async <T>(url: string, showToast = true): Promise<T> => {
  try {
    const response = await (showToast ? apiClientWithToast : apiClient).get<T>(url);
    return response.data;
  } catch (e: any) {
    console.error(e?.message);
    throw e; // Relancer l'erreur pour la gérer au niveau supérieur
  }
}

// Client API séparé pour les appels avec toast (contexte React)
export const apiClientWithToast = axios.create({
  baseURL: "/api",
});

// Déplacer l'intercepteur avec toast vers le client spécifique
apiClientWithToast.interceptors.response.use(
  function (response: any) {
    return response.data;
  },
  function (error: any) {
    const { toast } = useToast();
    let message = "";

    if (error.response?.status === 401) {
      // User not auth, ask to re login
      toast({
        title: "Please login",
        description: "You are not authorized to access this resource.",
      })
      // automatically redirect to /dashboard page after login
      return signIn(undefined, { callbackUrl: config.auth.callbackUrl });
    } else if (error.response?.status === 403) {
      // User not authorized, must subscribe/purchase/pick a plan
      message = "Pick a plan to use this feature";
    } else {
      message =
        error?.response?.data?.error || error.message || error.toString();
    }

    error.message =
      typeof message === "string" ? message : JSON.stringify(message);

    console.error(error.message);

    // Automatically display errors to the user
    if (error.message) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        variant: "destructive",
        description: "something went wrong...",
      });
    }
    return Promise.reject(error);
  }
);

// Garder une version simple pour les appels sans contexte React
const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.response.use(
  function (response: any) {
    return response.data;
  },
  function (error: any) {
    console.error(error?.message || "An error occurred");
    return Promise.reject(error);
  }
);
