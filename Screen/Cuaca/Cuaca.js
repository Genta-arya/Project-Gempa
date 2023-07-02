import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { xml2json } from "xml-js";
const moment = require("moment");
import { AntDesign, Ionicons, Entypo,FontAwesome5  } from "@expo/vector-icons";

import * as Location from "expo-location";

const Cuaca = () => {
  const [initialRegion, setInitialRegion] = useState(null);
  const [initialRegionUser, setInitialRegionUser] = useState(null);

  const [forecastData, setForecastData] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [locationCuaca, setLocationCuaca] = useState(null);
  const [cityName, setCityName] = useState("");
  const [refreshTimer, setRefreshTimer] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    fetchForecastData();
    getLocation();
  }, []);

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

      // Panggil getLocationInfo setelah mendapatkan data gempa
      getLocationInfo(locLatitude, locLongitude);
    } catch (error) {
      console.log("Terjadi kesalahan dalam mendapatkan lokasi:", error);
    }
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
    refreshLocation();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
    return <Ionicons name={iconName} size={50} color="#1E90FF" style={{marginRight:20,}}/>;
  };

  const refreshLocation = () => {
    setInitialRegion(null);
    setLocationInfo(null);
    setCityName("");

    fetchForecastData();
    getLocation();
  };

  const renderForecastInfo = () => {
    if (forecastData) {
      return forecastData.map((data, index) => (
        <TouchableOpacity
          key={index}
          style={styles.weatherItemContainer}
          onPress={() => {}}
        >
          <View style={styles.weatherItemLeft}>
            <View style={styles.dateTimeContainer}>
              <AntDesign
                name="clockcircleo"
                size={24}
                color="#1E90FF"
                style={styles.clockIcon}
              />
              <Text style={styles.weatherItemDate}>{data.datetime}</Text>
            </View>
            <View style={styles.dateTimeContainers}>
              <FontAwesome5
                name="temperature-high"
                size={24}
                color="red"
                style={styles.clockIcons}
              />
              <Text style={styles.weatherItemDate}> {data.temperatureValueC}°C / {data.temperatureValueF}°F</Text>
            </View>
            <View style={styles.dateTimeContainers}>
             
              <Text style={styles.weatherItemDate}>{data.weatherDescription}</Text>
            </View>
          </View>
          <View style={styles.weatherItemRight}>
            {getWeatherIcon(data.weatherDescription)}
          </View>
        </TouchableOpacity>
      ));
    } else {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Gagal Mengambil data cuaca. Silahkan Refresh...
          </Text>
        </View>
      );
    }
  };    
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Entypo name="location" size={30} color="red" />
        <Text style={styles.locationText}>
          Lokasi Anda: {locationInfo || "Mencari lokasi..."}
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing ? "Memperbarui..." : "Perbarui Data Cuaca"}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Info Cuaca Terkini:</Text>
          {renderForecastInfo()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    header: {
      backgroundColor: "white",
      padding: 10,
      paddingBottom:30,
      elevation: 20,
      alignItems: "center",
      borderBottomLeftRadius:60,
      borderBottomRightRadius:60,
    },
    refreshButton: {
      padding: 10,
      backgroundColor: "#1E90FF",
      borderRadius: 15,
      marginTop: 10,
      elevation: 20,
    },
    refreshButtonText: {
      fontSize: 13,
      fontWeight: "bold",
      color: "white",
    },
    locationText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 5,
      marginTop: 15,
      textAlign: "center",
    },
    scrollContainer: {
      flexGrow: 1,
      marginTop: 10,
      paddingBottom:30,
    },
    infoContainer: {
      paddingHorizontal: 10,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      marginTop:20,
    },
    weatherItemContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      padding: 10,
      borderRadius: 5,
      elevation:2,
      paddingBottom:10,
    },
    weatherItemLeft: {
      flex: 1,
      marginLeft: 10,
    },
    weatherItemRight: {
      marginLeft: 20,
    },
    weatherItemDate: {
      flexDirection: "row",
      alignItems: "center",
    },
    weatherItemTemp: {
      fontSize: 14,
      color: "#333",
    },
    weatherItemDesc: {
      fontSize: 14,
      color: "#333",
    },
    loadingContainer: {
      alignItems: "center",
      marginTop: 10,
    },
    loadingText: {
      fontSize: 16,
      fontStyle: "italic",
      color: "#333",
      alignSelf: "center",
    },
    dateTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
      marginTop:10,
    },
    dateTimeContainers: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop:10,
      },
    clockIcon: {
      marginRight: 5,
    },
    clockIcons: {
        marginRight: 5,
        marginLeft:5,
      },
    weatherItemDate: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginRight: 5,
    },
    temperatureContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
    },
    temperatureIcon: {
      marginRight: 5,
    },
  });
export default Cuaca;
