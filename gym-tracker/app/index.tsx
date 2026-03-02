import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { db, isOnline } from "./backend/db";

export default function Index() {
  const router = useRouter();

  const handleSignOut = async () => {
    await db.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      {!isOnline && <Text style={styles.offlineText}>⚡ Offline Mode</Text>}

      <Pressable style={styles.button} onPress={() => router.push("/profile")}>
        <Text style={styles.buttonText}>My Profile</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/test")}>
        <Text style={styles.buttonText}>Go to Supabase Test</Text>
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60, gap: 16 },
  title: { fontSize: 24, fontWeight: "700" },
  offlineText: { color: "#f59e0b", fontWeight: "600" },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: "#3b82f6", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  signOutButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: "#fca5a5", alignItems: "center" },
  signOutText: { fontWeight: "600", color: "#991b1b", fontSize: 16 },
});
