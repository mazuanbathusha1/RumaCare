import React, { useEffect, useState } from "react";
import { Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { api } from "../api";

interface Category {
  id: string;
  name: string;
  enabled: boolean;
}

type Props = NativeStackScreenProps<RootStackParamList, "HomeServices">;

export default function HomeServicesScreen({ navigation }: Props) {
  const [items, setItems] = useState<Category[]>([]);

  useEffect(() => {
    api<Category[]>("/home-services/categories")
      .then((list) => setItems(list.filter((i) => i.enabled)))
      .catch(() => setItems([]));
  }, []);

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            navigation.navigate("HomeServiceListings", {
              categoryId: item.id,
              categoryName: item.name,
            })
          }
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
        </TouchableOpacity>
      )}
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
