import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';

const EducationPlanScreen = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState('');
  const [currentHour, setCurrentHour] = useState(null);
  const scrollViewRef = useRef(null);
  const todayRef = useRef(null);

  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userEmail = user.email;

          // Get the plan number from the study_plans collection
          const studyPlanDocRef = doc(db, 'study_plans', userEmail);
          const studyPlanDoc = await getDoc(studyPlanDocRef);

          if (studyPlanDoc.exists()) {
            const planNumber = studyPlanDoc.data().study_plan;

            // Fetch the plan details from the Plans_study collection using planNumber
            const planDocRef = doc(db, 'Plans_study', planNumber.toString());
            const planDoc = await getDoc(planDocRef);

            if (planDoc.exists()) {
              setPlan(planDoc.data());
            }
          }
        }
      } catch (error) {
        console.error("Error fetching plan data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();

    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setCurrentDay(dayNames[today]);

    const currentDate = new Date();
    setCurrentHour(currentDate.getHours());

  }, []);

  useEffect(() => {
    if (todayRef.current && scrollViewRef.current) {
      setTimeout(() => {
        todayRef.current.measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current.scrollTo({ y, animated: true });
          }
        );
      }, 500); // Delay to ensure layout is ready
    }
  }, [plan]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!plan) {
    return <Text>No plan data found.</Text>;
  }

  const isCurrentSession = (session) => {
    const [timeRange] = session.split(': ');
    const [startTime, endTime] = timeRange.split(" - ").map(time => convertTo24HourFormat(time.trim()));

    const currentDate = new Date();
    const currentTimeInMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
    const startTimeInMinutes = startTime.hours * 60 + startTime.minutes;
    const endTimeInMinutes = endTime.hours * 60 + endTime.minutes;

    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  };

  const convertTo24HourFormat = (time) => {
    const [hour, minute] = time.split(":");
    const amPm = time.split(" ")[1].toUpperCase();
    let adjustedHour = parseInt(hour);

    if (amPm === "PM" && adjustedHour < 12) {
      adjustedHour += 12;
    } else if (amPm === "AM" && adjustedHour === 12) {
      adjustedHour = 0;
    }

    return { hours: adjustedHour, minutes: parseInt(minute.split(" ")[0]) };
  };

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <ScrollView ref={scrollViewRef}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Education Plan</Text>

        {daysOrder.map((day) => (
          plan[day] ? (
            <View
              key={day}
              ref={day === currentDay ? todayRef : null} // Assign ref only to today's schedule
              style={{
                marginVertical: 10,
                padding: 10,
                borderWidth: day === currentDay ? 2 : 0,
                borderColor: day === currentDay ? '#00f' : 'transparent',
                backgroundColor: day === currentDay ? '#f0f8ff' : 'transparent',
                borderRadius: 5,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{day}</Text>
              {plan[day].map((session, index) => (
                <View
                  key={index}
                  style={{
                    padding: 5,
                    backgroundColor: day === currentDay && isCurrentSession(session) ? '#FFFF00' : 'transparent',
                    borderRadius: 5,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{session}</Text>
                </View>
              ))}
            </View>
          ) : null
        ))}
      </View>
    </ScrollView>
  );
};

export default EducationPlanScreen;
