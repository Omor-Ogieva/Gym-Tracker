import { Pressable, ScrollView, StyleSheet, Text, View, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "./backend/db";
import { useTheme } from "./theme/ThemeContext";

type SettingItemProps = {
  icon: string;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  value?: string;
};

function SettingItem({ icon, label, onPress, rightElement, destructive, value }: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
        pressed && { backgroundColor: colors.surfaceSecondary },
      ]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <Text style={{ fontSize: 20, marginRight: 14 }}>{icon}</Text>
      <Text style={[{ flex: 1, fontSize: 16, fontWeight: "500", color: colors.text }, destructive && { color: colors.danger }]}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {value && <Text style={{ fontSize: 14, color: colors.textTertiary }}>{value}</Text>}
        {rightElement ?? (onPress ? <Text style={{ fontSize: 22, color: colors.textTertiary, fontWeight: "300" }}>›</Text> : null)}
      </View>
    </Pressable>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
        {children}
      </View>
    </View>
  );
}

type AppearanceOption = "light" | "dark" | "system";

function AppearanceModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, mode, setMode } = useTheme();

  const options: { label: string; value: AppearanceOption; icon: string; description: string }[] = [
    { label: "Light", value: "light", icon: "☀️", description: "Always use light theme" },
    { label: "Dark", value: "dark", icon: "🌙", description: "Always use dark theme" },
    { label: "System", value: "system", icon: "📱", description: "Match device settings" },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }} onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 24,
            width: 300,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}
          onPress={() => {}}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 20 }}>
            Appearance
          </Text>

          {options.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: mode === option.value ? colors.primaryLight : "transparent",
                  borderWidth: mode === option.value ? 2 : 1,
                  borderColor: mode === option.value ? colors.primary : colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                setMode(option.value);
                onClose();
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 14 }}>{option.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{option.label}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{option.description}</Text>
              </View>
              {mode === option.value && (
                <Text style={{ fontSize: 18, color: colors.primary, fontWeight: "700" }}>✓</Text>
              )}
            </Pressable>
          ))}

          <Pressable
            style={{
              marginTop: 12,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: colors.surfaceSecondary,
              alignItems: "center",
            }}
            onPress={onClose}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const [showAppearance, setShowAppearance] = useState(false);

  const appearanceLabel = mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System";

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await db.signOut(); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {} },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.headerBackground,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <Pressable style={{ width: 40 }} onPress={() => router.back()}>
          <Text style={{ fontSize: 22, fontWeight: "600", color: colors.primary }}>←</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <SettingSection title="Account">
          <SettingItem icon="👤" label="Profile" onPress={() => {}} />
          <SettingItem icon="🔒" label="Account" onPress={() => {}} />
          <SettingItem icon="🔔" label="Notifications" onPress={() => {}} />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem icon="🏋️" label="Workouts" onPress={() => {}} />
          <SettingItem icon="📏" label="Units" onPress={() => {}} />
          <SettingItem icon="🌐" label="Language" onPress={() => {}} />
          <SettingItem icon="🌙" label="Appearance" onPress={() => setShowAppearance(true)} value={appearanceLabel} />
        </SettingSection>

        {/* Guides */}
        <SettingSection title="Guides">
          <SettingItem icon="ℹ️" label="Getting Started Guide" onPress={() => {}} />
          <SettingItem icon="📋" label="Routine Help" onPress={() => {}} />
        </SettingSection>

        {/* Help */}
        <SettingSection title="Help">
          <SettingItem icon="❓" label="Frequently Asked Questions" onPress={() => {}} />
          <SettingItem icon="📧" label="Contact Us" onPress={() => {}} />
          <SettingItem icon="⭐" label="Rate the App" onPress={() => {}} />
          <SettingItem icon="📜" label="About" onPress={() => {}} />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Danger Zone">
          <SettingItem icon="🗑️" label="Delete Account" onPress={handleDeleteAccount} destructive />
        </SettingSection>

        {/* Sign Out */}
        <Pressable style={{ marginTop: 32, marginHorizontal: 16, paddingVertical: 16, alignItems: "center" }} onPress={handleSignOut}>
          <Text style={{ fontSize: 17, fontWeight: "600", color: colors.danger }}>Logout</Text>
        </Pressable>

        <Text style={{ textAlign: "center", color: colors.textTertiary, fontSize: 13, marginTop: 12, fontWeight: "500" }}>
          Gym Tracker v1.0.0
        </Text>
      </ScrollView>

      <AppearanceModal visible={showAppearance} onClose={() => setShowAppearance(false)} />
    </View>
  );
}