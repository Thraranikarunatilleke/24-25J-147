import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Audio } from 'expo-av';
import { auth, db } from '../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const PlaylistScreen = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playlistName, setPlaylistName] = useState('Recommended Playlist');
  const [sound, setSound] = useState(null);
  const [playingSong, setPlayingSong] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    fetchPlaylist();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (playingSong !== null && sound) {
      interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playingSong, sound]);

  const fetchPlaylist = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const predictDocRef = doc(db, 'musicpredict', user.email);
        const predictDoc = await getDoc(predictDocRef);

        if (predictDoc.exists()) {
          const predictions = predictDoc.data().predictions || [];
          if (predictions.length > 0) {
            const latestPrediction = predictions[predictions.length - 1];
            const recommendedPlaylist = latestPrediction.recommendedPlaylist;

            const playlistDocRef = doc(db, 'Playlists', recommendedPlaylist.toString());
            const playlistDoc = await getDoc(playlistDocRef);

            if (playlistDoc.exists()) {
              setSongs(playlistDoc.data().songs);
              setPlaylistName(`Playlist #${recommendedPlaylist}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const playSong = async (songUrl, songIndex) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: songUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingSong(songIndex);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const stopSong = async () => {
    if (sound) {
      await sound.stopAsync();
      setPlayingSong(null);
      setPosition(0);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading your playlist...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{playlistName}</Text>
          <Icon name="playlist-music" size={30} color="#fff" />
        </View>

        {songs.length > 0 ? (
          songs.map((song, index) => (
            <View 
              key={index} 
              style={[
                styles.songCard,
                playingSong === index && styles.playingCard
              ]}
            >
              <Image 
                source={{ uri: song.image || 'https://via.placeholder.com/60' }} 
                style={styles.songImage}
              />
              <View style={styles.songInfo}>
                <Text style={styles.songName} numberOfLines={1}>{song.name}</Text>
                <Text style={styles.songArtist}>{song.artist || 'Unknown Artist'}</Text>
                
                {playingSong === index && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${(position / duration) * 100}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.timeText}>
                      {formatTime(position)} / {formatTime(duration)}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                onPress={() => playingSong === index ? stopSong() : playSong(song.url, index)}
                style={styles.playButton}
              >
                <Icon 
                  name={playingSong === index ? 'stop' : 'play'} 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="music-off" size={50} color="#fff" />
            <Text style={styles.emptyText}>No songs in this playlist</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  playingCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  songImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  songArtist: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  playButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
  },
});

export default PlaylistScreen;