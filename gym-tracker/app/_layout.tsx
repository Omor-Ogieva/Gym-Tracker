import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { db, isOnline } from "./backend/db";

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    db.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = db.onAuthStateChange(
      (_event: string, session: any) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthScreen = segments[0] === "auth";

    if (session && inAuthScreen) {
      router.replace("/");
    } else if (!session && !inAuthScreen) {
      router.replace("/auth");
    }
  }, [session, loading, segments]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="test" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
