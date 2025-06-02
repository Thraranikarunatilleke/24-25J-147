import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

const PerformanceDisplay = () => {
  const [performances, setPerformances] = useState({
    math: [],
    physics: [],
    chemistry: [],
  });
  const [stressData, setStressData] = useState([]);
  const [musicData, setMusicData] = useState([]);
  const [emotionData, setEmotionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformances = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('User not logged in');
          return;
        }

        const userEmail = user.email.toLowerCase();

        // Fetch performance data
        const performanceDocRef = doc(db, 'Performance', userEmail);
        const docSnap = await getDoc(performanceDocRef);

        if (docSnap.exists()) {
          const historicalData = docSnap.data().historicalData;

          const lastThreeMath = historicalData.slice(-3).map((entry) => ({
            score: parseFloat(entry['Previous Mathematics  average'] || 0),
            timestamp: entry.timestamp || 'No date',
          }));

          const lastThreePhysics = historicalData.slice(-3).map((entry) => ({
            score: parseFloat(entry['Previous Physics average'] || 0),
            timestamp: entry.timestamp || 'No date',
          }));

          const lastThreeChemistry = historicalData.slice(-3).map((entry) => ({
            score: parseFloat(entry['Previous Chemistry average'] || 0),
            timestamp: entry.timestamp || 'No date',
          }));

          setPerformances({
            math: lastThreeMath.reverse(),
            physics: lastThreePhysics.reverse(),
            chemistry: lastThreeChemistry.reverse(),
          });
        } else {
          console.log('No performance data found');
        }

        // Fetch stress level data
        const stressDocRef = doc(db, 'stresslevel', userEmail);
        const stressSnap = await getDoc(stressDocRef);

        if (stressSnap.exists()) {
          const predictions = stressSnap.data().predictions || [];
          const lastTwoStress = predictions.slice(-2).map((prediction) => ({
            predictedClass: prediction.predictedClass,
            predictedDoctor: prediction.predictedDoctor,
            timestamp: prediction.timestamp,
          }));
          setStressData(lastTwoStress.reverse());
        } else {
          console.log('No stress level data found');
        }

        // Fetch music prediction data
        const musicDocRef = doc(db, 'musicpredict', userEmail);
        const musicSnap = await getDoc(musicDocRef);

        if (musicSnap.exists()) {
          const predictions = musicSnap.data().predictions || [];
          const lastTwoMusic = predictions.slice(-2).map((prediction) => ({
            mappedEmotion: prediction.mappedEmotion,
            recommendedPlaylist: prediction.recommendedPlaylist,
            timestamp: prediction.timestamp,
          }));
          setMusicData(lastTwoMusic.reverse());
        } else {
          console.log('No music prediction data found');
        }

        // Fetch emotion recognition data
        const emotionDocRef = doc(db, 'emotion_recognition', userEmail);
        const emotionSnap = await getDoc(emotionDocRef);

        if (emotionSnap.exists()) {
          const emotions = emotionSnap.data().emotions || [];
          const lastTwoEmotions = emotions.slice(-2).map((emotion) => ({
            emotion: emotion.emotion,
            confidence: emotion.confidence,
          }));
          setEmotionData(lastTwoEmotions.reverse());
        } else {
          console.log('No emotion recognition data found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformances();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#6200ea" />;
  }

  if (
    performances.math.length === 0 &&
    performances.physics.length === 0 &&
    performances.chemistry.length === 0 &&
    stressData.length === 0 &&
    musicData.length === 0 &&
    emotionData.length === 0
  ) {
    return <Text>No data available.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Performance and Predictions Overview</Text>

      {/* Performance Table */}
      <View style={styles.table}>
        <Text style={styles.tableHeader}>Scores</Text>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.headerCell]}>Performance</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Score</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Timestamp</Text>
        </View>
        {performances.math.map((performance, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.tableCell}>Performance {index + 1}</Text>
            <Text style={styles.tableCell}>{performance.score}</Text>
            <Text style={styles.tableCell}>{performance.timestamp}</Text>
          </View>
        ))}
      </View>

      {/* Stress Levels Table */}
      <View style={styles.table}>
        <Text style={styles.tableHeader}>Stress Levels</Text>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.headerCell]}>Class</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Doctor</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Timestamp</Text>
        </View>
        {stressData.map((stress, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.tableCell}>{stress.predictedClass}</Text>
            <Text style={styles.tableCell}>{stress.predictedDoctor}</Text>
            <Text style={styles.tableCell}>{stress.timestamp}</Text>
          </View>
        ))}
      </View>

      {/* Music Predictions Table */}
      <View style={styles.table}>
        <Text style={styles.tableHeader}>Music Predictions</Text>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.headerCell]}>Emotion</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Playlist</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Timestamp</Text>
        </View>
        {musicData.map((music, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.tableCell}>{music.mappedEmotion}</Text>
            <Text style={styles.tableCell}>{music.recommendedPlaylist}</Text>
            <Text style={styles.tableCell}>{music.timestamp}</Text>
          </View>
        ))}
      </View>

      {/* Emotion Recognition Table */}
      <View style={styles.table}>
        <Text style={styles.tableHeader}>Emotion Recognition</Text>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.headerCell]}>Emotion</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Confidence</Text>
        </View>
        {emotionData.map((emotion, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.tableCell}>{emotion.emotion}</Text>
            <Text style={styles.tableCell}>{emotion.confidence}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#6200ea',
  },
  table: {
    width: '90%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#6200ea',
    color: '#fff',
    padding: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableCell: {
    flex: 1,
    padding: 10,
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
  },
});

export default PerformanceDisplay;
