import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Linking, Alert } from "react-native";
import { API_URL, getToken } from "../api";

export default function ReportScreen() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  async function download() {
    const token = await getToken();
    if (!token) return Alert.alert("Sign in first");
    const url = `${API_URL}/workers/report.csv?from=${from}T00:00:00Z&to=${to}T23:59:59Z`;
    // open the authenticated CSV via fetch & share: fallback: open url
    Linking.openURL(url);
  }

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Download Report</Text>
      <Text>From</Text>
      <TextInput style={styles.input} value={from} onChangeText={setFrom} />
      <Text>To</Text>
      <TextInput style={styles.input} value={to} onChangeText={setTo} />
      <View style={{ height: 12 }} />
      <Button title="Download CSV" onPress={download} />
      <Text style={{ color: "#666", marginTop: 8, fontSize: 12 }}>
        Authentication token is required — open the CSV inside a logged-in web session.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
});
