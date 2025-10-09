import { useState, useCallback } from 'react';
import { uploadImageToFirebase } from '../lib/imageUpload';

export default function PropertyImageUploader({ images, setImages, maxImages = 10 }) {
  const [uploading, setUploading] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isImage && isValidSize;
    });

    const remainingSlots = maxImages - images.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);

    for (const file of filesToUpload) {
      const fileId = `${Date.now()}-${Math.random()}`;
      setUploading(prev => ({ ...prev, [fileId]: { progress: 0, file } }));

      try {
        // Use a temporary property ID for organization - will be reorganized after property creation
        const tempPropertyId = `temp-${Date.now()}`;
        const uploadResult = await uploadImageToFirebase(file, tempPropertyId, 'property', 'photo');
        
        const newImage = {
          id: fileId,
          url: uploadResult.url, // Extract just the URL string from the upload result
          caption: '',
          isCover: images.length === 0 && fileId === filesToUpload[0].name, // First image is cover by default
          tempId: fileId,
        };

        setImages(prev => [...prev, newImage]);
        setUploading(prev => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      } catch (error) {
        console.error('Upload failed:', error);
        setUploading(prev => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    }
  }, [images, maxImages, setImages]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  }, [setImages]);

  const updateCaption = useCallback((imageId, caption) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption } : img
    ));
  }, [setImages]);

  const setCoverImage = useCallback((imageId) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, isCover: true }
        : { ...img, isCover: false }
    ));
  }, [setImages]);

  const canUploadMore = images.length + Object.keys(uploading).length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-airbnb-primary bg-airbnb-primary/5'
              : 'border-base-300 hover:border-airbnb-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-airbnb-primary/10 mx-auto">
              <span className="text-2xl text-airbnb-primary">📷</span>
            </div>
            <div>
              <p className="text-lg font-medium text-airbnb-charcoal">
                Drop photos here or click to upload
              </p>
              <p className="text-sm text-airbnb-charcoal/60">
                PNG, JPG up to 10MB each • {maxImages - images.length} remaining
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Files */}
      {Object.entries(uploading).map(([fileId, { file }]) => (
        <div key={fileId} className="card-surface p-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-xl bg-base-200 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-airbnb-charcoal">{file.name}</p>
              <p className="text-sm text-airbnb-charcoal/60">Uploading...</p>
            </div>
            <div className="loading loading-spinner loading-sm text-airbnb-primary"></div>
          </div>
        </div>
      ))}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {images.map((image, index) => (
            <div key={image.id} className="card-surface p-4 space-y-3">
              <div className="relative">
                <img
                  src={image.url}
                  alt={image.caption || `Property photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {!image.isCover && (
                    <button
                      type="button"
                      onClick={() => setCoverImage(image.id)}
                      className="btn btn-sm bg-white/90 hover:bg-white border-none text-airbnb-charcoal"
                      title="Set as cover photo"
                    >
                      ⭐
                    </button>
                  )}
                  {image.isCover && (
                    <span className="badge bg-airbnb-primary text-white text-xs">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="btn btn-sm bg-white/90 hover:bg-white border-none text-error"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Add a caption (optional)"
                value={image.caption}
                onChange={(e) => updateCaption(image.id, e.target.value)}
                className="input input-sm w-full bg-base-100 border-base-300 focus:border-airbnb-primary"
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {images.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-airbnb-charcoal/60">
            {images.length} of {maxImages} photos uploaded
            {images.find(img => img.isCover) && ' • Cover photo selected'}
          </p>
        </div>
      )}
    </div>
  );
}
