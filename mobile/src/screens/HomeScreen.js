import React, { useContext, useState } from 'react';
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

export const LANGUAGE_COMBOS = [
  { signLanguage: 'FSL', outputLanguage: 'Tagalog', label: 'FSL → Tagalog' },
  { signLanguage: 'FSL', outputLanguage: 'English', label: 'FSL → English' },
  { signLanguage: 'ASL', outputLanguage: 'English', label: 'ASL → English' },
  { signLanguage: 'ASL', outputLanguage: 'Tagalog', label: 'ASL → Tagalog' },
];

function LanguageComboCard({ combo, selected, onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={() => onPress(combo)}
      style={[
        styles.comboCard,
        {
          backgroundColor: theme.cardBg,
          borderColor: selected ? '#7c3aed' : theme.cardBorder,
          borderWidth: selected ? 2 : 1,
        },
      ]}
      accessibilityLabel={combo.label}
      accessibilityRole="button"
    >
      <Ionicons name="language-outline" size={20} color={selected ? '#7c3aed' : theme.secondaryText} style={styles.comboIcon} />
      <View style={styles.comboLabelRow}>
        <Text style={[styles.comboLangText, { color: theme.primaryText }]}>{combo.signLanguage}</Text>
        <Text style={[styles.comboArrow, { color: theme.secondaryText }]}>→</Text>
        <Text style={[styles.comboLangText, { color: theme.primaryText }]}>{combo.outputLanguage}</Text>
      </View>
    </TouchableOpacity>
  );
}

function FeatureCard({ icon, title, theme }) {
  return (
    <View
      style={[
        styles.featureCard,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color="#7c3aed" style={styles.featureIcon} />
      <Text style={[styles.featureTitle, { color: theme.primaryText }]}>{title}</Text>
    </View>
  );
}

function ModeCard({ title, description, onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.modeCard,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        },
      ]}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <View style={styles.modeCardContent}>
        <Text style={[styles.modeCardTitle, { color: theme.primaryText }]}>{title}</Text>
        <Text style={[styles.modeCardDesc, { color: theme.secondaryText }]}>{description}</Text>
      </View>
      <Text style={[styles.modeCardChevron, { color: theme.secondaryText }]}>›</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  const [selectedCombo, setSelectedCombo] = useState(null);

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* UnMute logo image */}
          <Image source={logo} style={styles.logoImage} resizeMode="contain" />
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} accessibilityLabel="Toggle theme">
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={theme.primaryText}
            />
          </TouchableOpacity>
        </View>

        {/* Welcome subtitle */}
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          Welcome back
        </Text>

        {/* Heading */}
        <Text style={[styles.heading, { color: theme.primaryText }]}>
          Choose your language combination
        </Text>

        {/* 2×2 LanguageComboCard grid */}
        <View style={styles.comboGrid}>
          {LANGUAGE_COMBOS.map((combo) => (
            <LanguageComboCard
              key={combo.label}
              combo={combo}
              selected={
                selectedCombo !== null &&
                selectedCombo.signLanguage === combo.signLanguage &&
                selectedCombo.outputLanguage === combo.outputLanguage
              }
              onPress={setSelectedCombo}
              theme={theme}
            />
          ))}
        </View>

        {/* Select Mode section */}
        <Text style={[styles.sectionHeading, { color: theme.primaryText }]}>
          Select Mode
        </Text>
        <ModeCard
          title="Conversation Mode"
          description="Real-time sign language interpretation for face-to-face conversations."
          onPress={() => {
            const combo = selectedCombo ?? { signLanguage: 'FSL', outputLanguage: 'Tagalog' };
            navigation.navigate('Session', combo);
          }}
          theme={theme}
        />
        <ModeCard
          title="Meeting Companion"
          description="Assist in meetings by converting your signs to speech for the room."
          onPress={() => {
            const combo = selectedCombo ?? { signLanguage: 'FSL', outputLanguage: 'Tagalog' };
            navigation.navigate('Meeting', combo);
          }}
          theme={theme}
        />

        {/* Key Features section */}
        <Text style={[styles.sectionHeading, { color: theme.primaryText }]}>
          Key Features
        </Text>
        <View style={styles.featureGrid}>
          {[
            { icon: 'mic-outline', title: 'Live Recognition' },
            { icon: 'chatbubbles-outline', title: 'Two-Way Chat' },
            { icon: 'people-outline', title: 'Meeting Mode' },
            { icon: 'bulb-outline', title: 'Context Aware' },
          ].map((feature) => (
            <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} theme={theme} />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logoImage: {
    width: 130,
    height: 48,
    alignSelf: 'flex-start',
    marginLeft: -20,
  },
  themeToggle: {
    padding: 8,
  },
  subtitle: {
    fontSize: typography.subtitle,
    marginBottom: 6,
  },
  heading: {
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: 24,
  },
  comboGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  comboCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
  },
  comboIcon: {
    marginBottom: 8,
  },
  comboLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comboLangText: {
    fontSize: typography.cardTitle,
    fontWeight: '600',
  },
  comboArrow: {
    fontSize: typography.cardTitle,
  },
  sectionHeading: {
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  modeCardContent: {
    flex: 1,
  },
  modeCardTitle: {
    fontSize: typography.cardTitle,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeCardDesc: {
    fontSize: typography.subtitle,
  },
  modeCardChevron: {
    fontSize: 24,
    marginLeft: 8,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  featureCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: typography.featureTitle,
    fontWeight: '600',
  },
});
