import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { COLORS, SPACING, TYPOGRAPHY, commonStyles } from '../config/theme';
import { auth, db } from '../../../firebaseConfig';
import { doc, setDoc, arrayUnion, getDoc } from 'firebase/firestore';

const ANIMATION_DURATION = {
  PROGRESS: 800,
  FADE: 500,
};

const EMOTION_CONFIG = {
  aggressive: {
    color: COLORS.EMOTION.AGGRESSIVE,
    icon: 'flame',
    label: 'Aggressive',
  },
  lazy_nervous: {
    color: COLORS.EMOTION.LAZY_NERVOUS,
    icon: 'alert-circle',
    label: 'Lazy/Nervous',
  },
  lazy: {
    color: COLORS.EMOTION.LAZY_NERVOUS,
    icon: 'alert-circle',
    label: 'Lazy',
  },
  nervous: {
    color: COLORS.EMOTION.LAZY_NERVOUS,
    icon: 'alert-circle',
    label: 'Nervous',
  },
  normal: {
    color: COLORS.EMOTION.NORMAL,
    icon: 'happy',
    label: 'Normal',
  },
  natural: {
    color: COLORS.EMOTION.NORMAL,
    icon: 'happy',
    label: 'Natural',
  },
  tired_sleepy: {
    color: COLORS.EMOTION.TIRED_SLEEPY,
    icon: 'moon',
    label: 'Tired/Sleepy',
  },
  tired: {
    color: COLORS.EMOTION.TIRED_SLEEPY,
    icon: 'moon',
    label: 'Tired',
  },
  sleepy: {
    color: COLORS.EMOTION.TIRED_SLEEPY,
    icon: 'moon',
    label: 'Sleepy',
  },
  default: {
    color: COLORS.PRIMARY,
    icon: 'help-circle',
    label: 'Unknown',
  },
};

