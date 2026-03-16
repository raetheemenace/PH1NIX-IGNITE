import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image, StyleSheet } from 'react-native';

const logo = require('../logo_UnMute.jpg-.png');

export default function SplashScreen({ navigation }) {
  // Three dot animation values
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Sequential dot opacity animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ])
    );
    animation.start();

    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2500);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [navigation, dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={logo} style={styles.logoImage} resizeMode="contain" />

      {/* Tagline */}
      <Text style={styles.tagline}>Bridging silence and sound</Text>

      {/* Animated 3-dot loader */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 180,
    height: 80,
    marginBottom: 12,
  },
  tagline: {
    color: '#71717a',
    fontSize: 13.6,
    fontFamily: 'Inter_400Regular',
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
  },
});
