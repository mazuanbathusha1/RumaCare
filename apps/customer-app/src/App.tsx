import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import BookingScreen from "./screens/BookingScreen";
import HomeServicesScreen from "./screens/HomeServicesScreen";
import HomeServiceListingsScreen from "./screens/HomeServiceListingsScreen";
import BecomePartnerScreen from "./screens/BecomePartnerScreen";
import BookingsScreen from "./screens/BookingsScreen";
import type { CategoryCode } from "@rumacare/shared";

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Category: { categoryCode: CategoryCode; title: string };
  Booking: { categoryCode: CategoryCode; serviceTypeId: string; serviceName: string };
  HomeServices: undefined;
  HomeServiceListings: { categoryId: string; categoryName: string };
  BecomePartner: undefined;
  MyBookings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "RumaCare" }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Category"
          component={CategoryScreen}
          options={({ route }) => ({ title: route.params.title })}
        />
        <Stack.Screen name="Booking" component={BookingScreen} options={{ title: "Book" }} />
        <Stack.Screen
          name="HomeServices"
          component={HomeServicesScreen}
          options={{ title: "Home Services" }}
        />
        <Stack.Screen
          name="HomeServiceListings"
          component={HomeServiceListingsScreen}
          options={({ route }) => ({ title: route.params.categoryName })}
        />
        <Stack.Screen
          name="BecomePartner"
          component={BecomePartnerScreen}
          options={{ title: "Be our Partner" }}
        />
        <Stack.Screen
          name="MyBookings"
          component={BookingsScreen}
          options={{ title: "My Bookings" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
