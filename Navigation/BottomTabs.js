import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  FontAwesome,
  AntDesign,
  MaterialCommunityIcons,
} from "react-native-vector-icons";

import Home from "../Screen/Home/Home";
import Gempa from "../Screen/Gempa/Gempa";
import Cuaca from "../Screen/Cuaca/Cuaca";

const Tab = createBottomTabNavigator();

export default function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        activeTintColor: "#1E90FF", // Warna ikon aktif
        inactiveTintColor: "gray", // Warna ikon non-aktif
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
          title: "Beranda",
        }}
      />
      <Tab.Screen
        name="Cuaca"
        component={Cuaca}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="weather-cloudy"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Gempa"
        component={Gempa}
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="linechart" size={size} color={color} />
          ),
          title:"Informasi Gempa ≥ 5.0",
          tabBarLabel: "Gempa Bumi",
        }}
      />
    </Tab.Navigator>
  );
}
