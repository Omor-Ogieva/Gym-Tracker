import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { db, isOnline } from "./backend/db";
import { useTheme } from "./theme/ThemeContext";

export default function Auth() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      const { error } = await db.signUp(email, password, username);
      if (error) setError(error.message);
      else setSuccess("Account created! You can now sign in.");
    } else {
      const { error } = await db.signIn(email, password);
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {isSignUp ? "Create Account" : "Welcome Back"}
      </Text>

      {!isOnline && <Text style={[styles.offlineText, { color: colors.warning }]}>⚡ Offline Mode</Text>}

      {isSignUp && (
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Username"
          placeholderTextColor={colors.textTertiary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}

      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text }]}
        placeholder="Email"
        placeholderTextColor={colors.textTertiary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text }]}
        placeholder="Password"
        placeholderTextColor={colors.textTertiary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
      {success && <Text style={[styles.successText, { color: colors.success }]}>{success}</Text>}

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </Text>
      </Pressable>

      <Pressable onPress={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}>
        <Text style={[styles.switchText, { color: colors.primary }]}>
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 100, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  offlineText: { textAlign: "center", fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  switchText: { textAlign: "center", marginTop: 8 },
  errorText: {},
  successText: {},
});