import React, { useEffect, useState } from "react";
import { Text, FlatList, View, Button, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { api } from "../api";

interface Listing {
  id: string;
  workerId: string;
  description: string;
  phone: string;
  averageRating: number;
  ratingCount: number;
  preferredPartner: boolean;
  worker?: { name: string };
}

type Props = NativeStackScreenProps<RootStackParamList, "HomeServiceListings">;

export default function HomeServiceListingsScreen({ route }: Props) {
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    api<Listing[]>(`/home-services/listings?categoryId=${route.params.categoryId}`)
      .then(setItems)
      .catch(() => setItems([]));
  }, [route.params.categoryId]);

  async function view(id: string) {
    try {
      const res = await api<{ phone: string }>(`/home-services/listings/view/${id}`, {
        method: "POST",
      });
      Alert.alert("Contact", `Phone: ${res.phone}`);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "700", fontSize: 16 }}>
              {item.worker?.name ?? "Worker"}
            </Text>
            {item.preferredPartner ? (
              <Text style={{ color: "#1f6feb" }}>★ Preferred</Text>
            ) : null}
          </View>
          <Text style={{ color: "#666", marginVertical: 4 }}>{item.description}</Text>
          <Text style={{ color: "#555" }}>
            ⭐ {item.averageRating.toFixed(1)} ({item.ratingCount})
          </Text>
          <Button title="View contact" onPress={() => view(item.id)} />
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
          No listings yet.
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
