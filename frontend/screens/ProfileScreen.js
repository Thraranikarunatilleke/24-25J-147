import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const ProfileScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setFullName(userDoc.data().fullName);
          setEmail(userDoc.data().email);
          setPhone(userDoc.data().phoneNumber || '');
          setAge(userDoc.data().age || '');
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          fullName,
          phone,
        });
        alert('Profile updated successfully!');
      }
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
    setUpdating(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#6200ea" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Profile</Text>

      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Email"
        value={email}
        mode="outlined"
        disabled
        style={styles.input}
      />

      <TextInput
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        label="Age"
        value={age}
        onChangeText={setAge}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Button mode="contained" onPress={handleUpdate} loading={updating} style={styles.button}>
        Update Profile
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    marginBottom: 70,
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '90%',
    marginBottom: 15,
  },
  button: {
    width: '90%',
    marginTop: 10,
    backgroundColor: '#6200ea',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
