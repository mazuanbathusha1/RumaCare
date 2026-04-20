import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WorkerStackParamList } from "../App";
import { API_URL, getToken } from "../api";
import type { CategoryCode } from "@rumacare/shared";

type Props = NativeStackScreenProps<WorkerStackParamList, "RegisterPartner">;

const CATEGORY_LABELS: Array<{ code: CategoryCode; label: string }> = [
  { code: "PERSONAL_NURSING", label: "Home Personal & Nursing Care" },
  { code: "CLEANING", label: "Cleaning" },
  { code: "NANNY", label: "Nanny" },
  { code: "TUITION", label: "Tuition" },
  { code: "HOME_SERVICES", label: "Home Services" },
];

export default function RegisterPartnerScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [ic, setIc] = useState("");
  const [address, setAddress] = useState("");
  const [bank, setBank] = useState("");
  const [acct, setAcct] = useState("");
  const [ssm, setSsm] = useState("");
  const [cats, setCats] = useState<CategoryCode[]>([]);
  const [icCopyUri, setIcCopyUri] = useState("");
  const [selfieUri, setSelfieUri] = useState("");
  const [nursingUri, setNursingUri] = useState("");

  function toggle(c: CategoryCode) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function submit() {
    if (!fullName || !ic || !address || !bank || !acct || cats.length === 0) {
      Alert.alert("Fill all fields", "Please complete the form");
      return;
    }
    if (!icCopyUri || !selfieUri) {
      Alert.alert("Photos", "Please provide IC copy and selfie paths/URLs");
      return;
    }
    if (cats.includes("PERSONAL_NURSING") && !nursingUri) {
      Alert.alert("Nursing Cert", "Nursing cert required for Home Personal & Nursing Care");
      return;
    }

    const form = new FormData();
    form.append("fullName", fullName);
    form.append("icNumber", ic);
    form.append("addressLine", address);
    form.append("bankName", bank);
    form.append("bankAccountNumber", acct);
    if (ssm) form.append("ssmNumber", ssm);
    form.append("categoriesJson", JSON.stringify(cats));
    // Paths -> RN FormData file descriptor
    const asFile = (uri: string, name: string) =>
      ({ uri, name, type: "image/jpeg" }) as unknown as Blob;
    form.append("icCopy", asFile(icCopyUri, "ic.jpg"));
    form.append("selfie", asFile(selfieUri, "selfie.jpg"));
    if (nursingUri) form.append("nursingCert", asFile(nursingUri, "nursing.jpg"));

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/partners/submit`, {
        method: "POST",
        body: form as unknown as BodyInit,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      Alert.alert("Submitted", "Partner application submitted for review.");
      navigation.replace("Dashboard");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.c}>
      <Text style={styles.title}>Be our Partner</Text>
      <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="IC number" value={ic} onChangeText={setIc} />
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Bank name" value={bank} onChangeText={setBank} />
      <TextInput style={styles.input} placeholder="Bank account number" value={acct} onChangeText={setAcct} />
      <TextInput style={styles.input} placeholder="SSM (optional, for businesses)" value={ssm} onChangeText={setSsm} />
      <TextInput style={styles.input} placeholder="IC copy file URI" value={icCopyUri} onChangeText={setIcCopyUri} />
      <TextInput style={styles.input} placeholder="Selfie file URI" value={selfieUri} onChangeText={setSelfieUri} />
      <TextInput
        style={styles.input}
        placeholder="Nursing cert URI (required for Cat 1)"
        value={nursingUri}
        onChangeText={setNursingUri}
      />
      <Text style={{ marginTop: 10, fontWeight: "600" }}>Categories</Text>
      {CATEGORY_LABELS.map((c) => (
        <Button
          key={c.code}
          title={(cats.includes(c.code) ? "◉ " : "○ ") + c.label}
          onPress={() => toggle(c.code)}
        />
      ))}
      <View style={{ height: 12 }} />
      <Button title="Submit application" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
});
