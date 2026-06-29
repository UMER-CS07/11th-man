// File: src/services/api.ts
import axios from 'axios';

// 1. Create the base instance
export const apiClient = axios.create({
  timeout: 10000, // 10-second timeout to prevent infinite hanging
});

// 2. Inject the Response Interceptor (Requirement 09 Error Handling)
apiClient.interceptors.response.use(
  (response) => {
    // Pass successful responses through seamlessly
    return response;
  },
  (error) => {
    // Intercept errors and format them into readable strings
    let customMessage = "An unexpected network error occurred.";
    
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      if (error.response.status >= 500) {
        customMessage = "Server is currently unreachable. Please try again later.";
      } else if (error.response.status >= 400) {
        customMessage = `Invalid request (${error.response.status}). Please check your data.`;
      }
    } else if (error.request) {
      // The request was made but no response was received (e.g., no internet)
      customMessage = "Network error. Please check your internet connection.";
    }

    // Reject the promise with our sanitized error
    return Promise.reject(new Error(customMessage));
  }
);
