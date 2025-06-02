import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';

const BackgroundFormScreen = ({ navigation }) => {
  const [gender, setGender] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [family, setFamily] = useState('');
  const [dalc, setDalc] = useState('');
  const [walc, setWalc] = useState('');
  const [guardian, setGuardian] = useState('');
  const [schoolsup, setSchoolsup] = useState('');
  const [paidClass, setPaidClass] = useState('');
  const [parentedu, setParentEdu] = useState('');

  // Separate open states for each dropdown
  const [openGender, setOpenGender] = useState(false);
  const [openHobbies, setOpenHobbies] = useState(false);
  const [openFamily, setOpenFamily] = useState(false);
  const [openGuardian, setOpenGuardian] = useState(false);
  const [openParentEdu, setOpenParentEdu] = useState(false);
  const [openSchoolsup, setOpenSchoolsup] = useState(false);
  const [openPaidClass, setOpenPaidClass] = useState(false);
  const [openDalc, setOpenDalc] = useState(false);
  const [openWalc, setOpenWalc] = useState(false);

  const [items, setItems] = useState([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ]);
  const [extra, setExtra] = useState([
    { label: 'High', value: 'High' },
    { label: 'Low', value: 'Low' },
    { label: 'None', value: 'None' }
  ]);
  const [fam, setFam] = useState([
    { label: 'Minimal', value: 'Minimal' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'None', value: 'None' },
    { label: 'Strong', value: 'Strong' }
  ]);

  const [guard, setGuard] = useState([
    { label: 'Father', value: 'father' },
    { label: 'Mother', value: 'mother' },
    { label: 'Other', value: 'other' }
  ]);

  const [paredu, setParEdu] = useState([
    { label: 'Degree', value: 'Degree' },
    { label: 'Diploma level', value: 'Diploma level' },
    { label: 'High school', value: 'High school' },
    { label: 'Master', value: 'Master' },
    { label: 'None', value: 'None' },
    { label: 'NVQ qualified', value: 'NVQ qualified' }
  ]);

  const [schools, setSchools] = useState([
    { label: 'High', value: 'High' },
    { label: 'None', value: 'None' }
  ]);

  const [paidc, setPaidC] = useState([
    { label: 'High', value: 'High' },
    { label: 'None', value: 'None' }
  ]);

  const [dalcit, setDalcIt] = useState([
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' }
  ]);

  const [walcit, setWalcIt] = useState([
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' }
  ]);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    try {
      // Use the user's email (ensure it's in lowercase to avoid issues with Firestore document IDs)
      const userEmail = user.email.toLowerCase();
  
      // Save background data using the email as the document ID
      await setDoc(doc(db, 'background', userEmail), {
        gender,
        hobbies,
        family,
        dalc,
        walc,
        guardian,
        schoolsup,
        paidClass,
        parentedu,
        email: user.email,
      });
  
      // Optionally, update other user details (like marking background as completed)
      await setDoc(doc(db, 'users', user.uid), { backgroundCompleted: true }, { merge: true });
  
      alert('Background information saved successfully!');
      navigation.replace('Drawer'); // Navigate to next screen after saving
    } catch (error) {
      alert(error.message);
    }
  };  

  const renderDropdown = (value, setValue, items, placeholder, openState, setOpenState) => (
    <View style={{ zIndex: 1000, width: '90%' ,position: 'relative' }}>
      <DropDownPicker
        open={openState}
        value={value}
        items={items}
        setOpen={setOpenState}
        setValue={setValue}
        setItems={items}
        placeholder={placeholder}
        dropDownDirection="TOP"
        style={{ borderColor: '#ccc' }}
        maxHeight={350} // 
        dropDownContainerStyle={{
          backgroundColor: "#fafafa",
          zIndex: 0,  // Ensure dropdown is in front of other elements
          position: 'absolute',
        }}
      />
    </View>
  );

  const formData = [
    { value: gender, setValue: setGender, items, placeholder: "Select Gender", openState: openGender, setOpenState: setOpenGender },
    { value: hobbies, setValue: setHobbies, items: extra, placeholder: "Select Extracurricular Activities", openState: openHobbies, setOpenState: setOpenHobbies },
    { value: family, setValue: setFamily, items: fam, placeholder: "Family Support", openState: openFamily, setOpenState: setOpenFamily },
    { value: dalc, setValue: setDalc, items: dalcit, placeholder: "Daily Alcohol Consumption", openState: openDalc, setOpenState: setOpenDalc },
    { value: walc, setValue: setWalc, items: walcit, placeholder: "Weekend Alcohol Consumption", openState: openWalc, setOpenState: setOpenWalc },
    { value: guardian, setValue: setGuardian, items: guard, placeholder: "Guardian", openState: openGuardian, setOpenState: setOpenGuardian },
    { value: parentedu, setValue: setParentEdu, items: paredu, placeholder: "Parent Education", openState: openParentEdu, setOpenState: setOpenParentEdu },
    { value: schoolsup, setValue: setSchoolsup, items: schools, placeholder: "Does the student receive extra education support from school?", openState: openSchoolsup, setOpenState: setOpenSchoolsup },
    { value: paidClass, setValue: setPaidClass, items: paidc, placeholder: "Does the student receive extra paid classes?", openState: openPaidClass, setOpenState: setOpenPaidClass },
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <FlatList
        contentContainerStyle={styles.scrollContainer}
        data={formData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          if (item.items) {
            return renderDropdown(item.value, item.setValue, item.items, item.placeholder, item.openState, item.setOpenState);
          } else {
            return (
              <TextInput
                label={item.placeholder}
                value={item.value}
                onChangeText={item.setValue}
                mode="outlined"
                style={styles.input}
              />
            );
          }
        }}
        ListHeaderComponent={<Text variant="headlineLarge" style={styles.title}>Background Info</Text>}
      />
      
      <Button mode="contained" onPress={handleSubmit} style={styles.button}>
        Submit
      </Button>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginBottom: 30,
    marginLeft: 20,
    backgroundColor: '#6200ea',
  },
});

export default BackgroundFormScreen;
