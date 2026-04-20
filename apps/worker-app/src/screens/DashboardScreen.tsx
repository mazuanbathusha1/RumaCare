import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Button,
  ScrollView,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WorkerStackParamList } from "../App";
import { api, getToken, setToken } from "../api";

type Props = NativeStackScreenProps<WorkerStackParamList, "Dashboard">;

interface WorkerProfile {
  id: string;
  autoAccept: boolean;
  averageRating: number;
  ratingCount: number;
  user: { name: string; email: string };
}

export default function DashboardScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return navigation.replace("Login");
    try {
      const me = await api<WorkerProfile>("/workers/me");
      setProfile(me);
    } catch {
      await setToken(null);
      navigation.replace("Login");
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleAuto(val: boolean) {
    if (!profile) return;
    await api("/workers/me", {
      method: "PATCH",
      body: JSON.stringify({ autoAccept: val }),
    });
    setProfile({ ...profile, autoAccept: val });
  }

  async function pushLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied");
    const loc = await Location.getCurrentPositionAsync({});
    await api("/workers/me", {
      method: "PATCH",
      body: JSON.stringify({
        currentLat: loc.coords.latitude,
        currentLng: loc.coords.longitude,
      }),
    });
    Alert.alert("Location updated");
  }

  async function logout() {
    await setToken(null);
    navigation.replace("Login");
  }

  if (!profile) return null;

  return (
    <ScrollView contentContainerStyle={styles.c}>
      <Text style={styles.hello}>Hi {profile.user.name} 👋</Text>
      <Text style={{ color: "#555" }}>
        ⭐ {profile.averageRating.toFixed(1)} ({profile.ratingCount})
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={{ fontWeight: "600" }}>Auto-Accept jobs</Text>
          <Switch value={profile.autoAccept} onValueChange={toggleAuto} />
        </View>
        <Button title="Share my current location" onPress={pushLocation} />
      </View>

      <View style={styles.card}>
        <Button title="View job offers" onPress={() => navigation.navigate("Offers")} />
        <Button title="My jobs" onPress={() => navigation.navigate("Jobs")} />
        <Button title="Yesterday's jobs" onPress={() => navigation.navigate("Yesterday")} />
        <Button title="Download report" onPress={() => navigation.navigate("Report")} />
      </View>

      <View style={styles.card}>
        <Button
          title="Complete partner registration"
          onPress={() => navigation.navigate("RegisterPartner")}
        />
      </View>

      <Button title="Sign out" color="#c62828" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { padding: 16, gap: 12 },
  hello: { fontSize: 22, fontWeight: "700" },
  card: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e7ed",
    gap: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
