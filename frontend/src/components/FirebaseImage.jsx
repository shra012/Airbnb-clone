import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export default function FirebaseImage({
  path,
  alt = '',
  className = '',
  fallback = null,
  onLoad = () => {},
  onError = () => {},
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadCallbackRef = useRef(onLoad || (() => {}));
  const errorCallbackRef = useRef(onError || (() => {}));

  useEffect(() => {
    loadCallbackRef.current = onLoad || (() => {});
  }, [onLoad]);

  useEffect(() => {
    errorCallbackRef.current = onError || (() => {});
  }, [onError]);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      if (!path) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const imageRef = ref(storage, path);
        const url = await getDownloadURL(imageRef);

        if (mounted) {
          setImageUrl(url);
          setLoading(false);
          loadCallbackRef.current(url);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
          errorCallbackRef.current(err);
          console.error(`Failed to load image from path: ${path}`, err);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [path]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gradient-to-br from-base-300 to-base-200 ${className}`}>
        <div className="h-full w-full flex items-center justify-center">
          <span className="loading loading-spinner loading-md text-airbnb-charcoal/20"></span>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return fallback || (
      <div className={`bg-base-200 flex items-center justify-center ${className}`}>
        <span className="text-xs text-airbnb-charcoal/40">Image not available</span>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

FirebaseImage.propTypes = {
  path: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
  fallback: PropTypes.node,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};
