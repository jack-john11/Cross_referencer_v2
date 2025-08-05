/**
 * File Upload Service
 * Handles file uploads to Firebase Storage and triggers Cloud Functions
 */

import { DocumentType, FileDocument } from '@ecologen/shared-types'
import { httpsCallable } from 'firebase/functions'
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage'
import { functions, storage } from '@/lib/firebase'

export interface UploadProgress {
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
}


export class FileUploadService {
  /**
   * Uploads a file to Firebase Storage and triggers document processing
   */
  static async upload(
    file: File,
    documentType: DocumentType,
    projectId: string,
    onProgress: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; data?: any; error?: string; errorType?: string }> {
    try {
      const userId = 'default-user'; // TODO: Get from auth context
      
      // Step 1: Upload to Firebase Storage
      onProgress({
        progress: 10,
        status: 'uploading'
      });
      
      const timestamp = Date.now();
      const fileName = `projects/${projectId}/${documentType}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, file);
      
      onProgress({
        progress: 50,
        status: 'uploading'
      });
      
      // Get download URL
      const fileUrl = await getDownloadURL(uploadResult.ref);
      
      onProgress({
        progress: 70,
        status: 'processing'
      });
      
      // Step 2: Trigger document processing
      console.log('Calling processDocument function...');
      const processDocumentFunction = httpsCallable(functions, 'processDocument');
      
      console.log('ProcessDocument payload:', {
        fileUrl,
        documentType,
        userId,
        projectId,
        fileName: file.name,
        fileType: file.type
      });
      
      // Add timeout to prevent hanging
      const processingPromise = processDocumentFunction({
        fileUrl,
        documentType,
        userId,
        projectId,
        fileName: file.name,
        fileType: file.type
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function call timeout after 60 seconds')), 60000);
      });
      
      const processingResult = await Promise.race([processingPromise, timeoutPromise]);
      
      console.log('ProcessDocument result:', processingResult);
      
      onProgress({
        progress: 100,
        status: 'completed'
      });
      
      return {
        success: true,
        data: {
          fileUrl,
          processingResult: processingResult.data,
          fileName: file.name,
          documentType,
          projectId
        }
      };
      
    } catch (error: any) {
      console.error('Upload/processing error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      
      onProgress({
        progress: 0,
        status: 'failed'
      });
      
      return {
        success: false,
        error: error.message || 'Upload failed',
        errorType: error.code || 'upload_error'
      };
    }
  }
}

/**
 * Convenience function for direct upload - matches the expected import
 */
export const uploadFile = FileUploadService.upload;
