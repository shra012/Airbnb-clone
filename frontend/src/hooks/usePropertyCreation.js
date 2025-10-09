import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyData) => {
      const response = await apiClient.post('/owner/properties', propertyData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch owner dashboard data
      queryClient.invalidateQueries({ queryKey: ['ownerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ownerProperties'] });
      return data;
    },
    onError: (error) => {
      console.error('Property creation failed:', error);
      throw error;
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, propertyData }) => {
      const response = await apiClient.put(`/owner/properties/${propertyId}`, propertyData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch owner dashboard data
      queryClient.invalidateQueries({ queryKey: ['ownerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ownerProperties'] });
      // Invalidate the specific property query
      queryClient.invalidateQueries({ queryKey: ['property', variables.propertyId] });
      return data;
    },
    onError: (error) => {
      console.error('Property update failed:', error);
      throw error;
    },
  });
}

export function useProperty(propertyId) {
  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const response = await apiClient.get(`/properties/${propertyId}`);
      return response.data?.data ?? null;
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Transform form data to match backend API schema
export function transformPropertyFormData(formData, images) {
  const amenitiesArray = Object.entries(formData.amenities || {})
    .filter(([, selected]) => selected)
    .map(([amenity]) => amenity);

  const photosArray = images.map(image => ({
    url: typeof image.url === 'string' ? image.url : image.url?.url || image.url,
    caption: image.caption || '',
    isCover: image.isCover || false,
  }));

  return {
    title: formData.title,
    description: formData.description,
    propertyType: formData.propertyType,
    addressLine1: formData.addressLine1,
    addressLine2: formData.addressLine2 || '',
    city: formData.city,
    state: formData.state,
    country: formData.country,
    postalCode: formData.postalCode || '',
    latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
    longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    pricePerNight: parseFloat(formData.pricePerNight),
    cleaningFee: formData.cleaningFee ? parseFloat(formData.cleaningFee) : undefined,
    bedrooms: parseInt(formData.bedrooms),
    bathrooms: parseInt(formData.bathrooms),
    maxGuests: parseInt(formData.maxGuests),
    checkInTime: formData.checkInTime || '',
    checkOutTime: formData.checkOutTime || '',
    amenities: amenitiesArray,
    photos: photosArray,
  };
}
