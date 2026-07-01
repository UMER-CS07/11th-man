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

const getRandomFallbackCity = (): string => {
  return FALLBACK_CITIES[Math.floor(Math.random() * FALLBACK_CITIES.length)];
};

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
          setError('OpenWeather API key not configured. Add EXPO_PUBLIC_OPENWEATHER_KEY to .env file.');
          return;
        }

        const base = `https://api.openweathermap.org/data/2.5/weather?appid=${OPENWEATHER_API_KEY}&units=metric`;
        const fallbackCity = getRandomFallbackCity();

        // Requirement 09B: Try hardware GPS first, but never let permission or GPS failures crash boot.
        let shouldUseFallbackCity = true;

        try {
          const { status } = await Location.requestForegroundPermissionsAsync();

          if (status === 'granted') {
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              const url = `${base}&lat=${location.coords.latitude}&lon=${location.coords.longitude}`;
              await fetchByUrl(url, false);
              shouldUseFallbackCity = false;
            } catch (locationErr) {
              console.warn('GPS lookup failed, falling back to a Pakistani city.', locationErr);
            }
          }
        } catch (permissionErr) {
          console.warn('Location permission request failed, falling back to a Pakistani city.', permissionErr);
        }

        if (shouldUseFallbackCity) {
          const url = `${base}&q=${fallbackCity},PK`;
          await fetchByUrl(url, true);
        }
      } catch (err: any) {
        setError(err?.message ?? 'Unable to fetch weather data.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return { weather, loading, error };
};
