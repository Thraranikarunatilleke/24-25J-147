import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Text, Button, Card } from 'react-native-paper';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const NotificationScreen = () => {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [district, setDistrict] = useState(null);
  const [stressLevel, setStressLevel] = useState(null);
  const [error, setError] = useState(null);

  // Function to normalize Sri Lankan district names
  const normalizeDistrict = (districtName) => {
    if (!districtName) return null;
    
    const lowerDistrict = districtName.toLowerCase();
    if (lowerDistrict.includes('colombo')) {
      return 'Colombo';
    }
    if (lowerDistrict.includes('wijayaba')) {
      return 'Colombo';
    }
    return districtName;
  };

  // Function to get Sri Lankan district from coordinates
  const getSriLankanDistrict = async (latitude, longitude) => {
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      const possibleDistrict = geocode[0]?.district || 
                              geocode[0]?.subregion || 
                              geocode[0]?.region ||
                              geocode[0]?.city;

      console.log(geocode[0]?.district);
      
      if (!possibleDistrict) throw new Error("Could not determine district");
      return normalizeDistrict(possibleDistrict);
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  };

  // Function to fetch latest stress level from Firebase
  const fetchStressLevel = async (userEmail) => {
    try {
      const stressDocRef = doc(db, 'stresslevel', userEmail);
      const stressDoc = await getDoc(stressDocRef);

      if (!stressDoc.exists()) throw new Error("No stress data found");
      const predictions = stressDoc.data()?.predictions || [];
      if (predictions.length === 0) throw new Error("No predictions available");
      return predictions[predictions.length - 1].predictedClass;
    } catch (error) {
      console.error("Firebase error:", error);
      throw error;
    }
  };

  // Function to get doctor details from recommendation
  const fetchDoctorDetails = async (doctorName) => {
    try {
      const doctorDocRef = doc(db, 'Doctors', doctorName);
      const doctorDoc = await getDoc(doctorDocRef);

      if (!doctorDoc.exists()) throw new Error("Doctor details not found");
      
      const details = doctorDoc.data()?.Details;
      if (!details || details.length === 0) throw new Error("No details available");
      
      return details[0]; // Return the first details record
    } catch (error) {
      console.error("Doctor fetch error:", error);
      throw error;
    }
  };

  // Function to get recommendation from Flask backend
  const getRecommendation = async (district, stressLevel) => {
    try {
      const response = await fetch('http://192.168.148.243:5006/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "Student Location": district,
          "Stress Level": stressLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get recommendation");
      }

      const data = await response.json();
      return data.predicted_name;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);
    setDoctorDetails(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");

      // Get location permission and coordinates
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error("Location permission denied");
      const location = await Location.getCurrentPositionAsync({});

      // Get district
      const currentDistrict = await getSriLankanDistrict(
        location.coords.latitude,
        location.coords.longitude
      );
      setDistrict(currentDistrict);

      // Get stress level
      const userStressLevel = await fetchStressLevel(user.email);
      setStressLevel(userStressLevel);

      // Get recommendation
      const doctorRecommendation = await getRecommendation(currentDistrict, userStressLevel);
      setRecommendation(doctorRecommendation);

      // Get doctor details
      const details = await fetchDoctorDetails(doctorRecommendation);
      setDoctorDetails(details);

    } catch (err) {
      setError(err.message);
      console.error("Error in loadData:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetry = () => {
    loadData();
  };

  const handleBookAppointment = () => {
    Alert.alert(
      "Book Appointment",
      `Would you like to book an appointment with ${doctorDetails?.Name} at ${doctorDetails?.Hospital}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call Now", onPress: () => Linking.openURL('tel:+94112345678') },
        { text: "View Details", onPress: () => console.log("Show more details") }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Finding the best doctor for you...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={handleRetry}
          style={styles.retryButton}
        >
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Doctor Recommendation
      </Text>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Your Location: </Text>
            {district}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Stress Level: </Text>
            {stressLevel}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.recommendationCard}>
        <Card.Content>
          {doctorDetails ? (
            <>
              <Text variant="titleLarge" style={styles.recommendationTitle}>
                Recommended Doctor
              </Text>
              
              <View style={styles.doctorInfoContainer}>
                <Text style={styles.doctorName}>{doctorDetails.Name}</Text>
                <Text style={styles.doctorSpecialty}>{doctorDetails.Specialization}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hospital:</Text>
                  <Text style={styles.detailValue}>{doctorDetails.Hospital}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{doctorDetails['Doctor Location']}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Consultation:</Text>
                  <Text style={styles.detailValue}>
                    {doctorDetails.Consultation_Type} • LKR {doctorDetails['Consultation Fee']}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Availability:</Text>
                  <Text style={styles.detailValue}>
                    {doctorDetails.Availability === "Yes" ? "Available" : "Not Available"}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rating:</Text>
                  <Text style={styles.detailValue}>{doctorDetails.Rate}/5</Text>
                </View>
              </View>
              
              <Button 
                mode="contained" 
                onPress={handleBookAppointment}
                style={styles.actionButton}
                disabled={doctorDetails.Availability !== "Yes"}
              >
                {doctorDetails.Availability === "Yes" ? "Book Appointment" : "Currently Unavailable"}
              </Button>
            </>
          ) : (
            <Text style={styles.noRecommendationText}>
              No doctor details available at this time.
            </Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6200ea',
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  infoCard: {
    marginBottom: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoText: {
    marginBottom: 8,
    fontSize: 16,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  recommendationCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
    elevation: 3,
    borderRadius: 8,
    padding: 15,
  },
  recommendationTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2e7d32',
    fontSize: 20,
  },
  doctorInfoContainer: {
    marginBottom: 20,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  doctorSpecialty: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#444',
  },
  detailValue: {
    flex: 1,
    color: '#666',
  },
  noRecommendationText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#2e7d32',
    marginTop: 10,
  },
});

export default NotificationScreen;