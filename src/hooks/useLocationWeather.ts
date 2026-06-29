// File: src/hooks/useLocationWeather.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { apiClient } from '@/src/services/api'; // Requirement 09: use centralized axios instance

// Requirement 09: Read API key via expo-constants (from app.config.js extra block)
// Falls back to process.env for Expo Go / web compatibility
const OPENWEATHER_API_KEY =
  (Constants.expoConfig?.extra?.openWeatherApiKey as string | undefined) ??
  (process.env.EXPO_PUBLIC_OPENWEATHER_KEY as string | undefined);

// Requirement 09: Five distinct Pakistani cities for fallback rotation
const FALLBACK_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta'];

export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  visibility: number;
  isFallback: boolean;
}

export const useLocationWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Uses centralized axios instance so its interceptors catch errors automatically
  const fetchByUrl = async (url: string, isFallback: boolean): Promise<void> => {
    // apiClient.get throws on non-2xx via the response interceptor in api.ts
    const { data } = await apiClient.get(url);

    setWeather({
      city: data.name,
      country: data.sys?.country ?? '',
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind?.speed ?? 0),
      description: data.weather[0].description,
      icon: data.weather[0].main,
      visibility: Math.round((data.visibility ?? 0) / 1000), // convert m → km
      isFallback,
    });
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (!OPENWEATHER_API_KEY) {
          throw new Error('OpenWeather API key not configured. Add EXPO_PUBLIC_OPENWEATHER_KEY to .env file.');
        }

        const base = `https://api.openweathermap.org/data/2.5/weather?appid=${OPENWEATHER_API_KEY}&units=metric`;

        // Requirement 09B: Try hardware GPS first
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const url = `${base}&lat=${location.coords.latitude}&lon=${location.coords.longitude}`;
          await fetchByUrl(url, false);
        } else {
          // Requirement 09C: GPS denied → pick a random Pakistani city from the 5
          const randomCity = FALLBACK_CITIES[Math.floor(Math.random() * FALLBACK_CITIES.length)];
          const url = `${base}&q=${randomCity},PK`;
          await fetchByUrl(url, true);
        }
      } catch (err: any) {
        // Axios interceptor formats the error message; just use it directly
        setError(err.message ?? 'Unable to fetch weather data.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return { weather, loading, error };
};
