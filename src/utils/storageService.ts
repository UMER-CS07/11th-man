// File: src/utils/storageService.ts
import axios from 'axios';
import { supabase } from '@/src/services/supabase';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;

export const storageService = {
  /**
   * Uploads a file to a private bucket and tracks network transmission progress
   */
  uploadWithProgress: async (
    fileUri: string,
    fileName: string,
    mimeType: string,
    onProgress: (percentage: number) => void
  ): Promise<string> => {
    if (!SUPABASE_URL) {
      throw new Error('Supabase storage endpoint is not configured.');
    }

    // 1. Grab the active authenticated session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Authentication required for upload');

    // 2. Prepare the multipart form data payload
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    // 3. Execute Axios POST to the Supabase Storage REST API
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/cricket-assets/${fileName}`;
    
    await axios.post(uploadUrl, formData, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return fileName;
  },

  /**
   * Requirement 05: Generate a secure, time-limited Signed URL to view private files
   */
  getSignedUrl: async (filePath: string, expiresInSeconds: number = 3600): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('cricket-assets')
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      console.error('Error generating signed URL:', error.message);
      return null;
    }
    return data.signedUrl;
  }
};
