import React, { useContext } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../utils/ThemeContext';
import { typography } from '../utils/theme';

const logo = require('../logo_UnMute.jpg-.png');

const STEPS = [
  { number: 1, icon: 'phone-portrait-outline', label: 'Open the app and select your language pair' },
  { number: 2, icon: 'hand-left-outline', label: 'Sign naturally in front of your camera' },
  { number: 3, icon: 'sparkles-outline', label: 'AI reads and interprets your signs in real time' },
  { number: 4, icon: 'volume-high-outline', label: 'Your phone speaks the translation aloud' },
];

const HOW_IT_WORKS = [
  { label: 'You Sign', icon: 'hand-left-outline' },
  { label: 'AI Reads', icon: 'sparkles-outline' },
  { label: 'Phone Speaks', icon: 'volume-high-outline' },
  { label: 'They Hear', icon: 'ear-outline' },
];

function StepItem({ step, theme }) {
  return (
    <View style={[styles.stepRow, { borderColor: theme.cardBorder, backgroundColor: theme.cardBg }]}>
      <View style={[styles.stepNumberBadge, { backgroundColor: theme.accentPurple ?? '#7c3aed' }]}>
        <Text style={styles.stepNumber}>{step.number}</Text>
      </View>
      <Ionicons name={step.icon} size={20} color={theme.secondaryText} />
      <Text style={[styles.stepLabel, { color: theme.primaryText }]}>{step.label}</Text>
    </View>
  );
}

export default function MeetingScreen({ route, navigation }) {
  const { signLanguage = 'FSL', outputLanguage = 'Tagalog' } = route?.params ?? {};
  const { theme, isDark } = useContext(ThemeContext);

  return (
    <LinearGradient
      colors={[theme.bgGradientStart, theme.bgGradientEnd]}
      style={styles.gradient}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityLabel="Go back"
        >
          <Text style={[styles.headerButtonText, { color: theme.primaryText }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={logo} style={styles.logoImage} resizeMode="contain" />
          <Text style={[styles.headerTitle, { color: theme.primaryText }]}>Meeting Companion</Text>
          <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>
            {signLanguage} → {outputLanguage}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton} accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={22} color={theme.primaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Setup Guide Illustration */}
        <View style={[styles.illustrationContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Ionicons name="people-outline" size={72} color="#7c3aed" style={{ opacity: 0.25 }} />
          <View style={styles.illustrationOverlay}>
            <Text style={styles.illustrationOverlayText}>Setup Guide</Text>
            <Text style={styles.illustrationOverlayDesc}>
              Follow these steps to get started with Meeting Companion
            </Text>
          </View>
        </View>

        {/* 4-Step Instruction List */}
        <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>How to Use</Text>
        {STEPS.map((step) => (
          <StepItem key={step.number} step={step} theme={theme} />
        ))}

        {/* How It Works Flow */}
        <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>How It Works</Text>
        <View style={[styles.flowRow, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {HOW_IT_WORKS.map((item, index) => (
            <React.Fragment key={item.label}>
              <View style={styles.flowStep}>
                <Ionicons name={item.icon} size={22} color="#7c3aed" style={{ marginBottom: 4 }} />
                <Text style={[styles.flowLabel, { color: theme.primaryText }]}>{item.label}</Text>
              </View>
              {index < HOW_IT_WORKS.length - 1 && (
                <Text style={[styles.flowArrow, { color: theme.secondaryText }]}>→</Text>
              )}
            </React.Fragment>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Session', { signLanguage, outputLanguage })}
          accessibilityLabel="Start Meeting Companion"
          accessibilityRole="button"
        >
          <Text style={styles.ctaButtonText}>Start Meeting Companion</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logoImage: {
    width: 110,
    height: 40,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.appTitle,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: typography.subtitle,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  illustrationContainer: {
    borderRadius: 16,
    borderWidth: 1,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  illustrationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(124,58,237,0.82)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  illustrationOverlayText: {
    color: '#ffffff',
    fontSize: typography.cardTitle,
    fontWeight: '700',
  },
  illustrationOverlayDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.caption,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepLabel: {
    flex: 1,
    fontSize: typography.subtitle,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },
  flowStep: {
    alignItems: 'center',
    flex: 1,
  },
  flowLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  flowArrow: {
    fontSize: 18,
    paddingHorizontal: 2,
  },
  ctaButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: typography.cardTitle,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
