import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ContactUsScreen = () => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:company.name.info@gmail.com');
  };

  const handleSocialMediaPress = () => {
    Linking.openURL('https://www.socialmedia.com');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Get in Touch</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.description}>
            If you have any inquiries get in touch with us.{"\n"}
            We'll be happy to help you.
          </Text>

          <View style={styles.contactItem}>
            <Icon name="phone" size={20} color="#6200ea" />
            <Text style={styles.contactText}>+1 (917) 555-6789</Text>
          </View>

          <View style={styles.contactItem}>
            <Icon name="email" size={20} color="#6200ea" />
            <Text 
              style={[styles.contactText, styles.linkText]}
              onPress={handleEmailPress}
            >
              company.name.info@gmail.com
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      <Text variant="headlineSmall" style={styles.sectionTitle}>Social Media</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.socialMediaText}>
            Stay updated, connect, and engage with us on Facebook.{"\n\n"}
            Explore our visual world and discover beauty of our brand.{"\n\n"}
            Follow us for real-time updates and lively discussions.
          </Text>

          <View style={styles.socialButton}>
            <Icon name="facebook" size={24} color="#1877f2" />
            <Text 
              style={[styles.linkText, styles.socialLink]}
              onPress={handleSocialMediaPress}
            >
              Connect with us
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    color: '#555',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  linkText: {
    color: '#6200ea',
    textDecorationLine: 'underline',
  },
  divider: {
    marginVertical: 25,
    height: 1,
    backgroundColor: '#ddd',
    width: '80%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  socialMediaText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    color: '#555',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    padding: 12,
    borderRadius: 6,
  },
  socialLink: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ContactUsScreen;