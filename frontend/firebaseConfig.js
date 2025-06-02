import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyCke7a9oHRLjOIWdiNwBzTAQncsRRwCkv0",
    authDomain: "alsupport-c7bf0.firebaseapp.com",
    databaseURL: "https://alsupport-c7bf0-default-rtdb.firebaseio.com",
    projectId: "alsupport-c7bf0",
    storageBucket: "alsupport-c7bf0.firebasestorage.app",
    messagingSenderId: "427090611303",
    appId: "1:427090611303:web:9e790d83c60e5f798458c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };