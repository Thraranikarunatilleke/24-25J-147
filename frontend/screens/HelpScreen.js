import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const HelpScreen = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqItems = [
    {
      question: 'How to add new fastag?',
      answer: 'To add a new fastag, go to the Fastag section and click on "Add New." Follow the prompts to complete the process.',
    },
    {
      question: 'How to recharge a fastag?',
      answer:
        '1. Add new fastag.\n2. Go to Fastags.\n3. Click on the Recharge button and enter the amount.\n4. Select payment method and pay.',
    },
    {
      question: 'Can I recharge fastags from different provider?',
      answer: 'Yes, you can recharge fastags from different providers by linking them to your account.',
    },
    {
      question: 'Recharge failed but amount deducted from account?',
      answer: 'Please contact customer support for assistance with this issue.',
    },
    {
      question: 'How to add credit or debit card for easy recharge?',
      answer: 'Go to Payment Methods and add your credit or debit card details.',
    },
    {
      question: 'Can I see tolls paid before I started using fastag?',
      answer: 'No, you can only view toll payments made after activating your fastag.',
    },
  ];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <Text variant="headlineLarge" style={styles.title}>
        Contact Support
      </Text>

      {/* Contact Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={24} color="#6200ea" />
            <Text style={styles.contactText}>02227610846</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={24} color="#6200ea" />
            <Text style={styles.contactText}>fastag.recharge@support.com</Text>
          </View>
        </Card.Content>
      </Card>

      {/* FAQ Section */}
      <Text variant="titleMedium" style={styles.faqTitle}>
        Frequently Asked Questions
      </Text>
      {faqItems.map((item, index) => (
        <View key={index}>
          <TouchableOpacity
            style={styles.faqItem}
            onPress={() => toggleExpand(index)}
          >
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Ionicons
              name={expandedIndex === index ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={20}
              color="#333"
            />
          </TouchableOpacity>
          {expandedIndex === index && (
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          )}
          <Divider style={styles.divider} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    marginBottom: 20,
    padding: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  contactText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#e0e0e0',
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  faqQuestion: {
    fontSize: 16,
    color: '#333',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginTop: 5,
  },
});

export default HelpScreen;
