import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { api } from "../api";
import type { TimeSlot } from "@rumacare/shared";

type Props = NativeStackScreenProps<RootStackParamList, "Booking">;

export default function BookingScreen({ route, navigation }: Props) {
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [slot, setSlot] = useState<TimeSlot>("AM");
  const [duration, setDuration] = useState("2");
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState(false);

  async function useCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Location permission denied");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLat(loc.coords.latitude);
    setLng(loc.coords.longitude);
  }

  async function submit() {
    if (lat == null || lng == null) {
      Alert.alert("Location", "Please set location first");
      return;
    }
    try {
      if (recurring) {
        await api("/subscriptions", {
          method: "POST",
          body: JSON.stringify({
            categoryCode: route.params.categoryCode,
            serviceTypeId: route.params.serviceTypeId,
            weekdays: [1, 3, 5],
            lat,
            lng,
            address,
            startDate: new Date().toISOString(),
            months: 1,
          }),
        });
        Alert.alert("Booked", "Recurring monthly subscription created");
      } else {
        await api("/bookings", {
          method: "POST",
          body: JSON.stringify({
            categoryCode: route.params.categoryCode,
            serviceTypeId: route.params.serviceTypeId,
            scheduledFor: new Date().toISOString(),
            slot,
            durationHours: Number(duration),
            lat,
            lng,
            address,
            notes,
          }),
        });
        Alert.alert(
          "Booking submitted",
          "We're dispatching to the nearest workers now.",
        );
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  }

  const isCat1or4 = ["PERSONAL_NURSING", "TUITION"].includes(route.params.categoryCode);
  const isCat2or3 = ["CLEANING", "NANNY"].includes(route.params.categoryCode);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{route.params.serviceName}</Text>

      <Text style={styles.label}>Location</Text>
      <Button title="Use current location" onPress={useCurrentLocation} />
      {lat != null && lng != null ? (
        <Text style={{ color: "#666", marginTop: 4 }}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />

      {isCat1or4 ? (
        <View style={styles.rowToggle}>
          <Button
            title={recurring ? "◉ Recurring" : "○ Recurring"}
            onPress={() => setRecurring(true)}
          />
          <Button
            title={!recurring ? "◉ One-off" : "○ One-off"}
            onPress={() => setRecurring(false)}
          />
        </View>
      ) : null}

      {!recurring ? (
        <>
          <Text style={styles.label}>Time slot</Text>
          <View style={styles.row}>
            {(["AM", "PM", "EVENING", "FULL_DAY"] as TimeSlot[]).map((s) => (
              <Button
                key={s}
                title={slot === s ? `◉ ${s}` : s}
                onPress={() => setSlot(s)}
              />
            ))}
          </View>
          {!isCat2or3 ? (
            <>
              <Text style={styles.label}>Duration (hours)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={duration}
                onChangeText={setDuration}
              />
            </>
          ) : null}
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.input}
            placeholder="Any special instructions"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </>
      ) : null}

      <View style={{ height: 16 }} />
      <Button
        title={recurring ? "Start Monthly Subscription" : "Request Booking"}
        onPress={submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10 },
  title: { fontSize: 22, fontWeight: "700" },
  label: { marginTop: 10, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  rowToggle: { flexDirection: "row", gap: 10, marginTop: 8 },
});
