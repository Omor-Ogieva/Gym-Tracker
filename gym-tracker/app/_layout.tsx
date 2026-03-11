import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { db } from "./backend/db";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";

function RootNav() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();

  useEffect(() => {
    db.getSession().then((result: any) => {
      setSession(result?.data?.session ?? null);
      setLoading(false);
    });

    const result = db.onAuthStateChange(
      (_event: string, session: any) => {
        setSession(session);
      }
    );

    const subscription = result?.data?.subscription;

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthScreen = segments[0] === "auth";

    if (session && inAuthScreen) {
      router.replace("/(tabs)");
    } else if (!session && !inAuthScreen) {
      router.replace("/auth");
    }
  }, [session, loading, segments]);

  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
        animationDuration: 150,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="workout" options={{ animation: "slide_from_right", animationDuration: 200 }} />
      <Stack.Screen name="settings" options={{ presentation: "modal", animation: "slide_from_bottom", animationDuration: 200 }} />
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNav />
    </ThemeProvider>
  );
}
