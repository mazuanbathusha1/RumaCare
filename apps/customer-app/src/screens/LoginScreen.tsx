import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { api, setToken } from "../api";
import { registerForPushNotificationsAsync } from "../push";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

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
      if (mode === "login") {
        const res = await api<LoginResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        await setToken(res.token);
      } else {
        const res = await api<LoginResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            role: "CUSTOMER",
            name,
            email,
            password,
          }),
        });
        await setToken(res.token);
      }
      registerForPushNotificationsAsync().catch(() => undefined);
      navigation.replace("Home");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === "login" ? "Sign in" : "Create account"}</Text>
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
      <View style={{ height: 8 }} />
      <Button
        title={mode === "login" ? "Create an account instead" : "I have an account"}
        onPress={() => setMode(mode === "login" ? "register" : "login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
