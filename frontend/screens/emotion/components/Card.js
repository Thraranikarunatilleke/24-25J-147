import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOW, TYPOGRAPHY, BORDER_RADIUS, commonStyles } from '../config/theme';

const ANIMATION_CONFIG = {
  FADE: {
    toValue: 1,
    duration: 500,
    useNativeDriver: true,
  },
  SCALE: {
    toValue: 1,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  },
};

const Card = React.memo(({ title, children, style, withMargin = false }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const animationConfig = useMemo(() => ({
    fade: ANIMATION_CONFIG.FADE,
    scale: ANIMATION_CONFIG.SCALE,
  }), []);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, animationConfig.fade),
      Animated.spring(scaleAnim, animationConfig.scale),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animationConfig]);

  const cardStyles = useMemo(() => [
    styles.card,
    withMargin && styles.cardMargin,
    style,
    {
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
    },
  ], [style, fadeAnim, scaleAnim, withMargin]);

  const titleGradient = useMemo(() => {
    if (!title) return null;

    return (
      <LinearGradient
        colors={[COLORS.BACKGROUND.PRIMARY, COLORS.BACKGROUND.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.titleContainer}
      >
        <Text style={styles.title}>{title}</Text>
      </LinearGradient>
    );
  }, [title]);

  return (
    <Animated.View style={cardStyles}>
      {titleGradient}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.BACKGROUND.CARD,
    borderRadius: BORDER_RADIUS.L,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    overflow: 'hidden',
    ...SHADOW.MEDIUM,
  },
  cardMargin: {
    marginVertical: SPACING.S,
  },
  titleContainer: {
    padding: SPACING.M,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.SECONDARY,
  },
  title: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT.PRIMARY,
  },
  content: {
    padding: SPACING.M,
  },
});

export default Card;