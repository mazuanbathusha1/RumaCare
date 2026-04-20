import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { api, getToken } from "../api";
import type { CategoryCode } from "@rumacare/shared";

interface Category {
  code: CategoryCode;
  name: string;
  description: string;
  order: number;
  bookable: boolean;
  isDirectory: boolean;
}

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const ICONS: Record<CategoryCode, string> = {
  PERSONAL_NURSING: "🏥",
  CLEANING: "🧹",
  NANNY: "🍼",
  TUITION: "📚",
  HOME_SERVICES: "🔧",
  PARTNER: "🤝",
};

export default function HomeScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        navigation.replace("Login");
        return;
      }
      try {
        const list = await api<Category[]>("/categories");
        setCategories(list);
      } catch {
        navigation.replace("Login");
      }
    })();
  }, [navigation]);

  function open(cat: Category) {
    if (cat.code === "HOME_SERVICES") return navigation.navigate("HomeServices");
    if (cat.code === "PARTNER") return navigation.navigate("BecomePartner");
    return navigation.navigate("Category", { categoryCode: cat.code, title: cat.name });
  }

  return (
    <ScrollView contentContainerStyle={styles.grid}>
      <TouchableOpacity
        style={styles.bookingsLink}
        onPress={() => navigation.navigate("MyBookings")}
      >
        <Text style={{ color: "#1f6feb", fontWeight: "600" }}>View my bookings →</Text>
      </TouchableOpacity>
      {categories.map((c) => (
        <TouchableOpacity key={c.code} style={styles.tile} onPress={() => open(c)}>
          <Text style={styles.icon}>{ICONS[c.code]}</Text>
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.desc}>{c.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { padding: 16, gap: 12, flexDirection: "row", flexWrap: "wrap" },
  bookingsLink: { width: "100%", paddingBottom: 12 },
  tile: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e7ed",
  },
  icon: { fontSize: 32 },
  name: { fontSize: 16, fontWeight: "700", marginTop: 8 },
  desc: { fontSize: 12, color: "#555", marginTop: 4 },
});
