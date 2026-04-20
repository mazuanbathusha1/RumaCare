import React, { useEffect, useState } from "react";
import { Text, View, FlatList, StyleSheet, Button, Alert } from "react-native";
import { api, formatMyr } from "../api";

interface Booking {
  id: string;
  categoryCode: string;
  status: string;
  scheduledFor: string;
  totalAmount: number;
  address: string;
}

export default function BookingsScreen() {
  const [items, setItems] = useState<Booking[]>([]);

  async function load() {
    try {
      setItems(await api<Booking[]>("/bookings/mine"));
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    try {
      await api(`/bookings/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      Alert.alert("Cancel failed", e instanceof Error ? e.message : String(e));
    }
  }

  async function rate(id: string) {
    try {
      await api(`/bookings/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ stars: 5 }),
      });
      Alert.alert("Thanks", "Rated 5 stars!");
    } catch (e) {
      Alert.alert("Rate failed", e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={{ fontWeight: "700" }}>{item.categoryCode}</Text>
          <Text style={{ color: "#555" }}>
            {new Date(item.scheduledFor).toLocaleString()}
          </Text>
          <Text style={{ color: "#555" }}>{item.address}</Text>
          <Text>Total: {formatMyr(item.totalAmount)}</Text>
          <Text>Status: {item.status}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
            {["PERSONAL_NURSING", "CLEANING", "NANNY"].includes(item.categoryCode) &&
            item.status !== "CANCELLED" &&
            item.status !== "COMPLETED" ? (
              <Button title="Cancel" onPress={() => cancel(item.id)} />
            ) : null}
            {item.status === "COMPLETED" ? (
              <Button title="Rate 5★" onPress={() => rate(item.id)} />
            ) : null}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e4e7ed",
    gap: 2,
  },
});
