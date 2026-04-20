import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BecomePartnerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Be our Partner</Text>
      <Text style={styles.body}>
        Use the Worker app to complete partner registration. You&apos;ll need:
      </Text>
      <Text style={styles.li}>• Full name and IC number</Text>
      <Text style={styles.li}>• A photo/scan of your IC</Text>
      <Text style={styles.li}>• A current selfie</Text>
      <Text style={styles.li}>• Home address</Text>
      <Text style={styles.li}>• Bank name and account number</Text>
      <Text style={styles.li}>• SSM number (if you run a business)</Text>
      <Text style={styles.li}>
        • Nursing certificate (required for Home Personal &amp; Nursing Care)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 6 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  body: { color: "#333" },
  li: { color: "#555", marginTop: 2 },
});
