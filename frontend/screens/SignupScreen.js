import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { setDoc, doc } from 'firebase/firestore';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        phoneNumber,
        age,
        email,
        backgroundCompleted: false, // Track whether form is completed
      });

      alert('User registered successfully!');
      navigation.replace('BackgroundForm'); // Redirect only after signup
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Image
        source={require('../assets/stress2.png')} // Replace with your actual image path
        style={styles.illustration}
      />
      <Text variant="headlineLarge" style={styles.title}>
        Signup
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Create an account to get started
      </Text>

      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        label="Age"
        value={age}
        onChangeText={setAge}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={secureText}
        mode="outlined"
        right={
          <TextInput.Icon
            icon={secureText ? 'eye-off' : 'eye'}
            onPress={() => setSecureText(!secureText)}
          />
        }
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSignup}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Signup
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        labelStyle={styles.loginText}
        style={styles.loginButton}
      >
        Already have an account? Login
      </Button>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  illustration: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  button: {
    width: '100%',
    backgroundColor: '#6200ea',
    marginVertical: 10,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  loginButton: {
    marginTop: 20,
  },
  loginText: {
    color: '#6200ea',
    fontSize: 14,
  },
});

export default SignupScreen;
