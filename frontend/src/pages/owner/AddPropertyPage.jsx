import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropertyImageUploader from '../../components/PropertyImageUploader';
import { useCreateProperty, useUpdateProperty, useProperty, transformPropertyFormData } from '../../hooks/usePropertyCreation';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';

const PROPERTY_TYPES = [
  'House',
  'Apartment',
  'Condo',
  'Villa',
  'Townhouse',
  'Loft',
  'Studio',
  'Cabin',
  'Cottage',
  'Other',
];

const COMMON_AMENITIES = [
  'WiFi',
  'Kitchen',
  'Washer',
  'Dryer',
  'Air conditioning',
  'Heating',
  'Pool',
  'Hot tub',
  'Gym',
  'Parking',
  'Pets allowed',
  'Smoking allowed',
  'TV',
  'Balcony',
  'Garden',
  'Beach access',
];

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { id: propertyId } = useParams();
  const isEditMode = !!propertyId;
  
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const { data: existingProperty, isLoading: isLoadingProperty, isError: isPropertyError, error: propertyError } = useProperty(propertyId);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    pricePerNight: '',
    cleaningFee: '',
    bedrooms: '1',
    bathrooms: '1',
    maxGuests: '2',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    amenities: {},
  });

  const [images, setImages] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Populate form data when editing
  useEffect(() => {
    if (isEditMode && existingProperty?.success && existingProperty.data) {
      const property = existingProperty.data;
      
      setFormData({
        title: property.title || '',
        description: property.description || '',
        propertyType: property.propertyType || '',
        addressLine1: property.addressLine1 || '',
        addressLine2: property.addressLine2 || '',
        city: property.city || '',
        state: property.state || '',
        country: property.country || '',
        postalCode: property.postalCode || '',
        latitude: property.latitude?.toString() || '',
        longitude: property.longitude?.toString() || '',
        pricePerNight: property.pricePerNight?.toString() || '',
        cleaningFee: property.cleaningFee?.toString() || '',
        bedrooms: property.bedrooms?.toString() || '1',
        bathrooms: property.bathrooms?.toString() || '1',
        maxGuests: property.maxGuests?.toString() || '2',
        checkInTime: property.checkInTime || '15:00',
        checkOutTime: property.checkOutTime || '11:00',
        amenities: (property.amenities || []).reduce((acc, amenity) => {
          acc[amenity.label] = true;
          return acc;
        }, {}),
      });

      // Set existing images
      if (property.photos && property.photos.length > 0) {
        const existingImages = property.photos.map((photo) => ({
          id: `existing-${photo.id}`,
          url: photo.url,
          caption: photo.caption || '',
          isCover: photo.isCover || false,
          existingId: photo.id,
        }));
        setImages(existingImages);
      }
    }
  }, [isEditMode, existingProperty]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity],
      },
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
    }

    if (step === 2) {
      if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
    }

    if (step === 3) {
      if (!formData.pricePerNight || parseFloat(formData.pricePerNight) <= 0) {
        newErrors.pricePerNight = 'Price per night must be greater than 0';
      }
      if (!formData.bedrooms || parseInt(formData.bedrooms) <= 0) {
        newErrors.bedrooms = 'Bedrooms must be greater than 0';
      }
      if (!formData.bathrooms || parseInt(formData.bathrooms) <= 0) {
        newErrors.bathrooms = 'Bathrooms must be greater than 0';
      }
      if (!formData.maxGuests || parseInt(formData.maxGuests) <= 0) {
        newErrors.maxGuests = 'Max guests must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    if (images.length === 0) {
      setErrors({ images: 'At least one photo is required' });
      return;
    }

    try {
      const propertyData = transformPropertyFormData(formData, images);
      let result;
      
      if (isEditMode) {
        result = await updateProperty.mutateAsync({ 
          propertyId: parseInt(propertyId), 
          propertyData 
        });
      } else {
        result = await createProperty.mutateAsync(propertyData);
      }
      
      if (result.success) {
        navigate('/owner/dashboard', { 
          state: { 
            message: isEditMode 
              ? 'Property updated successfully!' 
              : 'Property created successfully!' 
          }
        });
      }
    } catch (error) {
      console.error(`Property ${isEditMode ? 'update' : 'creation'} failed:`, error);
      setErrors({ 
        submit: error.response?.data?.message || 
          `Failed to ${isEditMode ? 'update' : 'create'} property. Please try again.`
      });
    }
  };

  if (isLoadingProperty) {
    return <LoadingScreen message="Loading property..." />;
  }

  if (isPropertyError) {
    return <ErrorState message={propertyError?.message || 'Failed to load property'} retry={() => window.location.reload()} />;
  }

  if (createProperty.isPending || updateProperty.isPending) {
    return <LoadingScreen message={isEditMode ? "Updating your property..." : "Creating your property..."} />;
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-airbnb-charcoal mb-2">Basic Information</h2>
        <p className="text-airbnb-charcoal/60">
          {isEditMode ? 'Update your property details' : 'Tell us about your property'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
            Property Title *
          </label>
          <input
            type="text"
            placeholder="Beautiful downtown apartment with city views"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`input input-lg w-full bg-base-100 border-2 ${
              errors.title ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
            }`}
          />
          {errors.title && <p className="text-error text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
            Description *
          </label>
          <textarea
            placeholder="Describe your property, what makes it special, and what guests can expect..."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={5}
            className={`textarea textarea-lg w-full bg-base-100 border-2 ${
              errors.description ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
            }`}
          />
          {errors.description && <p className="text-error text-sm mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
            Property Type *
          </label>
          <select
            value={formData.propertyType}
            onChange={(e) => handleInputChange('propertyType', e.target.value)}
            className={`select select-lg w-full bg-base-100 border-2 ${
              errors.propertyType ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
            }`}
          >
            <option value="">Select property type</option>
            {PROPERTY_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.propertyType && <p className="text-error text-sm mt-1">{errors.propertyType}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-airbnb-charcoal mb-2">Location</h2>
        <p className="text-airbnb-charcoal/60">Where is your property located?</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Address Line 1 *
            </label>
            <input
              type="text"
              placeholder="123 Main Street"
              value={formData.addressLine1}
              onChange={(e) => handleInputChange('addressLine1', e.target.value)}
              className={`input input-lg w-full bg-base-100 border-2 ${
                errors.addressLine1 ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
              }`}
            />
            {errors.addressLine1 && <p className="text-error text-sm mt-1">{errors.addressLine1}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              placeholder="Apt 4B (optional)"
              value={formData.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              className="input input-lg w-full bg-base-100 border-2 border-base-300 focus:border-airbnb-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              City *
            </label>
            <input
              type="text"
              placeholder="San Francisco"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`input input-lg w-full bg-base-100 border-2 ${
                errors.city ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
              }`}
            />
            {errors.city && <p className="text-error text-sm mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              State *
            </label>
            <input
              type="text"
              placeholder="California"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={`input input-lg w-full bg-base-100 border-2 ${
                errors.state ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
              }`}
            />
            {errors.state && <p className="text-error text-sm mt-1">{errors.state}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Country *
            </label>
            <input
              type="text"
              placeholder="United States"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className={`input input-lg w-full bg-base-100 border-2 ${
                errors.country ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
              }`}
            />
            {errors.country && <p className="text-error text-sm mt-1">{errors.country}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Postal Code
            </label>
            <input
              type="text"
              placeholder="94105"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className="input input-lg w-full bg-base-100 border-2 border-base-300 focus:border-airbnb-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="37.7749"
              value={formData.latitude}
              onChange={(e) => handleInputChange('latitude', e.target.value)}
              className="input input-lg w-full bg-base-100 border-2 border-base-300 focus:border-airbnb-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="-122.4194"
              value={formData.longitude}
              onChange={(e) => handleInputChange('longitude', e.target.value)}
              className="input input-lg w-full bg-base-100 border-2 border-base-300 focus:border-airbnb-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-airbnb-charcoal mb-2">Details & Pricing</h2>
        <p className="text-airbnb-charcoal/60">Set your property details and pricing</p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Price per Night ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="150.00"
              value={formData.pricePerNight}
              onChange={(e) => handleInputChange('pricePerNight', e.target.value)}
              className={`input input-lg w-full bg-base-100 border-2 ${
                errors.pricePerNight ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
              }`}
            />
            {errors.pricePerNight && <p className="text-error text-sm mt-1">{errors.pricePerNight}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Cleaning Fee ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="25.00"
              value={formData.cleaningFee}
              onChange={(e) => handleInputChange('cleaningFee', e.target.value)}
              className="input input-lg w-full bg-base-100 border-2 border-base-300 focus:border-airbnb-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Bedrooms *
            </label>
            <input
              type="number"
              min="1"
              value={formData.bedrooms}
              onChange={(e) => handleInputChange('bedrooms', e.target.value)}
              className={`input input-lg w-full bg-base-100 border-2 ${
                errors.bedrooms ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
              }`}
            />
            {errors.bedrooms && <p className="text-error text-sm mt-1">{errors.bedrooms}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Bathrooms *
            </label>
            <input
              type="number"
              min="1"
              value={formData.bathrooms}
              onChange={(e) => handleInputChange('bathrooms', e.target.value)}
              className={`input input-lg w-full bg-base-100 border-2 ${
                errors.bathrooms ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
              }`}
            />
            {errors.bathrooms && <p className="text-error text-sm mt-1">{errors.bathrooms}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Max Guests *
            </label>
            <input
              type="number"
              min="1"
              value={formData.maxGuests}
              onChange={(e) => handleInputChange('maxGuests', e.target.value)}
              className={`input input-lg w-full bg-base-100 border-2 ${
                errors.maxGuests ? 'border-error' : 'border-base-300 focus:border-airbnb-primary'
              }`}
            />
            {errors.maxGuests && <p className="text-error text-sm mt-1">{errors.maxGuests}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Check-in Time
            </label>
            <input
              type="time"
              value={formData.checkInTime}
              onChange={(e) => handleInputChange('checkInTime', e.target.value)}
              className="input input-lg w-full bg-base-100 border-2 border-base-300 focus:border-airbnb-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
              Check-out Time
            </label>
            <input
              type="time"
              value={formData.checkOutTime}
              onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
              className="input input-lg w-full bg-base-100 border-2 border-base-300 focus:border-airbnb-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-airbnb-charcoal mb-3">
            Amenities
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            {COMMON_AMENITIES.map(amenity => (
              <label key={amenity} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities[amenity] || false}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="checkbox checkbox-primary"
                />
                <span className="text-sm text-airbnb-charcoal">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-airbnb-charcoal mb-2">Property Photos</h2>
        <p className="text-airbnb-charcoal/60">
          {isEditMode ? 'Update photos to showcase your property' : 'Add photos to showcase your property'}
        </p>
      </div>

      <PropertyImageUploader 
        images={images} 
        setImages={setImages}
        maxImages={10}
      />

      {errors.images && (
        <div className="alert alert-error">
          <span>{errors.images}</span>
        </div>
      )}

      {errors.submit && (
        <div className="alert alert-error">
          <span>{errors.submit}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="steps steps-horizontal w-full">
        <div className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Basic Info</div>
        <div className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Location</div>
        <div className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Details</div>
        <div className={`step ${currentStep >= 4 ? 'step-primary' : ''}`}>Photos</div>
      </div>

      {/* Form Content */}
      <div className="card-surface p-8 min-h-[600px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => navigate('/owner/dashboard')}
          className="btn btn-ghost"
          disabled={createProperty.isPending || updateProperty.isPending}
        >
          Cancel
        </button>

        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline"
              disabled={createProperty.isPending || updateProperty.isPending}
            >
              Previous
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={createProperty.isPending || updateProperty.isPending}
            >
              {createProperty.isPending || updateProperty.isPending 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Property' : 'Create Property')
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
