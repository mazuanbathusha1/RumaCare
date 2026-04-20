import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { api, formatMyr } from "../api";
import type { RateModel } from "@rumacare/shared";

interface ServiceType {
  id: string;
  name: string;
  rateModel: RateModel;
  hourlyRate: number | null;
  rateAmSlot: number | null;
  rateFullDay: number | null;
  enabled: boolean;
}

type Props = NativeStackScreenProps<RootStackParamList, "Category">;

export default function CategoryScreen({ route, navigation }: Props) {
  const [items, setItems] = useState<ServiceType[]>([]);

  useEffect(() => {
    api<ServiceType[]>(`/service-types?category=${route.params.categoryCode}`)
      .then((list) => setItems(list.filter((i) => i.enabled)))
      .catch(() => setItems([]));
  }, [route.params.categoryCode]);

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            navigation.navigate("Booking", {
              categoryCode: route.params.categoryCode,
              serviceTypeId: item.id,
              serviceName: item.name,
            })
          }
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
          <Text style={{ color: "#666", marginTop: 4 }}>
            {item.rateModel === "HOURLY"
              ? `${formatMyr(item.hourlyRate)} / hr`
              : item.rateModel === "HALF_OR_FULL_DAY"
                ? `${formatMyr(item.rateAmSlot)} half-day · ${formatMyr(item.rateFullDay)} full-day`
                : item.rateModel}
          </Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888" }}>No services.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 14,
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e7ed",
  },
});
