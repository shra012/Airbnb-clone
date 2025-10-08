import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const uploadImageToFirebase = async (file, userId, userRole, type = 'avatar') => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB.');
  }

  try {
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${type}_${timestamp}.${fileExtension}`;
    
    // Create storage reference with role-based organization
    const rolePath = userRole.toLowerCase(); // 'owner' or 'traveler'
    const storageRef = ref(storage, `avatars/${rolePath}/${userId}/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      fileName,
      rolePath,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

export const generateAvatarPath = (userId, userRole) => {
  const rolePath = userRole.toLowerCase();
  return `avatars/${rolePath}/${userId}/avatar_${Date.now()}`;
};