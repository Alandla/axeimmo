import axios from "axios";
import { signIn } from "next-auth/react";
import config from "@/config";
import { useToast } from "@/src/hooks/use-toast";

// use this to interact with our own API (/app/api folder) from the front-end side
// See https://shipfa.st/docs/tutorials/api-call
export const basicApiCall = async <T>(url: string, params: any): Promise<T> => {
  try {
    const response = await apiClient.post<T>(url, params);
    return response.data;
  } catch (e: any) {
    console.error(e?.message);
    throw e; // Relancer l'erreur pour la gérer au niveau supérieur
  }
}

export const basicApiGetCall = async <T>(url: string): Promise<T> => {
  try {
    const response = await apiClient.get<T>(url);
    return response.data;
  } catch (e: any) {
    console.error(e?.message);
    throw e; // Relancer l'erreur pour la gérer au niveau supérieur
  }
}

const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.response.use(
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

export default apiClient;
