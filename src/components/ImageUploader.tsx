// File: src/components/ImageUploader.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '@/src/utils/storageService';
import { useTheme } from '@/src/context/ThemeContext';

interface ImageUploaderProps {
  onUploadSuccess: (filePath: string, signedUrl: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadSuccess }) => {
  const { colors } = useTheme();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const pickAndUploadImage = async () => {
    // 1. Request hardware permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    // 2. Launch native image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // Compress slightly for mobile performance
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileName = `avatar-${Date.now()}.jpg`;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 3. Upload with real-time tracking
      const uploadedPath = await storageService.uploadWithProgress(
        asset.uri,
        fileName,
        'image/jpeg',
        (percentage) => setUploadProgress(percentage)
      );

      // 4. Immediately fetch a signed URL to render the image securely
      const signedUrl = await storageService.getSignedUrl(uploadedPath);
      
      if (signedUrl) {
        setPreviewUri(signedUrl);
        onUploadSuccess(uploadedPath, signedUrl);
      }
    } catch (error) {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Image Preview Window */}
      <View style={[styles.previewBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.image} />
        ) : (
          <Text style={{ color: colors.subText }}>No image selected</Text>
        )}
      </View>

      {/* Dynamic Progress Bar (Requirement 05) */}
      {isUploading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${uploadProgress}%` }]} />
          </View>
          <Text style={{ color: colors.subText, fontSize: 12, marginTop: 4 }}>
            Uploading: {uploadProgress}%
          </Text>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.primary, opacity: isUploading ? 0.5 : 1 }]} 
        onPress={pickAndUploadImage}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.btnText}>Select & Upload Image</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 16 },
  previewBox: { width: 120, height: 120, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 16 },
  image: { width: '100%', height: '100%' },
  progressContainer: { width: '100%', alignItems: 'center', marginBottom: 16 },
  progressBarBg: { width: '80%', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  button: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 6 },
  btnText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }
});
