import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import axios from 'axios';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc, collection, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';

const PredictionScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    'Mental Status': '',
    'Attendance Rate': '',
    'Study Hours per Week': '',
    'Previous Mathematics  average': '', // Corrected here: two spaces
    'Previous Physics average': '',
    'Previous Chemistry average': '',
    failures: '',
    famrel: '',
    freetime: '',
    goout: '',
    absences: ''
  });

  const [backgroundData, setBackgroundData] = useState({
    Gender: '',
    'Extracurricular Activities': '',
    'Family Support': '',
    guardian: '',
    schoolsup: '',
    paidClass: '',
    'Parent Education': '',
    Dalc: '',
    Walc: ''
  });

  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mapping for correct variable names for the API (remains unchanged)
  const fieldMapping = {
    'gender': 'Gender',
    'hobbies': 'Extracurricular Activities',
    'family': 'Family Support',
    'parentedu': 'Parent Education',
    'dalc': 'Dalc',
    'walc': 'Walc'
  };

  // New mapping for display labels
  const labelMapping = {
    'Mental Status': '1. ඔබේ මානසික යහපැවැත්ම',
    'Attendance Rate': '2. පන්ති වලට සහභාගී වීම (%) \n(ඔබ සාමාන්‍යයෙන් පන්තිවලට සහභාගී වන ප්‍රතිශතය ඇතුළත් කරන්න. උදා: 85%)',
    'Study Hours per Week': '3. සතිපතා අධ්‍යයන වේලාවන් (පන්තිවලින් පිටව ඔබ සතියකට සාමාන්‍යයෙන් අධ්‍යයනය කරන පැය ගණන) )',
    'Previous Mathematics  average': '= අධ්‍යයන කාර්යක්ෂමතාව (ඔබේ මෑත විභාගවල සාමාන්‍ය ලකුණු ඇතුළත් කරන්න\n4. ගණිතයේ සාමාන්‍ය ලකුණ', // Corrected here: two spaces
    'Previous Physics average': '5. භෞතික විද්‍යාවේ සාමාන්‍ය ලකුණ',
    'Previous Chemistry average': '6. රසායන විද්‍යාවේ සාමාන්‍ය ලකුණ',
    'failures': '7. පෙර අධ්‍යයන අපහසුතා \n(ඔබ අතීතයේ A/L විභාග අසමත් වී ඇති වාර ගණන) \n🔘 කිසිම වාරයක් නැහැ (0) \n🔘 එක් වරක් (1) \n🔘 දෙවරක් (2) \n🔘 තුන් වතාවක් හෝ වැඩි (3 හෝ වැඩි)',
    'famrel': '8. පවුල් සබඳතා ගුණාත්මකභාවය (0.56 - 7.5) \n(ඔබේ පවුලේ සාමාන්‍ය සබඳතා තත්ත්වය ඇගයීම)',
    'freetime': '9. පාසල්වලින් පසු නිදහස් කාලය (0-7) \n(පාසල් අවසානයෙන් පසු ඔබට ඇති සාමාන්‍ය නිදහස් වේලාව) \n🔘 0-1 (ඉතා සුළු) \n🔘 2-3 (සුළු) \n🔘 4-5 (මධ්‍යම) \n🔘 6-7 (ඉතා වැඩි)',
    'goout': '10. යහළුවන් සමඟ සමාජීයව එකතු වීමේ සංඛ්‍යාව (0-7) \n(ඔබ සාමාන්‍යයෙන් යහළුවන් සමඟ හමුවන හා පිටතට යන සංඛ්‍යාව) \n🔘 0-1 (බොහෝ විට නැහැ) \n🔘 2-3 (ඇවිදින්නට යනවා ඇතැම් විට) \n🔘 4-5 (නිතිපතා) \n🔘 6-7 (ඉතා බොහෝ විට)',
    'absences': '11. මුළු පාසල් නොපැමිණීම් (0-25) \n(මෑත කාලයේදී ඔබ පාසලට නොපැමිණි දවස් ගණන)',
  };

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserEmail(user.email);
        await fetchBackgroundData(user.email);
        await fetchStressLevelData(user.email);
        setLoading(false);
      } else {
        Alert.alert('Error', 'User not logged in. Please sign in.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchBackgroundData = async (email) => {
    try {
      const userEmailLowerCase = email.toLowerCase();
      const backgroundDocRef = doc(db, 'background', userEmailLowerCase);
      const docSnap = await getDoc(backgroundDocRef);

      if (docSnap.exists()) {
        setBackgroundData(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching background data:', error);
    }
  };

  const fetchStressLevelData = async (email) => {
    try {
      const stressDocRef = doc(db, 'stresslevel', email);
      const stressDoc = await getDoc(stressDocRef);

      if (stressDoc.exists()) {
        const predictions = stressDoc.data().predictions || [];
        if (predictions.length > 0) {
          const latestPrediction = predictions[predictions.length - 1];
          setFormData(prev => ({
            ...prev,
            'Mental Status': latestPrediction.predictedClass || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching stress level data:', error);
    }
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'User email not found. Please log in.');
      return;
    }

    try {
      // Combine Firestore background data and user input form data
      const combinedData = {
        ...backgroundData,
        ...formData,
        email: userEmail,
      };

      // Map the fields to match the API's expected format (remains unchanged)
      const formattedData = Object.keys(combinedData).reduce((acc, key) => {
        const formattedKey = fieldMapping[key] || key;
        acc[formattedKey] = combinedData[key];
        return acc;
      }, {});

      // Call the Flask API to get the predicted study plan
      const response = await axios.post('http://192.168.148.243:5002/predict', formattedData);
      const predictedStudyPlan = response.data['Predicted Study Plan'];

      // Save to Firestore
      const userDocRef = doc(collection(db, 'study_plans'), userEmail);
      await setDoc(userDocRef, {
        study_plan: predictedStudyPlan,
        timestamp: serverTimestamp()
      }, { merge: true });

      // Save performance data
      const performanceDocRef = doc(collection(db, 'Performance'), userEmail);
      const historicalData = {
        timestamp: new Date().toISOString(),
        ...Object.keys(formData).reduce((acc, key) => {
          if (key !== 'Mental Status') {
            acc[key] = formData[key];
          }
          return acc;
        }, {})
      };

      await setDoc(performanceDocRef, {
        historicalData: arrayUnion(historicalData)
      }, { merge: true });

      Alert.alert('Success', `Study Plan: ${predictedStudyPlan}`);
      navigation.replace('Drawer');

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Something went wrong');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="headlineLarge" style={styles.title}>Academic Performance</Text>

          {/* Display Mental Status as non-editable */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{labelMapping['Mental Status']}</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData['Mental Status']}
              editable={false}
            />
          </View>

          {/* Render other form inputs */}
          {Object.keys(formData)
            .filter(key => key !== 'Mental Status')
            .map((key) => (
              <View key={key} style={styles.inputContainer}>
                <Text style={styles.label}>{labelMapping[key]}</Text>
                <TextInput
                  style={styles.input}
                  value={formData[key]}
                  onChangeText={(value) => handleChange(key, value)}
                  keyboardType={
                    key.includes('average') || key === 'Attendance Rate' || key === 'Study Hours per Week' || key === 'failures' || key === 'famrel' || key === 'freetime' || key === 'goout' || key === 'absences'
                      ? 'numeric' : 'default'
                  }
                />
              </View>
            ))}

          <View style={styles.buttonContainer}>
            <Button
              title="Generate Study Plan"
              onPress={handleSubmit}
              color="#6200ea"
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#6200ea',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#eee',
    color: '#555',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
});

export default PredictionScreen;