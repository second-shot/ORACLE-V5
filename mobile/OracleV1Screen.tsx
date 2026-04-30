/**
 * OracleV1Screen.tsx
 *
 * Canonical mobile shell for Oracle V1.
 * Single-screen, single-purpose: Presence → Surface → Lock → reset.
 *
 * Uses only core React Native primitives and Animated.
 * No routing. No backend. No additional packages.
 *
 * This file is a locked baseline reference.
 * Do not add features, routes, or backend logic here.
 * Future versions branch from this baseline without modifying it.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// ── Canon ─────────────────────────────────────────────────────────────────────

const OPTIONS = ["surface", "hold", "release"] as const;
type Option = (typeof OPTIONS)[number];

type Phase = "presence" | "surface" | "lock";

// ── Tokens ────────────────────────────────────────────────────────────────────

const C = {
  bg: "#0a0a0a",
  orb: "#c8c8c8",
  orbGlow: "#2a2a2a",
  textPrimary: "#e8e8e8",
  textDim: "#4a4a4a",
  textSecondary: "#888888",
  optionBorder: "#1f1f1f",
  optionSelected: "#e8e8e8",
} as const;

// ── Timing (ms) ───────────────────────────────────────────────────────────────

const T = {
  breathIn: 3200,
  breathOut: 3200,
  orbTighten: 380,
  optionStagger: 120,
  optionFadeIn: 340,
  lockCompress: 260,
  lockExpand: 400,
  lockCalm: 600,
  lockHold: 900,
  resetDelay: 1800,
  fadeOut: 320,
} as const;

// ── OracleV1Screen ─────────────────────────────────────────────────────────────

export default function OracleV1Screen() {
  const [phase, setPhase] = useState<Phase>("presence");
  const [selected, setSelected] = useState<Option | null>(null);

  // ── Orb animated values ─────────────────────────────────────────────────────

  const orbScale = useRef(new Animated.Value(1)).current;
  const orbOpacity = useRef(new Animated.Value(0.55)).current;

  // ── Option animated values (one per option) ─────────────────────────────────

  const optionOpacities = useRef(
    OPTIONS.map(() => new Animated.Value(0))
  ).current;

  // ── Phase: Presence ─────────────────────────────────────────────────────────

  const breathe = useCallback(() => {
    orbScale.setValue(1);
    orbOpacity.setValue(0.45);

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbScale, {
            toValue: 1.12,
            duration: T.breathIn,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacity, {
            toValue: 0.7,
            duration: T.breathIn,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orbScale, {
            toValue: 1,
            duration: T.breathOut,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacity, {
            toValue: 0.45,
            duration: T.breathOut,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [orbScale, orbOpacity]);

  // ── Phase: Surface ──────────────────────────────────────────────────────────

  const enterSurface = useCallback(() => {
    orbScale.stopAnimation();
    orbOpacity.stopAnimation();

    Animated.parallel([
      Animated.timing(orbScale, {
        toValue: 0.82,
        duration: T.orbTighten,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(orbOpacity, {
        toValue: 0.9,
        duration: T.orbTighten,
        useNativeDriver: true,
      }),
      ...optionOpacities.map((anim, i) =>
        Animated.sequence([
          Animated.delay(i * T.optionStagger),
          Animated.timing(anim, {
            toValue: 1,
            duration: T.optionFadeIn,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, [orbScale, orbOpacity, optionOpacities]);

  // ── Phase: Lock ─────────────────────────────────────────────────────────────

  const enterLock = useCallback(
    (choice: Option) => {
      setSelected(choice);
      setPhase("lock");

      const choiceIndex = OPTIONS.indexOf(choice);

      // Fade out the two unchosen options
      Animated.parallel(
        optionOpacities
          .filter((_, i) => i !== choiceIndex)
          .map((anim) =>
            Animated.timing(anim, {
              toValue: 0.18,
              duration: T.lockCompress,
              useNativeDriver: true,
            })
          )
      ).start();

      // Orb: compress → expand → calm
      Animated.sequence([
        Animated.timing(orbScale, {
          toValue: 0.6,
          duration: T.lockCompress,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(orbScale, {
          toValue: 1.18,
          duration: T.lockExpand,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(orbScale, {
          toValue: 1,
          duration: T.lockCalm,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hold the lock state briefly, then reset
        setTimeout(reset, T.resetDelay);
      });
    },
    [optionOpacities, orbScale]
  );

  // ── Reset ───────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    Animated.parallel([
      Animated.timing(orbOpacity, {
        toValue: 0,
        duration: T.fadeOut,
        useNativeDriver: true,
      }),
      ...optionOpacities.map((anim) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: T.fadeOut,
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      setSelected(null);
      setPhase("presence");
    });
  }, [orbOpacity, optionOpacities]);

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === "presence") {
      breathe();
    } else if (phase === "surface") {
      enterSurface();
    }
  }, [phase, breathe, enterSurface]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleOrbPress = useCallback(() => {
    if (phase === "presence") {
      setPhase("surface");
    }
  }, [phase]);

  const handleOptionPress = useCallback(
    (option: Option) => {
      if (phase === "surface") {
        enterLock(option);
      }
    },
    [phase, enterLock]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>ORACLE</Text>
        <Text style={styles.version}>V1</Text>
      </View>

      <View style={styles.stage}>
        {/* Orb */}
        <TouchableWithoutFeedback
          onPress={handleOrbPress}
          disabled={phase !== "presence"}
          accessibilityRole="button"
          accessibilityLabel={
            phase === "presence" ? "Tap to surface options" : "Oracle orb"
          }
        >
          <Animated.View
            style={[
              styles.orb,
              {
                opacity: orbOpacity,
                transform: [{ scale: orbScale }],
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Phase label */}
        <Text style={styles.phaseLabel}>
          {phase === "presence" && "presence"}
          {phase === "surface" && "surface"}
          {phase === "lock" && "locked"}
        </Text>
      </View>

      {/* Options */}
      <View style={styles.options} accessibilityRole="list">
        {OPTIONS.map((option) => {
          const isSelected = selected === option;
          const index = OPTIONS.indexOf(option);

          return (
            <TouchableWithoutFeedback
              key={option}
              onPress={() => handleOptionPress(option)}
              disabled={phase !== "surface"}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected: isSelected }}
            >
              <Animated.View
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                  { opacity: optionOpacities[index] },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ORB_SIZE = 80;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    alignSelf: "flex-start",
  },
  wordmark: {
    fontFamily: "Courier New",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 2,
    color: C.textPrimary,
  },
  version: {
    fontFamily: "Courier New",
    fontSize: 11,
    color: C.textDim,
    letterSpacing: 1,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: C.orb,
  },
  phaseLabel: {
    fontFamily: "Courier New",
    fontSize: 11,
    letterSpacing: 2,
    color: C.textDim,
    textTransform: "lowercase",
  },
  options: {
    width: "100%",
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: C.optionBorder,
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  optionSelected: {
    borderColor: C.optionSelected,
  },
  optionText: {
    fontFamily: "Courier New",
    fontSize: 13,
    letterSpacing: 1.5,
    color: C.textSecondary,
    textTransform: "lowercase",
  },
  optionTextSelected: {
    color: C.optionSelected,
  },
});
