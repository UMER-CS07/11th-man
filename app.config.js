import 'dotenv/config';

export default {
  expo: {
    name: "11th Man Cricket Platform",
    slug: "eleventh-man-mobile",
    version: "1.0.0",
    orientation: "portrait",
    backgroundColor: "#0a0a0b",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0b"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kust.eleventhman"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0b"
      },
      package: "com.kust.eleventhman"
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      openWeatherApiKey: process.env.EXPO_PUBLIC_OPENWEATHER_KEY,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
    plugins: [
      "expo-router",
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.11thman.cricket",
          "enableGooglePay": true
        }
      ]
    ]
  }
};
