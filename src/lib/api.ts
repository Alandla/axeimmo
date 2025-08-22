import axios from "axios";

// Nouvelle fonction sans toast pour les appels non-React
export const basicApiCall = async <T>(url: string, params: any): Promise<T> => {
  try {
    const response = await apiClient.post<T>(`${url}`, params);
    return response.data;
  } catch (e: any) {
    console.error(e?.message);
    throw e;
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

export const basicApiDeleteCall = async <T>(url: string): Promise<T> => {
  try {
    const response = await apiClient.delete<T>(url);
    return response.data;
  } catch (e: any) {
    console.error(e?.message);
    throw e;
  }
}

// Client API séparé pour les appels avec toast (contexte React)
export const apiClient = axios.create({
  baseURL: "/api",
});

// Déplacer l'intercepteur avec toast vers le client spécifique
apiClient.interceptors.response.use(
  function (response: any) {
    return response.data;
  },
  function (error: any) {
    let message = "";

    if (error.response?.status === 401) {
      //return signIn(undefined, { callbackUrl: config.auth.callbackUrl });
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

    return Promise.reject(error);
  }
);
