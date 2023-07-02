import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { PanGestureHandler, State } from "react-native-gesture-handler";

const Maps = ({ route }) => {
  const { gempa } = route.params;
  const { Lintang, Bujur, Potensi } = gempa;
  const coordinates = {
    latitude: parseFloat(Lintang),
    longitude: parseFloat(Bujur),
  };
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const [showInfo, setShowInfo] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) < 5 && Math.abs(dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        translateY.setValue(dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy } = gestureState;
        if (dy < -100) {
          setShowInfo(true);
        } else if (dy > 100) {
          setShowInfo(false);
        }
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 0.5,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 7,
          longitudeDelta: 7,
        }}
      >
        <Marker coordinate={coordinates}>
          <Animated.View
            style={[styles.marker, { transform: [{ scale: pulseAnimation }] }]}
          />
        </Marker>
      </MapView>
      <PanGestureHandler
        onGestureEvent={Animated.event(
          [{ nativeEvent: { translationY: translateY } }],
          { useNativeDriver: true }
        )}
        onHandlerStateChange={(event) => {
          if (event.nativeEvent.state === State.END) {
            if (event.nativeEvent.translationY < -100 && !showInfo) {
              setShowInfo(true);
            } else if (event.nativeEvent.translationY > 100 && showInfo) {
              setShowInfo(false);
            }

            if (showInfo) {
              Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }).start();
            } else {
              Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }
          }
        }}
      >
        <Animated.View
          style={[
            styles.infoContainer,
            { transform: [{ translateY: translateY }] },
          ]}
        >
          {showInfo ? (
            <View>
            <View style={styles.indicator} />
          
            <View style={[styles.infoContent, Potensi !== 'Tidak berpotensi tsunami' && { borderColor: 'red', backgroundColor: 'red' }]}>
    <Text style={styles.infoText}>{Potensi}</Text>
  </View>
          </View>
          
          ) : (
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowInfo(true)}
            >
              <Text style={styles.infoButtonText}>Status</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = {
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "red",
    backgroundColor: "rgba(255, 0, 0, 0.3)",
  },
  infoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },

  infoButton: {
    alignSelf: "center",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  infoContent: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: "green",
    borderRadius: 20,
    padding: 10,
    backgroundColor: "green", 
  },

  infoText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color:"white",
  },

  indicator: {
    alignSelf: "center",
    width: 40,
    height: 4,
    backgroundColor: "black",
    marginTop: 1,
    marginBottom: 20,
  },
};

export default Maps;
