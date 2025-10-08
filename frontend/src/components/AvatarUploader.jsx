import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export default function AvatarUploader({ value, onChange, label = 'Profile photo', userId, userRole }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputId = useId();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Please choose an image smaller than 5MB.');
      return;
    }
    
    if (!userId || !userRole) {
      setError('User information required for upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const fileExtension = file.name.split('.').pop();
      const rolePath = userRole.toLowerCase(); // 'owner' or 'traveler'
      const timestamp = Date.now();
      const fileName = `avatar_${timestamp}.${fileExtension}`;
      const objectRef = ref(storage, `avatars/${rolePath}/${userId}/${fileName}`);
      
      await uploadBytes(objectRef, file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(objectRef);
      onChange(downloadUrl);
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = () => {
    onChange('');
  };

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text text-sm font-medium text-airbnb-charcoal/80">{label}</span>
      </label>
      <div className="flex items-center gap-4 rounded-2xl border border-base-200 bg-base-100 p-4">
        <div className="avatar">
          <div className="h-16 w-16 rounded-full border border-base-200 bg-base-200">
            {value ? <img src={value} alt="Avatar preview" className="h-full w-full object-cover" /> : null}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn btn-sm btn-primary rounded-full px-4" htmlFor={inputId}>
              {isUploading ? <span className="loading loading-spinner" /> : 'Upload photo'}
            </label>
            <input
              id={inputId}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {value && (
              <button
                type="button"
                className="btn btn-sm btn-ghost rounded-full"
                onClick={removeAvatar}
                disabled={isUploading}
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-airbnb-charcoal/60">PNG, JPG up to 5MB. This will appear on your profile.</p>
          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

AvatarUploader.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  userRole: PropTypes.oneOf(['OWNER', 'TRAVELER']).isRequired,
};

AvatarUploader.defaultProps = {
  value: '',
  label: 'Profile photo',
};
