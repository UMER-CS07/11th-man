// File: app/(user)/weather.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Animated
} from 'react-native';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';
import { useLocationWeather } from '@/src/hooks/useLocationWeather';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

// Cricket playability assessment based on weather conditions
function getCricketPlayability(weather: NonNullable<ReturnType<typeof useLocationWeather>['weather']>, colors: any): {
  label: string;
  color: string;
  bg: string;
  border: string;
  tips: string[];
} {
  const { temperature, humidity, windSpeed, description } = weather;
  const desc = description.toLowerCase();

  const hasRain = desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower') || desc.includes('thunder');
  const hasFog = desc.includes('fog') || desc.includes('mist') || desc.includes('haze');

  if (hasRain) {
    return {
      label: 'NOT PLAYABLE',
      color: colors.error, bg: colors.errorBg, border: colors.errorBorder,
      tips: ['🚫 Rain detected — match not recommended.', '🌧️ Wet pitch will assist seamers heavily.', '⏳ Wait for conditions to clear before play.'],
    };
  }
  if (hasFog || weather.visibility < 5) {
    return {
      label: 'POOR VISIBILITY',
      color: colors.warning, bg: colors.warningBg, border: colors.warningBorder,
      tips: ['🌫️ Low visibility — batters may struggle to sight the ball.', '⚠️ Consider delaying the toss.', '💡 Use a white ball match instead of red ball.'],
    };
  }
  if (temperature > 38) {
    return {
      label: 'HOT — CAUTION',
      color: colors.warning, bg: colors.warningBg, border: colors.warningBorder,
      tips: ['🥵 Extreme heat — frequent water breaks mandatory.', '🧴 Players should apply sunscreen.', '🎽 Light-colored clothing recommended.', '💧 Keep extra hydration on the bench.'],
    };
  }
  if (windSpeed > 30) {
    return {
      label: 'WINDY — PLAYABLE',
      color: colors.violet, bg: colors.violetBg, border: colors.violetBorder,
      tips: ['💨 Strong wind — spinners will be effective.', '🏏 Batting against the wind is tough in powerplay.', '🎯 Swing bowling conditions are excellent.'],
    };
  }
  if (humidity > 80) {
    return {
      label: 'HUMID — GOOD FOR PLAY',
      color: colors.sky, bg: colors.skyBg, border: colors.skyBorder,
      tips: ['💦 High humidity — ball will swing.', '🏏 Excellent seam bowling conditions.', '⚡ Players may fatigue faster — plan rotations.'],
    };
  }
  return {
    label: 'IDEAL FOR CRICKET',
    color: colors.success, bg: colors.successBg, border: colors.successBorder,
    tips: ['🏏 Perfect match conditions.', `🌡️ Temperature ${temperature}°C — comfortable for players.`, '😎 Great day for a full 20-over match!'],
  };
}

function getWeatherEmoji(icon: string): string {
  const map: Record<string, string> = {
    Clear: '☀️', Clouds: '⛅', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️',
    Snow: '❄️', Mist: '🌫️', Fog: '🌫️', Haze: '🌁', Dust: '🌪️', Tornado: '🌪️',
  };
  return map[icon] ?? '🌡️';
}

export default function WeatherScreen() {
  const { colors } = useTheme();
  const { weather, loading, error } = useLocationWeather();
  const [showTips, setShowTips] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const playability = weather ? getCricketPlayability(weather, colors) : null;

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.pageTitle, { color: colors.text }]}>🌤 Pitch Weather</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>Real-time conditions for your match</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.subText }]}>Fetching weather data...</Text>
          </View>
        ) : error ? (
          <View style={[styles.errorCard, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <Text style={{ color: colors.error, fontWeight: '900', fontSize: 11, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>⚠️ Error</Text>
            <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
          </View>
        ) : weather ? (
          <>
            {/* Fallback notice */}
            {weather.isFallback && (
              <View style={[styles.infoBar, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
                <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                  📍 LOCATION ACCESS DENIED
                </Text>
                <Text style={{ color: colors.warning, fontSize: 12, marginTop: 4 }}>
                  Showing data for {weather.city} (random city)
                </Text>
              </View>
            )}

            {/* Main weather card */}
            <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.icon)}</Text>
              <Text style={[styles.cityName, { color: colors.text }]}>{weather.city}, {weather.country}</Text>
              <Text style={[styles.bigTemp, { color: colors.text }]}>{weather.temperature}°C</Text>
              <Text style={[styles.desc, { color: colors.subText }]}>{weather.description}</Text>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {[
                { label: 'FEELS LIKE', value: `${weather.feelsLike}°C`, icon: '🌡️' },
                { label: 'HUMIDITY', value: `${weather.humidity}%`, icon: '💧' },
                { label: 'WIND', value: `${weather.windSpeed} km/h`, icon: '💨' },
                { label: 'VISIBILITY', value: `${weather.visibility} km`, icon: '👁️' },
              ].map((item) => (
                <View key={item.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={styles.statIcon}>{item.icon}</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Cricket playability */}
            {playability && (
              <>
                <AnimatedPressable
                  style={[styles.playabilityBanner, { backgroundColor: playability.bg, borderColor: playability.border }]}
                  onPress={() => setShowTips(!showTips)}
                >
                  <Text style={[styles.playabilityLabel, { color: playability.color }]}>{playability.label}</Text>
                  <Text style={{ color: playability.color, fontSize: 10, fontWeight: '800' }}>{showTips ? 'HIDE ▲' : 'SHOW ▼'}</Text>
                </AnimatedPressable>

                {showTips && (
                  <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.tipsHeader, { color: colors.text }]}>🏏 CRICKETERS' TIPS</Text>
                    {playability.tips.map((tip, i) => (
                      <Text key={i} style={[styles.tipItem, { color: colors.subText }]}>{tip}</Text>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        ) : null}
      </Animated.ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginBottom: 20, marginTop: 4 },
  center: { alignItems: 'center', marginTop: 60 },
  loadingText: { marginTop: 12, fontSize: 13 },
  errorCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 20 },
  infoBar: { padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1 },
  mainCard: { alignItems: 'center', padding: 32, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  weatherEmoji: { fontSize: 64, marginBottom: 8 },
  cityName: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  bigTemp: { fontSize: 64, fontWeight: '900', letterSpacing: -3 },
  desc: { fontSize: 14, textTransform: 'capitalize', marginTop: 4, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { width: '48%', padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  playabilityBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  playabilityLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  tipsCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  tipsHeader: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
  tipItem: { fontSize: 13, marginBottom: 8, lineHeight: 20, fontWeight: '500' },
});
