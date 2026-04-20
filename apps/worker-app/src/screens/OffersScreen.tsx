import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Button, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WorkerStackParamList } from "../App";
import { api, formatMyr } from "../api";

type Props = NativeStackScreenProps<WorkerStackParamList, "Offers">;

interface Offer {
  id: string;
  status: string;
  distanceKm: number;
  expiresAt: string;
  booking: {
    id: string;
    categoryCode: string;
    scheduledFor: string;
    totalAmount: number;
    workerAmount: number;
    address: string;
  };
}

export default function OffersScreen({ navigation }: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);

  const load = useCallback(async () => {
    try {
      setOffers(await api<Offer[]>("/offers/mine"));
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : String(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, 5000);
      return () => clearInterval(id);
    }, [load]),
  );

  async function accept(id: string, bookingId: string) {
    try {
      await api(`/offers/${id}/accept`, { method: "POST" });
      navigation.navigate("JobDetails", { bookingId });
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : String(e));
    }
  }

  async function decline(id: string) {
    await api(`/offers/${id}/decline`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await load();
  }

  return (
    <FlatList
      data={offers}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const recalled = item.status !== "PENDING";
        return (
          <View style={[styles.card, recalled && { opacity: 0.5 }]}>
            <Text style={{ fontWeight: "700" }}>{item.booking.categoryCode}</Text>
            <Text style={{ color: "#555" }}>
              {new Date(item.booking.scheduledFor).toLocaleString()}
            </Text>
            <Text>
              Pay: {formatMyr(item.booking.workerAmount)} · {item.distanceKm.toFixed(1)} km
            </Text>
            <Text style={{ color: "#666" }}>{item.booking.address}</Text>
            <Text style={{ color: recalled ? "#c62828" : "#1f6feb" }}>
              {item.status}
              {recalled ? " (taken or expired)" : ""}
            </Text>
            {item.status === "PENDING" ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <Button title="Accept" onPress={() => accept(item.id, item.booking.id)} />
                <Button title="Decline" onPress={() => decline(item.id)} />
              </View>
            ) : null}
          </View>
        );
      }}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
          No job offers right now.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e7ed",
    gap: 4,
  },
});
