import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import moment from "moment";
import { AntDesign, EvilIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation } from '@react-navigation/native';

const Gempa = () => {
  const [gempaList, setGempaList] = useState([]);
  const [animationValue] = useState(new Animated.Value(1));
  const [locationInfo, setLocationInfo] = useState(null);
  const [initialRegionUser, setInitialRegionUser] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchGempaData();
    startPulseAnimation();
    getLocation();
  
    const interval = setInterval(() => {
      fetchGempaData();
    }, 5000);
  
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  const getLocationInfo = async (latitude, longitude) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.address) {
        const { city, municipality } = data.address;
        const locationInfo = municipality || "";

        console.log("Lokasi Anda:", municipality);
        setLocationInfo(locationInfo);
      } else {
        console.log(
          "Tidak dapat menemukan informasi lokasi untuk koordinat ini."
        );
        setLocationInfo("");
      }
    } catch (error) {
      console.error(
        "Terjadi kesalahan dalam mendapatkan informasi lokasi:",
        error
      );
      setLocationInfo("");
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Izin lokasi tidak diberikan");
        return;
      }

      const location = await Location.getCurrentPositionAsync();
      const { latitude: locLatitude, longitude: locLongitude } =
        location.coords;

      const delta = 1;
      const region = {
        latitude: locLatitude,
        longitude: locLongitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      };
      setInitialRegionUser(region);

      getLocationInfo(locLatitude, locLongitude);
    } catch (error) {
      console.log("Terjadi kesalahan dalam mendapatkan lokasi:", error);
    }
  };

  const fetchGempaData = async () => {
    try {
      const response = await fetch(
        "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"
      );
      const data = await response.json();
      const gempaList = data.Infogempa.gempa;
      setGempaList(gempaList);
    } catch (error) {
      console.log("Failed to fetch gempa data", error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const formatDateTime = (dateTime) => {
    const formattedDateTime = moment(dateTime);
    const formattedTime = formattedDateTime.format("HH:mm:ss");
    const formattedDate = formattedDateTime.format("YYYY-MM-DD");
    return `${formattedTime} ${formattedDate}`;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance.toFixed(2); // Return distance rounded to 2 decimal places
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleGempaPress = (gempa) => {
    navigation.navigate('Maps', { gempa });
  };
  

  return (
    <ScrollView style={styles.container}>
      {gempaList.map((gempa, index) => {
        const distance =
          initialRegionUser &&
          calculateDistance(
            initialRegionUser.latitude,
            initialRegionUser.longitude,
            parseFloat(gempa.Lintang),
            parseFloat(gempa.Bujur)
          );

        const animatedStyle = {
          transform: [{ scale: animationValue }],
        };

        return (
          <TouchableOpacity key={index} style={styles.gempaItem} onPress={() => handleGempaPress(gempa)}>
            <Animated.View
              style={[styles.gempaMagnitudeContainer, animatedStyle]}
            >
              <Text style={styles.gempaMagnitude}>{gempa.Magnitude}</Text>
            </Animated.View>
            <View style={styles.gempaDetailsContainer}>
              <View style={styles.gempaLocationContainer}>
                <Text style={styles.gempaLocation}>{gempa.Wilayah}</Text>
              </View>

              <AntDesign name="calendar" size={20} color="#1E90FF" />
              <Text style={styles.gempaTime}>
                {formatDateTime(gempa.DateTime)}
              </Text>
              <EvilIcons name="location" size={20} color="red" />
              {distance && (
                <Text style={styles.gempaDistance}>
                  <Text>{`${distance} km dari ${locationInfo}`}</Text>
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  gempaItem: {
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "black",
    padding: 10,
    borderRadius: 20,
    elevation: 1,
    flexDirection: "row",
  },
  gempaMagnitudeContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: "#ff0000",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginRight: 10,
    marginLeft: 20,
  },
  gempaMagnitude: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    

  },
  gempaDetailsContainer: {
    flex: 1,
    marginLeft: 20,
  },
  gempaLocationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gempaLocation: {
    fontSize: 18,
    marginBottom: 5,
    fontWeight: "bold",
  },
  gempaDepth: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  gempaTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    marginTop: 5,
  },
  gempaDistance: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
});

export default Gempa;
