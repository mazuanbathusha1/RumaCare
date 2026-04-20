import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert, ScrollView, Linking } from "react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WorkerStackParamList } from "../App";
import { api, formatMyr } from "../api";

type Props = NativeStackScreenProps<WorkerStackParamList, "JobDetails">;

interface Booking {
  id: string;
  categoryCode: string;
  status: string;
  scheduledFor: string;
  totalAmount: number;
  workerAmount: number;
  adminAmount: number;
  multiplierApplied: number;
  discountPercent: number;
  lat: number;
  lng: number;
  address: string;
  notes?: string;
}

export default function JobDetailsScreen({ route }: Props) {
  const [booking, setBooking] = useState<Booking | null>(null);

  async function load() {
    // Jobs list doesn't expose single GET; reuse filter by date range bracket via /workers/jobs
    const all = await api<Booking[]>("/workers/jobs");
    setBooking(all.find((b) => b.id === route.params.bookingId) ?? null);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [route.params.bookingId]);

  async function openDirections() {
    if (!booking) return;
    const { status } = await Location.requestForegroundPermissionsAsync();
    let originParam = "";
    if (status === "granted") {
      const loc = await Location.getCurrentPositionAsync({});
      originParam = `&origin=${loc.coords.latitude},${loc.coords.longitude}`;
    }
    const dest = `${booking.lat},${booking.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}${originParam}&travelmode=driving`;
    Linking.openURL(url);
  }

  async function complete() {
    if (!booking) return;
    try {
      await api(`/bookings/${booking.id}/complete`, { method: "POST" });
      Alert.alert("Completed", "Nice work!");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : String(e));
    }
  }

  if (!booking) return null;

  return (
    <ScrollView contentContainerStyle={styles.c}>
      <Text style={styles.title}>{booking.categoryCode}</Text>
      <Text style={{ color: "#555" }}>{new Date(booking.scheduledFor).toLocaleString()}</Text>
      <Text>{booking.address}</Text>
      {booking.notes ? <Text style={{ color: "#666" }}>Notes: {booking.notes}</Text> : null}
      <View style={styles.card}>
        <Text>Total charged to customer: {formatMyr(booking.totalAmount)}</Text>
        <Text>You earn: {formatMyr(booking.workerAmount)}</Text>
        <Text>Admin share: {formatMyr(booking.adminAmount)}</Text>
        <Text>Multiplier applied: {booking.multiplierApplied.toFixed(2)}×</Text>
        {booking.discountPercent ? <Text>Discount: {booking.discountPercent}%</Text> : null}
      </View>
      <Button title="Open directions" onPress={openDirections} />
      {booking.status === "ACCEPTED" || booking.status === "IN_PROGRESS" ? (
        <Button title="Mark completed" onPress={complete} />
      ) : null}
      <Text style={{ color: "#1f6feb", marginTop: 10 }}>{booking.status}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: "700" },
  card: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e7ed",
    gap: 4,
    marginTop: 6,
  },
});
