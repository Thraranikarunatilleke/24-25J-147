import { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text } from 'react-native-paper';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import * as Location from 'expo-location';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const PlaylistPredictionScreen = () => {
  const [formData, setFormData] = useState({ 
    emotion: '', 
    weather: '', 
    time: '' 
  });
  const [prediction, setPrediction] = useState('');
  const [timeOpen, setTimeOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [timeItems, setTimeItems] = useState([
    { label: 'Morning', value: 'Morning' },
    { label: 'Study', value: 'Study' },
    { label: 'Evening', value: 'Evening' },
    { label: 'Night', value: 'Night' },
  ]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingEmotion, setIsLoadingEmotion] = useState(false);

  const navigation = useNavigation();

  // Emotion mapping function
  const mapEmotionForPrediction = (emotion) => {
    const emotionMappings = {
      'Aggressive': 'Aggressive',
      'Lazy/Nervous': 'Lazy',
      'Lazy': 'Lazy',
      'Nervous': 'Lazy',
      'Normal': 'Neutral',
      'Natural': 'Neutral',
      'Tired/Sleepy': 'Nervous',
      'Tired': 'Nervous',
      'Sleepy': 'Nervous',
      'default': 'Neutral'
    };

    return emotionMappings[emotion] || emotionMappings.default;
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
      fetchLatestEmotion(user.email);
    }
    
    getCurrentWeather();
    getCurrentLocationTime();
  }, []);

  const fetchLatestEmotion = async (email) => {
    setIsLoadingEmotion(true);
    try {
      const userEmotionRef = doc(db, 'emotion_recognition', email);
      const docSnap = await getDoc(userEmotionRef);
      
      if (docSnap.exists()) {
        const emotionData = docSnap.data();
        if (emotionData.emotions && emotionData.emotions.length > 0) {
          const sortedEmotions = [...emotionData.emotions].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          );
          const latestEmotion = sortedEmotions[0].emotion;
          const mappedEmotion = mapEmotionForPrediction(latestEmotion);
          setFormData(prev => ({ ...prev, emotion: mappedEmotion }));
        }
      }
    } catch (error) {
      console.error('Error fetching latest emotion:', error);
    } finally {
      setIsLoadingEmotion(false);
    }
  };

  const getCurrentWeather = async () => {
    setIsLoadingWeather(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Weather will default to Sunny');
        setFormData((prev) => ({ ...prev, weather: 'Sunny' }));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=52857150a34466df0d2cda88aa25c84e`
      );

      const weatherCondition = weatherResponse?.data?.weather?.[0]?.main || 'Sunny';
      const isRainy = weatherCondition.toLowerCase().includes('rain');

      setFormData((prev) => ({
        ...prev,
        weather: isRainy ? 'Rainy' : 'Sunny',
      }));
    } catch (error) {
      console.error('Weather API error:', error);
      setFormData((prev) => ({ ...prev, weather: 'Sunny' }));
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const getCurrentLocationTime = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Time will default to Study');
        setFormData((prev) => ({ ...prev, time: 'Study' }));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const timeResponse = await axios.get(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=CT92109R4AMS&format=json&by=position&lat=${latitude}&lng=${longitude}`
      );

      const localTime = timeResponse?.data?.formatted || '';
      const hours = new Date(localTime).getHours();

      let timeOfDay = 'Study';
      if (hours >= 5 && hours < 12) timeOfDay = 'Morning';
      else if (hours >= 12 && hours < 17) timeOfDay = 'Study';
      else if (hours >= 17 && hours < 20) timeOfDay = 'Evening';
      else timeOfDay = 'Night';

      setFormData((prev) => ({ ...prev, time: timeOfDay }));
    } catch (error) {
      console.error('Error fetching local time:', error);
      setFormData((prev) => ({ ...prev, time: 'Study' }));
    }
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not logged in.');
        return;
      }

      if (!formData.emotion) {
        Alert.alert('Error', 'Please enter your emotion');
        return;
      }

      const mappedEmotion = mapEmotionForPrediction(formData.emotion);

      const response = await axios.post('http://192.168.148.243:5003/predict', {
        weather: formData.weather,
        emotion: mappedEmotion,
        time: formData.time,
      });

      const recommendedPlaylist = response.data["Recommended Playlist"];
      setPrediction(recommendedPlaylist);
      Alert.alert('Prediction Result', `Recommended Playlist: ${recommendedPlaylist}`);

      const musicPredictRef = doc(db, 'musicpredict', user.email);
      const docSnap = await getDoc(musicPredictRef);

      const predictionData = {
        emotion: formData.emotion,
        mappedEmotion: mappedEmotion,
        weather: formData.weather,
        time: formData.time,
        recommendedPlaylist: recommendedPlaylist,
        timestamp: new Date().toISOString()
      };

      if (docSnap.exists()) {
        // Update existing document by adding to the predictions array
        await setDoc(musicPredictRef, {
          predictions: arrayUnion(predictionData),
          lastUpdated: new Date().toISOString(),
          userEmail: user.email
        }, { merge: true });
      } else {
        // Create new document with initial predictions array
        await setDoc(musicPredictRef, {
          predictions: [predictionData],
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          userEmail: user.email
        });
      }

      navigation.navigate('Drawer');
    } catch (error) {
      console.error('Error submitting prediction:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="headlineLarge" style={styles.title}>
            Predict your Playlists
          </Text>

          <Text style={styles.label}>Emotion</Text>
          {isLoadingEmotion ? (
            <Text style={styles.loadingText}>Loading your latest emotion...</Text>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="How are you feeling today?"
              value={formData.emotion}
              onChangeText={(value) => setFormData({ ...formData, emotion: value })}
            />
          )}

          <Text style={styles.label}>Weather</Text>
          <View style={styles.weatherContainer}>
            {isLoadingWeather ? (
              <Text style={styles.weatherText}>Detecting weather...</Text>
            ) : (
              <Text style={styles.weatherText}>
                {formData.weather || 'Sunny'}
              </Text>
            )}
          </View>

          <Text style={styles.label}>Time</Text>
          <View style={styles.dropdownContainer}>
            <DropDownPicker
              open={timeOpen}
              value={formData.time}
              items={timeItems}
              setOpen={setTimeOpen}
              setValue={(callback) => {
                setFormData((prevData) => ({
                  ...prevData,
                  time: callback(prevData.time),
                }));
              }}
              setItems={setTimeItems}
              placeholder="Select Time"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownList}
              dropDownDirection="TOP"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button 
              title="Predict Playlist" 
              onPress={handleSubmit} 
              color="#6200ea" 
              disabled={isLoadingWeather || isLoadingEmotion}
            />
          </View>

          {prediction && (
            <Text style={styles.resultText}>
              Recommended: {prediction}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#6200ea',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  weatherContainer: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  weatherText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownList: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  resultText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6200ea',
  },
  loadingText: {
    height: 50,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#666',
    textAlignVertical: 'center',
  },
});

export default PlaylistPredictionScreen;