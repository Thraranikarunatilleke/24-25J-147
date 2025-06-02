import React, { useState, useEffect } from 'react';
import { View, Button, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, RadioButton } from 'react-native-paper';
import axios from 'axios';
import { auth, db } from '../firebaseConfig'; // Firebase config
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const questions = [
  "සන්සුන් වීමට අපහසු බවක් මට දැනුණි.",
  "පැන නැගෙන තත්වයන්ට/සිදුවීම් වලට පමණට වඩා ප්‍රතිචාර දක්වන්නට මම පෙලඹුනෙමි.",
  "මා බොහෝ ලෙස මනස වෙහෙස කරවන බවක් මට දැනුණි.",
  "මා ඉක්මනින් කලබල වන බවක් මට දැනුණි.",
  "සැහැල්ලුවෙන් සිටීමට අපහසු බව මට දැනුණි.",
  "මා කරමින් සිටින දෙයට බාධාවන කිසිම දෙයක් මට ඉවසිය නොහැකි විය.",
  "මා සුළු දෙයකටත් තරහ ගත් බව හෝ ඉතා සංවේදී වූ බව මට දැනුණි."
];

const StressScreen = ({ navigation }) => {
  const [responses, setResponses] = useState(Array(7).fill(null));
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    // Fetch logged-in user's email
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleResponseChange = (index, value) => {
    const updatedResponses = [...responses];
    updatedResponses[index] = value;
    setResponses(updatedResponses);
  };

  const handleSubmit = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'User not logged in');
      return;
    }
    if (responses.includes(null)) {
      Alert.alert('Error', 'Please answer all questions before submitting.');
      return;
    }
    try {
      const response = await axios.post('http://192.168.148.243:5004/predict', { features: responses.map(Number) });
      const predictedClass = response.data.predicted_class;
      const predictedDoctor = response.data.predicted_doctor;
      const newAttempt = {
        timestamp: new Date().toISOString(),
        predictedClass,
        predictedDoctor,
      };

      // Reference to Firestore document using email as ID
      const userDocRef = doc(db, 'stresslevel', userEmail);

      // Check if the document exists
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        // Update the existing document, appending the new attempt
        await updateDoc(userDocRef, {
          predictions: arrayUnion(newAttempt),
        });
      } else {
        // Create a new document with the first attempt
        await setDoc(userDocRef, {
          email: userEmail,
          predictions: [newAttempt],
        });
      }

      Alert.alert('Thank you!', 'Results saved successfully!');
      navigation.navigate('Drawer');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text variant="headlineLarge" style={styles.title}>Stress Level Prediction</Text>

          {/* Mapping for Response Values */}
          <View style={styles.mappingContainer}>
            <Text style={styles.mappingText}>
              <Text style={styles.boldText}>0</Text> - මට කිසිසේත් අදාල නැත{'\n'}
              <Text style={styles.boldText}>1</Text> - මට තරමක් දුරට හෝ සමහර වෙලාවට අදාළයි{'\n'}
              <Text style={styles.boldText}>2</Text> - මට සැලකිය යුතු ප්‍රමාණයට හෝ සැලකිය යුතු කාලයකට අදාළයි{'\n'}
              <Text style={styles.boldText}>3</Text> - මට බොහෝ දුරට හෝ බොහෝ වෙලාවට අදාළයි
            </Text>
          </View>

          {/* Questions */}
          {questions.map((question, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.question}>{`${index + 1}. ${question}`}</Text>
              <RadioButton.Group
                onValueChange={(value) => handleResponseChange(index, value)}
                value={responses[index]?.toString() || null}
              >
                <View style={styles.radioContainer}>
                  {[0, 1, 2, 3].map((num) => (
                    <View key={num} style={styles.radioItem}>
                      <RadioButton value={num.toString()} /><Text>{num}</Text>
                    </View>
                  ))}
                </View>
              </RadioButton.Group>
            </View>
          ))}

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button title="Predict" onPress={handleSubmit} color="#6200ea" />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  mappingContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '100%',
  },
  mappingText: {
    fontSize: 14,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  questionContainer: {
    marginBottom: 25,
    width: '100%',
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
});

export default StressScreen;