const ProbabilityItem = React.memo(({ emotionKey, value, config }) => {
  const probabilityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(probabilityAnim, {
      toValue: value,
      duration: ANIMATION_DURATION.PROGRESS,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const probabilityBarWidth = probabilityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.probabilityItem}>
      <View style={styles.probabilityLabelContainer}>
        <Ionicons
          name={config.icon}
          size={16}
          color={config.color}
          style={styles.probabilityIcon}
        />
        <Text style={styles.probabilityLabel}>{config.label}</Text>
      </View>
      <View style={styles.probabilityBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: probabilityBarWidth,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>
      <Text style={styles.probabilityValue}>{Math.round(value * 100)}%</Text>
    </View>
  );
});

const EmotionResult = React.memo(({
  title = "Emotion Analysis Result",
  emotion,
  confidence,
  probabilities
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showDetails, setShowDetails] = useState(false);

  const emotionConfig = useMemo(() => {
    const normalizedEmotion = emotion.toLowerCase();
    return EMOTION_CONFIG[normalizedEmotion] || EMOTION_CONFIG.default;
  }, [emotion]);

  const animationConfig = useMemo(() => ({
    progress: {
      toValue: confidence,
      duration: ANIMATION_DURATION.PROGRESS,
      useNativeDriver: false,
    },
    fade: {
      toValue: 1,
      duration: ANIMATION_DURATION.FADE,
      useNativeDriver: true,
    },
  }), [confidence]);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(progressAnim, animationConfig.progress),
      Animated.timing(fadeAnim, animationConfig.fade),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [confidence, animationConfig]);

  // Save emotion to Firebase when it changes
useEffect(() => {
  const saveEmotionToFirebase = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return;

      const emotionData = {
        emotion: emotionConfig.label,
        confidence: Math.round(confidence * 100),
        timestamp: new Date().toISOString(),
        probabilities: probabilities ? Object.fromEntries(
          Object.entries(probabilities).map(([key, value]) => [key, Math.round(value * 100)])
        ): null
      };

        const userDocRef = doc(db, 'emotion_recognition', user.email);
        
        // Get current document to check if it exists
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          // Update existing document by adding to the emotions array
          await setDoc(userDocRef, {
            emotions: arrayUnion(emotionData),
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        } else {
          // Create new document with initial emotions array
          await setDoc(userDocRef, {
            emotions: [emotionData],
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            userEmail: user.email
          });
        }
        
        console.log('Emotion saved to Firebase successfully');
      } catch (error) {
        console.error('Error saving emotion to Firebase:', error);
      }
    };

    if (emotion && confidence) {
      saveEmotionToFirebase();
    }
  }, [emotion, confidence, probabilities]);

  const progressBarWidth = useMemo(() =>
    progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
    [progressAnim]
  );

  const probabilityItems = useMemo(() => {
    if (!probabilities) return null;

    return Object.entries(probabilities).map(([key, value]) => {
      const config = EMOTION_CONFIG[key] || EMOTION_CONFIG.default;
      return (
        <ProbabilityItem
          key={key}
          emotionKey={key}
          value={value}
          config={config}
        />
      );
    });
  }, [probabilities]);

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <Card title={title} withMargin={false}>
        <TouchableOpacity
          onPress={toggleDetails}
          activeOpacity={0.7}
        >
          <Animated.View style={[styles.mainResult, { opacity: fadeAnim }]}>
            <View style={styles.emotionIconContainer}>
              <Ionicons
                name={emotionConfig.icon}
                size={48}
                color={emotionConfig.color}
              />
            </View>
            <View style={styles.emotionTextContainer}>
              <Text style={styles.emotionLabel}>Detected Emotion:</Text>
              <Text style={[styles.emotionValue, { color: emotionConfig.color }]}>
                {emotionConfig.label}
              </Text>
            </View>
            <View style={styles.detailsButton}>
              <Ionicons
                name={showDetails ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={COLORS.TEXT.SECONDARY}
              />
            </View>
          </Animated.View>
        </TouchableOpacity>

        {showDetails && (
          <Animated.View style={[styles.detailsContainer, { opacity: fadeAnim }]}>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence Level:</Text>
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressBarWidth,
                      backgroundColor: emotionConfig.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceValue}>{Math.round(confidence * 100)}%</Text>
            </View>

            {probabilityItems && (
              <View style={styles.probabilitiesContainer}>
                <Text style={styles.probabilitiesTitle}>Emotion Distribution:</Text>
                {probabilityItems}
              </View>
            )}
          </Animated.View>
        )}
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.S,
  },
  mainResult: {
    ...commonStyles.row,
  },
  emotionIconContainer: {
    ...commonStyles.center,
    width: 60,
    height: 60,
  },
  emotionTextContainer: {
    flex: 1,
    marginLeft: SPACING.M,
  },
  emotionLabel: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.XXS,
  },
  emotionValue: {
    ...TYPOGRAPHY.H3,
  },
  detailsButton: {
    ...commonStyles.center,
    width: 40,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
    padding: SPACING.S,
  },
  confidenceContainer: {
    marginBottom: SPACING.S,
  },
  confidenceLabel: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.XXS,
  },
  confidenceValue: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.XXS,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  probabilitiesContainer: {
    marginTop: SPACING.S,
  },
  probabilitiesTitle: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.S,
  },
  probabilityItem: {
    ...commonStyles.row,
    marginBottom: SPACING.XS,
  },
  probabilityLabelContainer: {
    ...commonStyles.row,
    width: 120,
  },
  probabilityIcon: {
    marginRight: SPACING.XS,
  },
  probabilityLabel: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.TEXT.SECONDARY,
  },
  probabilityBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: 2,
    marginHorizontal: SPACING.M,
    overflow: 'hidden',
  },
  probabilityValue: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.TEXT.SECONDARY,
    width: 40,
    textAlign: 'right',
  },
});

export default EmotionResult;