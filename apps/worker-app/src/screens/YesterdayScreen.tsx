import React, { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { api, formatMyr } from "../api";

interface Resp {
  jobs: Array<{ id: string; categoryCode: string; workerAmount: number; scheduledFor: string }>;
  totalEarned: number;
  count: number;
}

export default function YesterdayScreen() {
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    api<Resp>("/workers/jobs/yesterday").then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Yesterday</Text>
      <Text style={{ fontSize: 16 }}>
        {data.count} jobs · {formatMyr(data.totalEarned)} earned
      </Text>
      <View style={{ height: 16 }} />
      {data.jobs.map((j) => (
        <View key={j.id} style={styles.row}>
          <Text>{j.categoryCode}</Text>
          <Text>{formatMyr(j.workerAmount)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  row: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e4e7ed",
  },
});
