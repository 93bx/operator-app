import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import api, { endpoints } from '../config/api';

export interface FileUploadResult {
  success: boolean;
  uri?: string;
  error?: string;
}

export class FileService {
  private static instance: FileService;

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraStatus === 'granted' && mediaStatus === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async takePhoto(): Promise<FileUploadResult> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Camera and media library permissions are required'
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return {
          success: false,
          error: 'Photo capture was cancelled'
        };
      }

      const asset = result.assets[0];
      return {
        success: true,
        uri: asset.uri
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async selectPhoto(): Promise<FileUploadResult> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Media library permission is required'
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return {
          success: false,
          error: 'Photo selection was cancelled'
        };
      }

      const asset = result.assets[0];
      return {
        success: true,
        uri: asset.uri
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async uploadFile(uri: string): Promise<FileUploadResult> {
    try {
      const formData = new FormData();
      
      // Create file object
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'File does not exist'
        };
      }

      const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`
      } as any);

      const response = await api.post(endpoints.upload.single, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return {
          success: true,
          uri: response.data.data.url
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Upload failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async saveToGallery(uri: string): Promise<boolean> {
    try {
      const hasPermission = await MediaLibrary.requestPermissionsAsync();
      if (!hasPermission.granted) {
        return false;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch (error) {
      console.error('Save to gallery error:', error);
      return false;
    }
  }

  async deleteFile(uri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(uri);
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  async getFileSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.size || 0;
    } catch (error) {
      console.error('Get file size error:', error);
      return 0;
    }
  }

  async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    try {
      const compressedUri = `${FileSystem.cacheDirectory}compressed_${Date.now()}.jpg`;
      
      // For now, just copy the file. In a real app, you'd use a compression library
      await FileSystem.copyAsync({
        from: uri,
        to: compressedUri
      });
      
      return compressedUri;
    } catch (error) {
      console.error('Compress image error:', error);
      return uri; // Return original if compression fails
    }
  }
}

export default FileService.getInstance();
