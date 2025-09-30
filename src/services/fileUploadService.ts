// File Upload Service for Pack 1703 Portal
// Handles file uploads to Firebase Storage

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  StorageReference 
} from 'firebase/storage';
import { storage } from '../firebase/config';

class FileUploadService {
  private readonly STORAGE_PATHS = {
    RECEIPTS: 'financial-receipts',
    DOCUMENTS: 'financial-documents'
  };

  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(
    file: File, 
    path: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Create storage reference
      const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Upload multiple files for a transaction
   */
  async uploadTransactionReceipts(
    files: File[], 
    transactionId: string,
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const path = `${this.STORAGE_PATHS.RECEIPTS}/${transactionId}`;
        return await this.uploadFile(file, path);
      });

      const downloadURLs = await Promise.all(uploadPromises);
      return downloadURLs;
    } catch (error) {
      console.error('Error uploading transaction receipts:', error);
      throw new Error('Failed to upload receipts');
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(downloadURL: string): Promise<void> {
    try {
      const fileRef = ref(storage, downloadURL);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(downloadURLs: string[]): Promise<void> {
    try {
      const deletePromises = downloadURLs.map(url => this.deleteFile(url));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting files:', error);
      throw new Error('Failed to delete files');
    }
  }

  /**
   * Get file info from download URL
   */
  getFileInfo(downloadURL: string): { name: string; type: string } {
    try {
      const url = new URL(downloadURL);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      
      return {
        name: fileName,
        type: this.getFileType(extension)
      };
    } catch (error) {
      return { name: 'Unknown', type: 'unknown' };
    }
  }

  /**
   * Determine file type from extension
   */
  private getFileType(extension: string): string {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const pdfTypes = ['pdf'];
    const documentTypes = ['doc', 'docx', 'txt', 'rtf'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (pdfTypes.includes(extension)) return 'pdf';
    if (documentTypes.includes(extension)) return 'document';
    
    return 'unknown';
  }
}

export const fileUploadService = new FileUploadService();
