import * as fc from 'fast-check';
import { darkTheme, lightTheme, typography, controlColors } from '../theme';

// Feature: unmute-ui, Property 1: Theme token completeness

const DARK_THEME_REQUIRED_KEYS = [
  'bgGradientStart',
  'bgGradientEnd',
  'cardBg',
  'cardBorder',
  'primaryText',
  'secondaryText',
  'accentPurple',
  'accentBlue',
];

const LIGHT_THEME_REQUIRED_KEYS = [
  'bgGradientStart',
  'bgGradientEnd',
  'cardBg',
  'cardBorder',
  'primaryText',
  'secondaryText',
  'mutedText',
  'liveDot',
  'liveText',
];

describe('theme.js', () => {
  test('Property 1: Theme token completeness — every required key is a non-empty string', () => {
    // Validates: Requirements 1.2, 1.3
    fc.assert(
      fc.property(
        fc.constantFrom(darkTheme, lightTheme),
        (theme) => {
          const requiredKeys =
            theme === darkTheme ? DARK_THEME_REQUIRED_KEYS : LIGHT_THEME_REQUIRED_KEYS;
          return requiredKeys.every(
            (k) => typeof theme[k] === 'string' && theme[k].length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('darkTheme has all required color tokens', () => {
    DARK_THEME_REQUIRED_KEYS.forEach((key) => {
      expect(typeof darkTheme[key]).toBe('string');
      expect(darkTheme[key].length).toBeGreaterThan(0);
    });
  });

  test('lightTheme has all required color tokens', () => {
    LIGHT_THEME_REQUIRED_KEYS.forEach((key) => {
      expect(typeof lightTheme[key]).toBe('string');
      expect(lightTheme[key].length).toBeGreaterThan(0);
    });
  });

  test('typography exports all required size constants', () => {
    const keys = ['appTitle', 'heading', 'cardTitle', 'featureTitle', 'subtitle', 'caption'];
    keys.forEach((key) => {
      expect(typeof typography[key]).toBe('number');
      expect(typography[key]).toBeGreaterThan(0);
    });
  });

  test('controlColors exports all required tokens', () => {
    const keys = ['cameraBg', 'micBg', 'speakerBg', 'endBg', 'endText'];
    keys.forEach((key) => {
      expect(typeof controlColors[key]).toBe('string');
      expect(controlColors[key].length).toBeGreaterThan(0);
    });
  });

  test('darkTheme token values match Figma spec', () => {
    expect(darkTheme.bgGradientStart).toBe('#09090b');
    expect(darkTheme.bgGradientEnd).toBe('#18181b');
    expect(darkTheme.cardBg).toBe('#18181b');
    expect(darkTheme.cardBorder).toBe('#27272a');
    expect(darkTheme.primaryText).toBe('#fafafa');
    expect(darkTheme.secondaryText).toBe('#71717a');
    expect(darkTheme.accentPurple).toBe('#7c3aed');
    expect(darkTheme.accentBlue).toBe('#3b82f6');
  });

  test('lightTheme token values match Figma spec', () => {
    expect(lightTheme.bgGradientStart).toBe('#ffffff');
    expect(lightTheme.bgGradientEnd).toBe('#f2f1f6');
    expect(lightTheme.cardBg).toBe('#ffffff');
    expect(lightTheme.cardBorder).toBe('#e2e0ec');
    expect(lightTheme.primaryText).toBe('#0f0d1a');
    expect(lightTheme.secondaryText).toBe('#5e5977');
    expect(lightTheme.mutedText).toBe('#9994ad');
    expect(lightTheme.liveDot).toBe('#00d492');
    expect(lightTheme.liveText).toBe('#00bc7d');
  });
});
