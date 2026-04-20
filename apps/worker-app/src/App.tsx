import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import LoginScreen from "./screens/LoginScreen";
import RegisterPartnerScreen from "./screens/RegisterPartnerScreen";
import DashboardScreen from "./screens/DashboardScreen";
import OffersScreen from "./screens/OffersScreen";
import JobsScreen from "./screens/JobsScreen";
import JobDetailsScreen from "./screens/JobDetailsScreen";
import YesterdayScreen from "./screens/YesterdayScreen";
import ReportScreen from "./screens/ReportScreen";

export type WorkerStackParamList = {
  Login: undefined;
  RegisterPartner: undefined;
  Dashboard: undefined;
  Offers: undefined;
  Jobs: undefined;
  JobDetails: { bookingId: string };
  Yesterday: undefined;
  Report: undefined;
};

const Stack = createNativeStackNavigator<WorkerStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Dashboard">
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegisterPartner" component={RegisterPartnerScreen} />
        <Stack.Screen name="Offers" component={OffersScreen} />
        <Stack.Screen name="Jobs" component={JobsScreen} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
        <Stack.Screen name="Yesterday" component={YesterdayScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
