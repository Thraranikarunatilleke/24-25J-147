import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';

const SettingsScreen = () => {
  const [pushNotification, setPushNotification] = useState(true);
  const [chatNotification, setChatNotification] = useState(true);
  const [emailNotification, setEmailNotification] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Settings
      </Text>

      {/* Notification Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Notification Settings
          </Text>
          <View style={styles.settingItem}>
            <Text variant="bodyMedium">Push Notification</Text>
            <Switch
              value={pushNotification}
              onValueChange={setPushNotification}
              thumbColor={pushNotification ? '#6200ea' : '#ccc'}
            />
          </View>
          <Text style={styles.description}>Receive weekly push notifications</Text>

          <View style={styles.settingItem}>
            <Text variant="bodyMedium">Chat Notification</Text>
            <Switch
              value={chatNotification}
              onValueChange={setChatNotification}
              thumbColor={chatNotification ? '#6200ea' : '#ccc'}
            />
          </View>
          <Text style={styles.description}>Receive chat notifications</Text>

          <View style={styles.settingItem}>
            <Text variant="bodyMedium">Email Notifications</Text>
            <Switch
              value={emailNotification}
              onValueChange={setEmailNotification}
              thumbColor={emailNotification ? '#6200ea' : '#ccc'}
            />
          </View>
          <Text style={styles.description}>Receive weekly email notifications</Text>
        </Card.Content>
      </Card>

      {/* Support Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Support
          </Text>
          <TouchableOpacity style={styles.supportItem}>
            <Text variant="bodyMedium">Help</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Text variant="bodyMedium">Contact us</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button
        mode="contained"
        style={styles.logoutButton}
        contentStyle={styles.logoutButtonContent}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  card: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 20,
    padding: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  description: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 10,
    marginBottom: 10,
  },
  supportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#6200ea',
    borderRadius: 25,
    marginTop: 20,
  },
  logoutButtonContent: {
    paddingVertical: 10,
  },
});

export default SettingsScreen;
