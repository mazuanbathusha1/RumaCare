import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WorkerStackParamList } from "../App";
import { api, setToken } from "../api";

type Props = NativeStackScreenProps<WorkerStackParamList, "Login">;

interface LoginResponse {
  token: string;
  user: { id: string; email: string; role: string; name: string };
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");

  async function submit() {
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email, password }
        : { email, password, name, role: "WORKER" };
      const res = await api<LoginResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await setToken(res.token);
      navigation.replace(mode === "login" ? "Dashboard" : "RegisterPartner");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Worker {mode === "login" ? "Sign in" : "Sign up"}
      </Text>
      {mode === "register" ? (
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={name}
          onChangeText={setName}
        />
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title={mode === "login" ? "Sign in" : "Sign up"} onPress={submit} />
      <Button
        title={mode === "login" ? "Create worker account" : "I have an account"}
        onPress={() => setMode(mode === "login" ? "register" : "login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 10 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
