import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Linking,
  PanResponder,
  Dimensions,
  FlatList,
} from "react-native";
import moment from "moment";
import axios from "axios";
import { xml2json } from "xml-js";
import { Entypo } from "@expo/vector-icons";

import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

import MapView, { Marker, Circle, Callout } from "react-native-maps";

import * as Location from "expo-location";

const screenWidth = Dimensions.get("window").width;
const MapScreen = () => {
  const [initialRegion, setInitialRegion] = useState(null);
  const [initialRegionUser, setInitialRegionUser] = useState(null);
  const [wilayah, setWilayah] = useState("");
  const [calloutVisible, setCalloutVisible] = useState(true);
  const [gempaData, setGempaData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [locationCuaca, setLocationCuaca] = useState(null);
  const [cityName, setCityName] = useState("");
  const [distance, setDistance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchForecastData();
    getLocation();
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGempaData();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    if (circleRef.current) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(circleRef.current, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(circleRef.current, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const circleRef = useRef(null);

  const handleCalloutPress = () => {
    // Open Google Maps with the specified latitude and longitude
    const latitude = initialRegion.latitude;
    const longitude = initialRegion.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const getLocationInfo = async (latitude, longitude) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.address) {
        const { municipality, state, country, city } = data.address;
        const locationInfo = municipality || "";
        const locationInfos = city || "";
        console.log("Lokasi Anda:", city);
        setLocationInfo(locationInfo);
        setLocationCuaca(locationInfos);
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
      console.log(region);

      // Panggil fetchGempaData setelah mendapatkan lokasi pengguna
      fetchGempaData(locLatitude, locLongitude).then(() => {
        // Panggil getLocationInfo setelah mendapatkan data gempa
        getLocationInfo(locLatitude, locLongitude);
      });
    } catch (error) {
      console.log("Terjadi kesalahan dalam mendapatkan lokasi:", error);
    }
  };

  const fetchGempaData = (latitude, longitude) => {
    const url = `https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json`;
    return fetch(url)
      .then((response) => response.json())
      .then((jsonData) => {
        const gempa = jsonData.Infogempa.gempa;
        const coordinates = gempa.Coordinates.split(",");
        const gempaLatitude = parseFloat(coordinates[0]);
        const gempaLongitude = parseFloat(coordinates[1]);

        const delta = 4.5;
        const region = {
          latitude: gempaLatitude,
          longitude: gempaLongitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        };
        setInitialRegion(region);
        setGempaData(gempa);

        // Extract the wilayah data and set it in the state
        const wilayah = gempa.Wilayah;
        setWilayah(wilayah);

        if (latitude && longitude) {
          const distanceInKm = getDistance(
            latitude,
            longitude,
            gempaLatitude,
            gempaLongitude
          );
          setDistance(distanceInKm);
        }
      })
      .catch((error) => {
        console.log("Terjadi kesalahan dalam mengambil data gempa:", error);
      });
  };

  const fetchForecastData = () => {
    const url =
      "https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-JawaTengah.xml";

    axios
      .get(url)
      .then((response) => {
        const xmlData = response.data;

        const jsonData = xml2json(xmlData, { compact: true, spaces: 4 });
        const parsedData = JSON.parse(jsonData);

        const areas = parsedData.data.forecast.area;

        const semarangArea = Array.isArray(areas)
          ? areas.find((area) => area._attributes.description === locationCuaca)
          : undefined;

        if (semarangArea) {
          console.log("Daerah:", semarangArea._attributes.description);

          if (semarangArea.parameter) {
            const weatherParameter = Array.isArray(semarangArea.parameter)
              ? semarangArea.parameter.find(
                  (param) => param._attributes.id === "weather"
                )
              : semarangArea.parameter._attributes.id === "weather"
              ? semarangArea.parameter
              : undefined;

            const temperatureParameter = Array.isArray(semarangArea.parameter)
              ? semarangArea.parameter.find(
                  (param) => param._attributes.id === "t"
                )
              : semarangArea.parameter._attributes.id === "t"
              ? semarangArea.parameter
              : undefined;

            if (weatherParameter && temperatureParameter) {
              const weatherTimeranges = weatherParameter.timerange;
              const temperatureTimeranges = temperatureParameter.timerange;

              const forecastData = weatherTimeranges.map(
                (weatherTimerange, index) => {
                  const datetime = weatherTimerange._attributes.datetime;

                  const formattedDatetime = moment(
                    datetime,
                    "YYYYMMDDHHmm"
                  ).format("DD MMMM YYYY, HH:mm");
                  console.log("ini data : ",formattedDatetime )
                  const weatherValue = weatherTimerange.value._text;

                  // Find matching temperature timerange
                  const temperatureTimerange = temperatureTimeranges[index];
                  const temperatureValueC = temperatureTimerange.value.find(
                    (value) => value._attributes.unit === "C"
                  )._text;
                  const temperatureValueF = temperatureTimerange.value.find(
                    (value) => value._attributes.unit === "F"
                  )._text;

                  let weatherDescription = "";

                  switch (weatherValue) {
                    case "0":
                      weatherDescription = "Cerah / Clear Skies";
                      break;
                    case "1":
                      weatherDescription = "Cerah Berawan / Partly Cloudy";
                      break;
                    case "2":
                      weatherDescription = "Cerah Berawan / Partly Cloudy";
                      break;
                    case "3":
                      weatherDescription = "Berawan / Mostly Cloudy";
                      break;
                    case "4":
                      weatherDescription = "Berawan Tebal / Overcast";
                      break;
                    case "5":
                      weatherDescription = "Udara Kabur / Haze";
                      break;
                    case "10":
                      weatherDescription = "Asap / Smoke";
                      break;
                    case "45":
                      weatherDescription = "Kabut / Fog";
                      break;
                    case "60":
                      weatherDescription = "Hujan Ringan / Light Rain";
                      break;
                    case "61":
                      weatherDescription = "Hujan Sedang / Rain";
                      break;
                    case "63":
                      weatherDescription = "Hujan Lebat / Heavy Rain";
                      break;
                    case "80":
                      weatherDescription = "Hujan Lokal / Isolated Shower";
                      break;
                    case "95":
                      weatherDescription = "Hujan Petir / Severe Thunderstorm";
                      break;
                    case "97":
                      weatherDescription = "Hujan Petir / Severe Thunderstorm";
                      break;
                    default:
                      weatherDescription = "Informasi cuaca tidak tersedia.";
                  }

                  return {
                    datetime: formattedDatetime,
                    weatherDescription,
                    temperatureValueC,
                    temperatureValueF,
                  };
                }
              );

              setForecastData(forecastData);
            } else {
              console.log("Weather level or temperature data not available.");
            }
          } else {
            console.log("Parameter data not available.");
          }
        } else {
          console.log("Semarang area not found.");
        }
      })
      .catch((error) => {
        console.log("Terjadi kesalahan dalam mengambil data forecast:", error);
      });
  };
  const onRefresh = () => {
    setRefreshing(true);
    refreshLocation(); // Panggil fungsi refreshLocation di sini
    setTimeout(() => {
      setRefreshing(false);
    }, 1000); // Atur waktu penundaan untuk menghentikan indikator refresh
  };

  const renderGempaInfo = () => {
    if (gempaData) {
      const {
        Tanggal: tanggal,
        Jam: jam,
        Magnitude: magnitude,
        Kedalaman: kedalaman,

        Wilayah: wilayah,
      } = gempaData;

      return (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Info Gempa Terkini:</Text>

          <View style={styles.gempaItem}>
            <Text style={styles.gempaItemLabel}>Tanggal:</Text>
            <Text style={styles.gempaItemValue}>{tanggal}</Text>
          </View>

          <View style={styles.gempaItem}>
            <Text style={styles.gempaItemLabel}>Jam:</Text>
            <Text style={styles.gempaItemValue}>{jam}</Text>
          </View>

          <View style={styles.gempaItem}>
            <Text style={styles.gempaItemLabel}>Magnitude:</Text>
            <Text style={styles.gempaItemValue}>{magnitude}</Text>
          </View>

          <View style={styles.gempaItem}>
            <Text style={styles.gempaItemLabel}>Kedalaman:</Text>
            <Text style={styles.gempaItemValue}>{kedalaman}</Text>
          </View>

          <View style={styles.gempaItem}>
            <Text style={styles.gempaItemLabel}>Wilayah:</Text>
            <Text style={styles.gempaItemValue}>{wilayah}</Text>
          </View>

          <View style={styles.gempaItem}>
            <Text style={styles.gempaItemLabel}>Jarak:</Text>
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceText}>
                {distance} km dari {locationInfo}
              </Text>
            </View>
          </View>
        </View>
      );
    } else {
      return <Text style={styles.loadingText}>Loading...</Text>;
    }
  };
  const renderCuacaInfo = () => {
    if (!forecastData) {
      return null;
    }
  
    const currentDate = new Date();
    const formattedDate = moment(currentDate).format("DD MMMM YYYY");

    const filteredData = forecastData.filter(
      (data) => data.datetime.split(",")[0] === formattedDate
    );

    if (filteredData.length === 0) {
      return (
        <Text style={styles.infoText}>
          Tidak ada data cuaca untuk tanggal saat ini.
        </Text>
      );
    }
  
    return (
      <View style={styles.cuacaInfoContainer}>
        <Text style={styles.cuacaInfoTitle}>Perkiraan Cuaca</Text>
        <Text style={styles.cuacaInfoTitles}>Hari ini</Text>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.datetime}
          renderItem={({ item }) => (
            <View style={styles.weatherItemContainer}>
              <View style={styles.weatherItemIconContainer}>
                {getWeatherIcon(item.weatherDescription)}
              </View>
              <View style={styles.weatherItemTextContainer}>
                <Text style={styles.weatherItemDate}>{item.datetime}</Text>
                <Text style={styles.weatherItemDesc}>
                  {item.weatherDescription}
                </Text>
                <Text style={styles.weatherItemTemp}>
                  {`${item.temperatureValueC}°C / ${item.temperatureValueF}°F`}
                </Text>
              </View>
            </View>
          )}
          horizontal={true}
        />
      </View>
    );
  };
  
  

  const getWeatherIcon = (weatherDescription) => {
    let iconName = "help-circle-outline";
    switch (weatherDescription) {
      case "Cerah / Clear Skies":
        iconName = "sunny-outline";
        break;
      case "Cerah Berawan / Partly Cloudy":
        iconName = "partly-sunny-outline";
        break;
      case "Berawan / Mostly Cloudy":
        iconName = "cloud-outline";
        break;
      case "Berawan Tebal / Overcast":
        iconName = "cloudy-outline";
        break;
      case "Udara Kabur / Haze":
        iconName = "eye-outline";
        break;
      case "Asap / Smoke":
        iconName = "cloudy-outline";
        break;
      case "Kabut / Fog":
        iconName = "cloudy-outline";
        break;
      case "Hujan Ringan / Light Rain":
        iconName = "rainy-outline";
        break;
      case "Hujan Sedang / Rain":
        iconName = "rainy-outline";
        break;
      case "Hujan Lebat / Heavy Rain":
        iconName = "rainy-outline";
        break;
      case "Hujan Lokal / Isolated Shower":
        iconName = "rainy-outline";
        break;
      case "Hujan Petir / Severe Thunderstorm":
        iconName = "bolt";
        break;
      default:
        break;
    }
    return (
      <Ionicons
        name={iconName}
        size={24}
        color="#1E90FF"
        style={{ marginRight: 20 }}
      />
    );
  };

  <View style={styles.mapContainer}>
    {initialRegion && (
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
      >
        <Circle
          center={initialRegion}
          radius={70000}
          fillColor="rgba(255, 0, 0, 0.2)"
          strokeColor="rgba(100, 150, 255, 0.5)"
          strokeWidth={2}
          zIndex={2}
        />
        {gempaData && (
          <Marker coordinate={initialRegion} pinColor="red">
            <Callout onPress={handleCalloutPress}>
              <TouchableOpacity>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutText}>{wilayah}</Text>
                </View>
              </TouchableOpacity>
            </Callout>
          </Marker>
        )}
      </MapView>
    )}
    <Animated.View
      style={[
        styles.circleOverlay,
        {
          transform: [{ scale: animationValue }],
          borderStyle: "solid",
          borderWidth: 2,
          borderColor: "red",
        },
      ]}
    />
  </View>;

  const refreshLocation = () => {
    setInitialRegion(null);
    setLocationInfo(null);
    setCityName("");
    fetchGempaData();
    fetchForecastData();
    getLocation();
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(2); // Mengembalikan jarak dengan dua angka desimal
  };

  const animationValue = new Animated.Value(1);

  // Create an animation
  Animated.timing(animationValue, {
    toValue: 20, // Set the desired scale value
    duration: 2000, // Set the duration of the animation in milliseconds
    useNativeDriver: true, // Enable the native driver for performance
  }).start(); // Start the animation
  const toRad = (value) => {
    return value * (Math.PI / 180);
  };
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={styles.scrollContainer}
        data={[1]} // Dummy data, karena tidak ada daftar item yang ditampilkan
        keyExtractor={(item, index) => index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={() => (
          <View>
            <View style={styles.mapContainer}>
              {initialRegion && (
                <MapView
                  style={styles.map}
                  initialRegion={initialRegion}
                  showsUserLocation={true}
                >
                  <AnimatedCircle
                    center={initialRegion}
                    radius={animationValue.interpolate({
                      inputRange: [1, 2],
                      outputRange: [20000, 25000],
                    })}
                    fillColor="rgba(255, 0, 0, 0.2)"
                    strokeColor="rgba(100, 150, 255, 0.5)"
                    strokeWidth={5}
                    zIndex={20}
                  />
                  {gempaData && (
                    <Marker coordinate={initialRegion} pinColor="red">
                      <Callout onPress={handleCalloutPress}>
                        <TouchableOpacity>
                          <View style={styles.calloutContainer}>
                            <Text style={styles.calloutText}>{wilayah}</Text>
                          </View>
                        </TouchableOpacity>
                      </Callout>
                    </Marker>
                  )}
                </MapView>
              )}
            </View>

            <View style={[styles.infoSection, { marginBottom: 10 }]}>
              {renderGempaInfo()}
              {renderCuacaInfo()}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    flexGrow: 1,
    marginTop: 10,
  },
  refreshButton: {
    marginVertical: 10,
    alignSelf: "center",
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 5,
    marginBottom: 5,
    borderRadius: 15,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  infoSection: {
    marginHorizontal: 10,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 10,
    color: "#333",
    flex: 1,
  },
  infoContainer: {
    backgroundColor: "white", // Ubah menjadi warna biru yang diinginkan
    padding: 10,
    borderRadius: 25,
    marginBottom: 10,
    elevation: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  gempaItemContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "white",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  distanceIcon: {
    marginRight: 5,
  },
  distanceText: {
    fontSize: 14,
    color: "#555",
    marginTop: -10,
  },
  loadingText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#333",
    alignSelf: "center",
  },

  gempaItemContainer: {
    flexDirection: "column",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
  gempaItemLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
    marginTop: 10,
  },
  gempaItemValuesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  gempaItemValues: {
    fontSize: 14,
    color: "#555",
  },
  calloutContainer: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
  },
  calloutText: {
    fontSize: 16,
  },

  cuacaInfoContainer: {
    backgroundColor: "white",
    elevation: 20,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  cuacaInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    
    alignSelf: "center",
    marginTop: 20,
  },
  cuacaInfoTitles: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "center",
    marginTop: 10,
  },
  weatherItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    elevation: 15,
    marginBottom: 20,
    marginRight: 10, // Mengatur jarak antar item cuaca
    backgroundColor: "white", // Warna latar belakang
    borderRadius: 25, // Mengatur sudut border
  },
  weatherItemIconContainer: {
    marginRight: 10,
  },
  weatherItemTextContainer: {},
  weatherItemDate: {
    fontSize: 16,
    marginBottom: 4,
  },
  weatherItemDesc: {
    fontSize: 14,
    marginBottom: 4,
  },
  weatherItemTemp: {
    fontSize: 14,
  },
});

export default MapScreen;
