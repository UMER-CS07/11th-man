import 'dotenv/config';

export default {
  expo: {
    name: "11th Man Cricket Platform",
    slug: "eleventh-man-mobile",
    owner: "umer-cs07",
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
      bundleIdentifier: "com.kust.eleventhman",
      buildNumber: "1"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0b"
      },
      package: "com.kust.eleventhman",
      versionCode: 1
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      openWeatherApiKey: process.env.EXPO_PUBLIC_OPENWEATHER_KEY,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      eas: {
        projectId: "673909f1-1e24-402c-8545-c00d968761f8"
      }
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow 11th Man to use your location to determine match weather conditions."
        }
      ],
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
