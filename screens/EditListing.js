import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../firebase';

const EditListing = () => {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        address: '',
        description: '',
        price: '',
        amenities: [], // Initialize as an empty array
        host_name: '',
        host_email: '',
        availability: '',
        soil_type: '',
        sunlight_exposure: '',
        tools_included: '',
        medium_url: '',
      });
      
  const [newAmenity, setNewAmenity] = useState('');
  const [image, setImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params; // Get the item passed from MyListingsScreen

  // Load listing data into formData when the component mounts
  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        amenities: Array.isArray(item.amenities) ? item.amenities : [], // Ensure amenities is an array
      });
      setImage(item.medium_url);
    }
  }, [item]);
  

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image || image === formData.medium_url) {
      return formData.medium_url; // Return current image URL if unchanged
    }

    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const uniqueId = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, new Date().toString());
      const imgRef = ref(storage, `GardenImages/${uniqueId}`);
      const uploadTask = uploadBytesResumable(imgRef, blob);

      setUploading(true);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            Alert.alert('Upload failed', error.message);
            setUploading(false);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      Alert.alert('Upload failed', error.message);
      return formData.medium_url;
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()],
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.location || !formData.address || !formData.description || !formData.price) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImage();
      const updatedData = {
        ...formData,
        price: parseFloat(formData.price),
        medium_url: imageUrl,
      };

      const listingRef = doc(db, 'listings', item.id);
      await updateDoc(listingRef, updatedData);
      Alert.alert('Success', 'Listing updated successfully.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update listing. Please try again.');
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Edit Listing</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            value={formData.price.toString()}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
          />

          {/* Amenities Section */}
          <View style={styles.amenitiesContainer}>
            <Text style={styles.inputLabel}>Amenities</Text>
            <View style={styles.amenityInputContainer}>
              <TextInput
                style={styles.amenityInput}
                placeholder="Enter an amenity"
                value={newAmenity}
                onChangeText={setNewAmenity}
              />
              <Pressable onPress={addAmenity} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.amenitiesList}>
              {formData.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                  <Pressable onPress={() => removeAmenity(index)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>x</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          <Pressable onPress={pickImage} style={styles.uploadButton}>
            <Text style={styles.buttonText}>Pick an Image</Text>
          </Pressable>
          {image && <Image source={{ uri: image }} style={styles.previewImage} />}
          {uploading && <Text style={styles.uploadProgressText}>Uploading... {Math.round(uploadProgress)}%</Text>}

          <Pressable onPress={handleFormSubmit} style={styles.submitButton} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditListing;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#e8f5e9',
      padding: 20,
    },
    scrollContainer: {
      paddingBottom: 20,
    },
    formContainer: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#2e7d32',
      marginBottom: 20,
    },
    input: {
      height: 50,
      borderColor: '#c8e6c9',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      marginBottom: 15,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
      color: '#2e7d32',
    },
    amenitiesContainer: {
      marginBottom: 15,
    },
    amenityInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    amenityInput: {
      flex: 1,
      height: 50,
      borderColor: '#c8e6c9',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
    },
    addButton: {
      backgroundColor: '#2e7d32',
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginLeft: 5,
    },
    addButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    amenitiesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
    },
    amenityChip: {
      backgroundColor: '#d0f0c0',
      borderRadius: 15,
      padding: 10,
      marginRight: 5,
      marginBottom: 5,
      flexDirection: 'row',
      alignItems: 'center',
    },
    amenityText: {
      color: '#2e7d32',
    },
    removeButton: {
      marginLeft: 5,
    },
    removeButtonText: {
      color: '#d32f2f',
    },
    uploadButton: {
      backgroundColor: '#2e7d32',
      borderRadius: 5,
      padding: 15,
      alignItems: 'center',
      marginTop: 10,
    },
    previewImage: {
      width: '100%',
      height: 200,
      borderRadius: 10,
      marginTop: 10,
    },
    uploadProgressText: {
      textAlign: 'center',
      color: '#2e7d32',
      marginTop: 5,
    },
    submitButton: {
      backgroundColor: '#4caf50',
      borderRadius: 5,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });