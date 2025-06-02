import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().backgroundCompleted) {
        navigation.replace('Drawer');
      } else {
        navigation.replace('BackgroundForm');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Image
        source={require('../assets/stress.png')} // Replace with your actual image path
        style={styles.illustration}
      />
      <Text variant="headlineLarge" style={styles.title}>
        Login
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Let’s Get Started
      </Text>

      <TextInput
        label="Email or Mobile"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
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
        onPress={handleLogin}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Login
      </Button>

      <Button
        mode="text"
        onPress={() => alert('Forgot Password')}
        style={styles.forgotButton}
        labelStyle={styles.forgotText}
      >
        Forgot password?
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Signup')}
        labelStyle={styles.signupText}
        style={styles.signupButton}
      >
        Already have an account? Signup
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
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: '#6200ea',
    fontSize: 14,
  },
  signupButton: {
    marginTop: 20,
  },
  signupText: {
    color: '#6200ea',
    fontSize: 14,
  },
});

export default LoginScreen;
