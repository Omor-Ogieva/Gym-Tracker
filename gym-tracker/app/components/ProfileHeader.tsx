import { Image, StyleSheet, Text, View } from "react-native";

type ProfileHeaderProps = {
  username: string;
  email: string;
  memberSince: string;
  avatarUrl?: string | null;
};

export default function ProfileHeader({ username, email, memberSince, avatarUrl }: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {username ? username[0].toUpperCase() : "?"}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.username}>{username}</Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.memberSince}>Member since {memberSince}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 24, gap: 4 },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 36, fontWeight: "700", color: "#fff" },
  username: { fontSize: 22, fontWeight: "700", color: "#1f2937" },
  email: { fontSize: 14, color: "#6b7280" },
  memberSince: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
});