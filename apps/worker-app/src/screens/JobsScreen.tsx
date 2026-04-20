import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WorkerStackParamList } from "../App";
import { api, formatMyr } from "../api";

interface Booking {
  id: string;
  categoryCode: string;
  status: string;
  scheduledFor: string;
  totalAmount: number;
  workerAmount: number;
  adminAmount: number;
  address: string;
}

type Props = NativeStackScreenProps<WorkerStackParamList, "Jobs">;

export default function JobsScreen({ navigation }: Props) {
  const [items, setItems] = useState<Booking[]>([]);

  const load = useCallback(async () => {
    try {
      setItems(await api<Booking[]>("/workers/jobs"));
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("JobDetails", { bookingId: item.id })}
        >
          <Text style={{ fontWeight: "700" }}>{item.categoryCode}</Text>
          <Text style={{ color: "#555" }}>
            {new Date(item.scheduledFor).toLocaleString()}
          </Text>
          <Text>
            You earn {formatMyr(item.workerAmount)} · Admin {formatMyr(item.adminAmount)}
          </Text>
          <Text style={{ color: "#666" }}>{item.address}</Text>
          <Text style={{ color: "#1f6feb" }}>{item.status}</Text>
        </TouchableOpacity>
      )}
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
