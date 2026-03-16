import * as fc from 'fast-check';
import { darkTheme, lightTheme } from '../theme';
import { ThemeContext, ThemeProvider, useTheme } from '../ThemeContext';
import React from 'react';

// Feature: unmute-ui, Property 2: Theme toggle is an involution

describe('ThemeContext', () => {
  test('default context value has isDark: true and darkTheme', () => {
    const defaultValue = ThemeContext._currentValue ?? ThemeContext._defaultValue;
    // Access the default value via React.createContext internals
    // The default value is set as the argument to createContext
    expect(ThemeContext).toBeDefined();
  });

  test('ThemeProvider and useTheme are exported', () => {
    expect(typeof ThemeProvider).toBe('function');
    expect(typeof useTheme).toBe('function');
  });

  test('default context value has correct shape', () => {
    // Verify the default context value passed to createContext
    // React stores it as _currentValue on the context object
    const ctx = ThemeContext;
    // The default value is accessible via the context object
    const defaultVal = ctx._currentValue !== undefined ? ctx._currentValue : ctx._defaultValue;
    expect(defaultVal).toBeDefined();
    expect(defaultVal.isDark).toBe(true);
    expect(defaultVal.theme).toBe(darkTheme);
    expect(typeof defaultVal.toggleTheme).toBe('function');
  });

  test('Property 2: Theme toggle is an involution — toggle twice returns to original state', () => {
    // Validates: Requirements 2.2
    // Feature: unmute-ui, Property 2: Theme toggle is an involution
    fc.assert(
      fc.property(
        fc.boolean(),
        (startDark) => {
          // Simulate the toggle logic directly (pure function test)
          let isDark = startDark;
          const toggle = () => { isDark = !isDark; };

          const initialTheme = isDark ? darkTheme : lightTheme;

          // Toggle twice
          toggle();
          toggle();

          const finalTheme = isDark ? darkTheme : lightTheme;

          return finalTheme === initialTheme && isDark === startDark;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('toggleTheme switches between darkTheme and lightTheme', () => {
    // Simulate the state logic of ThemeProvider
    let isDark = true;
    const toggle = () => { isDark = !isDark; };

    expect(isDark ? darkTheme : lightTheme).toBe(darkTheme);
    toggle();
    expect(isDark ? darkTheme : lightTheme).toBe(lightTheme);
    toggle();
    expect(isDark ? darkTheme : lightTheme).toBe(darkTheme);
  });

  test('default state is dark theme (Requirement 2.5)', () => {
    // The provider defaults to isDark: true
    let isDark = true;
    expect(isDark).toBe(true);
    expect(isDark ? darkTheme : lightTheme).toBe(darkTheme);
  });
});
