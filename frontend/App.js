import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Import Firebase authy
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Avatar, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import PerformanceDisplay from './screens/PerformanceScreen';
import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';
import ContactScreen from './screens/ContactScreen';
import PredictionScreen from './screens/AcademicScreen';
import StressScreen from './screens/StressScreen';
import PlaylistPredictionScreen from './screens/MusicScreen';
import BackgroundFormScreen from './screens/BackgroundFormScreen';
import EducationPlanScreen from './screens/StudyPlan'
import MusicPlaylistScreen from './screens/Playlist';
import Emotion from './screens/AudioClassification';
import NotificationScreen from './screens/NotificationScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth'); // Redirect to Auth Stack (Login Screen)
    } catch (error) {
      console.error("Logout Error:", error.message);//fff
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Avatar.Icon size={80} icon="account-circle" style={styles.avatar} />
        <Text variant="titleLarge" style={styles.username}>Welcome!</Text>
      </View>
      <DrawerItemList {...props} />
      {/* Logout Button */}
      <DrawerItem 
        label="Logout"
        icon={({ color, size }) => <Icon name="logout" size={size} color={color} />}
        onPress={handleLogout}
      />
    </DrawerContentScrollView>
  );
};

// Drawer Navigator with Icons
const DrawerNavigator = () => (
  <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
    <Drawer.Screen
      name="Home"
      component={HomeScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="home-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="account-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Analysis"
      component={PerformanceDisplay}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="chart-bar" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Study Plan"
      component={EducationPlanScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="book" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Playlist"
      component={MusicPlaylistScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="music-note-half" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="cog-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Doctor Suggestion"
      component={NotificationScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="bell-badge" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Help"
      component={HelpScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="help-circle-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Contact Us"
      component={ContactScreen}
      options={{
        drawerIcon: ({ color, size }) => <Icon name="phone-outline" size={size} color={color} />,
      }}
    />
  </Drawer.Navigator>
);

// Stack Navigator for Authentication
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
        <Stack.Screen 
          name="Academic" 
          component={PredictionScreen} 
          options={{ headerShown: true, title: "Academic Prediction" }} 
        />
        <Stack.Screen 
          name="Stress" 
          component={StressScreen} 
          options={{ headerShown: true, title: "Stress Level Prediction" }} 
        />
        <Stack.Screen 
          name="Audio" 
          component={Emotion} 
          options={{ headerShown: true, title: "Emotion Prediction" }} 
        />
        <Stack.Screen 
          name="Music" 
          component={PlaylistPredictionScreen} 
          options={{ headerShown: true, title: "Music Playlist Prediction" }} 
        />
        <Stack.Screen 
          name="BackgroundForm" 
          component={BackgroundFormScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  drawerHeader: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    backgroundColor: 'white',
  },
  username: {
    color: 'black',
    fontWeight: 'bold',
    marginTop: 10,
  },
});