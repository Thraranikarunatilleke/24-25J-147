import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import EmotionResult from './EmotionResult';
import { predictFaceEmotion, predictAudioEmotion } from '../services/api';
import { useAppContext } from '../context/AppContext';

const ANALYSIS_INTERVAL = 2000; // Increased to 2 seconds for better stability
const AUDIO_INTERVAL = 3000; // Increased to 3 seconds
const PHOTO_QUALITY = 0.3; // Reduced quality for faster processing
const MAX_RETRIES = 2; // Reduced retries
const RETRY_DELAY = 1000; // 1 second delay between retries

const ControlButton = ({ onPress, iconName, isActive = true, size = 24, disabled = false, label }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.controlButtonContainer}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.controlButton,
          isActive && styles.controlButtonActive,
          pressed && styles.controlButtonPressed,
          disabled && styles.controlButtonDisabled,
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={iconName}
            size={size}
            color={disabled ? 'rgba(255,255,255,0.3)' : isActive ? '#ffffff' : 'rgba(255,255,255,0.5)'}
          />
        </Animated.View>
      </Pressable>
      {label && <Text style={styles.controlButtonLabel}>{label}</Text>}
    </View>
  );
};

const RealtimeCameraView = React.memo(({ onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, setAudioPermission] = useState(false);
  const [facing, setFacing] = useState("front");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [audioResult, setAudioResult] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState(null);

  const { isBackendConnected } = useAppContext();
  
  const cameraRef = useRef(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const analysisIntervalRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const mountedRef = useRef(true);
  const analysisInProgressRef = useRef(false);

  // Initialize audio permissions
  useEffect(() => {
    mountedRef.current = true;

    const initializeAudio = async () => {
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (mountedRef.current) {
          setAudioPermission(permission.granted);
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initializeAudio();

    return () => {
      mountedRef.current = false;
      cleanupResources();
    };
  }, []);

  const cleanupResources = useCallback(async () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    await stopAudioRecording();
    analysisInProgressRef.current = false;
  }, []);

  // Face analysis interval
  useEffect(() => {
    if (isActive && cameraStarted && isBackendConnected) {
      analysisIntervalRef.current = setInterval(captureAndAnalyze, ANALYSIS_INTERVAL);
    } else if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isActive, cameraStarted, isBackendConnected]);

  // Voice analysis interval
  useEffect(() => {
    if (isVoiceActive && audioPermission && cameraStarted && isBackendConnected) {
      startAudioRecording();
      audioIntervalRef.current = setInterval(analyzeAudio, AUDIO_INTERVAL);
    } else if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
      stopAudioRecording();
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    };
  }, [isVoiceActive, audioPermission, cameraStarted, isBackendConnected]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || !isActive || !mountedRef.current || !isBackendConnected || analysisInProgressRef.current) {
      return;
    }

    // Prevent multiple simultaneous captures
    analysisInProgressRef.current = true;
    
    let retries = 0;
    while (retries < MAX_RETRIES && mountedRef.current) {
      try {
        setAnalyzing(true);
        
        // Check if camera is still mounted before taking photo
        if (!cameraRef.current || !mountedRef.current) {
          break;
        }

        const photo = await cameraRef.current.takePictureAsync({
          quality: PHOTO_QUALITY,
          skipProcessing: true,
          exif: false,
          shutterSound: false,
        });

        if (photo?.uri && mountedRef.current && isBackendConnected) {
          const response = await predictFaceEmotion(photo.uri);
          if (mountedRef.current) {
            setResult(response);
            setErrorCount(0); // Reset error count on success
            setLastError(null);
          }

          // Clean up temp file
          try {
            await FileSystem.deleteAsync(photo.uri);
          } catch {
            // Ignore cleanup errors
          }
          break;
        }
      } catch (error) {
        console.error(`Error in face analysis (attempt ${retries + 1}):`, error?.message || error);
        retries++;
        
        // Set error info for UI
        if (mountedRef.current) {
          setErrorCount(prev => prev + 1);
          setLastError(error?.message || 'Analysis failed');
        }

        if (retries < MAX_RETRIES && mountedRef.current) {
          await sleep(RETRY_DELAY);
        }
      } finally {
        if (mountedRef.current) {
          setAnalyzing(false);
        }
      }
    }
    
    analysisInProgressRef.current = false;
  }, [isActive, isBackendConnected]);

  const startAudioRecording = useCallback(async () => {
    try {
      if (!isRecording && audioPermission) {
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [audioRecorder, audioPermission, isRecording]);

  const stopAudioRecording = useCallback(async () => {
    try {
      if (isRecording) {
        await audioRecorder.stop();
        setIsRecording(false);
        return audioRecorder.uri;
      }
      return null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      return null;
    }
  }, [audioRecorder, isRecording]);

  const analyzeAudio = useCallback(async () => {
    if (!isBackendConnected || !mountedRef.current) return;

    const audioUri = await stopAudioRecording();
    if (audioUri && mountedRef.current) {
      try {
        const response = await predictAudioEmotion(audioUri);
        if (mountedRef.current) {
          setAudioResult(response);
        }
        await FileSystem.deleteAsync(audioUri);
      } catch (error) {
        console.error('Error analyzing audio:', error);
      }
      // Restart recording for next cycle
      if (isVoiceActive && mountedRef.current) {
        await startAudioRecording();
      }
    }
  }, [isBackendConnected, stopAudioRecording, startAudioRecording, isVoiceActive]);

  const startCamera = useCallback(async () => {
    console.log('startCamera called'); // Debug log
    
    if (!permission?.granted) {
      console.log('Permission not granted, requesting...'); // Debug log
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to use this feature.');
        return;
      }
    }
    
    console.log('Setting camera started to true'); // Debug log
    setCameraStarted(true);
    setErrorCount(0);
    setLastError(null);
  }, [permission, requestPermission]);

  const stopCamera = useCallback(() => {
    setCameraStarted(false);
    setIsActive(false);
    setIsVoiceActive(false);
    setResult(null);
    setAudioResult(null);
    setErrorCount(0);
    setLastError(null);
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  const toggleAnalysis = useCallback(() => {
    if (!isBackendConnected) {
      Alert.alert('No Connection', 'Please ensure the backend server is connected before starting analysis.');
      return;
    }
    setIsActive(prev => !prev);
  }, [isBackendConnected]);

  const toggleVoiceAnalysis = useCallback(() => {
    if (!isBackendConnected) {
      Alert.alert('No Connection', 'Please ensure the backend server is connected before starting voice analysis.');
      return;
    }
    if (!audioPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required for voice analysis.');
      return;
    }
    setIsVoiceActive(prev => !prev);
  }, [isBackendConnected, audioPermission]);

  // Simplified start button that's more reliable
  const startCameraButton = useMemo(() => {
    if (cameraStarted) return null;
    
    return (
      <View style={styles.startContainer}>
        <View style={styles.startContent}>
          <Ionicons name="camera" size={64} color="#ffffff" style={styles.startIcon} />
          <Text style={styles.startTitle}>Emotion Recognition</Text>
          <Text style={styles.startSubtitle}>
            Analyze emotions in real-time using your camera and microphone
          </Text>
          {!isBackendConnected && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={20} color="#f39c12" />
              <Text style={styles.warningText}>Backend server not connected</Text>
            </View>
          )}
          
          {/* Simple Pressable button instead of ControlButton for start */}
          <Pressable
            onPress={() => {
              console.log('Start button pressed'); // Debug log
              startCamera();
            }}
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed
            ]}
          >
            <Ionicons name="camera" size={28} color="#ffffff" />
            <Text style={styles.startButtonText}>Start Camera</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [cameraStarted, startCamera, isBackendConnected]);

  const cameraControls = useMemo(() => {
    if (!cameraStarted) return null;

    return (
      <View style={styles.controlsRow}>
        <ControlButton
          onPress={stopCamera}
          iconName="stop"
          size={24}
          label="Stop"
        />
        <ControlButton
          onPress={toggleFacing}
          iconName="camera-reverse"
          size={24}
          label="Flip"
        />
        <ControlButton
          onPress={toggleAnalysis}
          iconName={isActive ? "pause" : "play"}
          isActive={isActive}
          size={24}
          label={isActive ? "Pause" : "Start"}
          disabled={!isBackendConnected}
        />
        <ControlButton
          onPress={toggleVoiceAnalysis}
          iconName={isVoiceActive ? "mic" : "mic-off"}
          isActive={isVoiceActive}
          size={24}
          label={isVoiceActive ? "Voice On" : "Voice Off"}
          disabled={!isBackendConnected || !audioPermission}
        />
      </View>
    );
  }, [
    cameraStarted, 
    isActive, 
    isVoiceActive, 
    isBackendConnected, 
    audioPermission,
    stopCamera,
    toggleFacing, 
    toggleAnalysis, 
    toggleVoiceAnalysis
  ]);

  const statusDisplay = useMemo(() => {
    if (!cameraStarted) return null;

    return (
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isBackendConnected ? '#2ecc71' : '#e74c3c' }]} />
          <Text style={styles.statusText}>
            Server: {isBackendConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        {analyzing && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#3498db' }]} />
            <Text style={styles.statusText}>Analyzing...</Text>
          </View>
        )}
        {errorCount > 0 && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#f39c12' }]} />
            <Text style={styles.statusText}>
              Errors: {errorCount} {lastError && `(${lastError})`}
            </Text>
          </View>
        )}
      </View>
    );
  }, [cameraStarted, isBackendConnected, analyzing, errorCount, lastError]);

  const resultsDisplay = useMemo(() => {
    if (!cameraStarted) return null;

    return (
      <ScrollView style={styles.resultsContainer}>
        {result && (
          <EmotionResult
            title="Face Analysis"
            emotion={result.emotion}
            confidence={result.confidence}
            probabilities={result.probabilities}
          />
        )}
        {audioResult && (
          <EmotionResult
            title="Voice Analysis"
            emotion={audioResult.emotion}
            confidence={audioResult.confidence}
            probabilities={audioResult.probabilities}
          />
        )}
      </ScrollView>
    );
  }, [cameraStarted, result, audioResult]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!cameraStarted ? (
        startCameraButton
      ) : (
        <>
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              onMountError={(error) => console.error('Camera error:', error)}
              animateShutter={false}
            />
            <View style={styles.controlsOverlay}>
              {statusDisplay}
              {cameraControls}
            </View>
          </View>
          {resultsDisplay}
        </>
      )}
    </View>
  );
});

RealtimeCameraView.displayName = 'RealtimeCameraView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  startIcon: {
    marginBottom: 20,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  startSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    color: '#f39c12',
    marginLeft: 8,
    fontSize: 14,
  },
  // New start button styles
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonPressed: {
    backgroundColor: '#2980b9',
    transform: [{ scale: 0.95 }],
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1.1,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    maxHeight: '55%',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(26,26,26,0.8)',
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  controlButtonContainer: {
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonActive: {
    backgroundColor: '#3498db',
  },
  controlButtonPressed: {
    backgroundColor: '#404040',
  },
  controlButtonDisabled: {
    backgroundColor: '#1a1a1a',
  },
  controlButtonLabel: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});

export default RealtimeCameraView;