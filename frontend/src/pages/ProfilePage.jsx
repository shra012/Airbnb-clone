import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { useUpdateTravelerProfile, useUpdateOwnerProfile } from '../hooks/useProfile';
import AvatarUploader from '../components/AvatarUploader';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import geoData from '../data/geo.json';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const updateTravelerProfile = useUpdateTravelerProfile();
  const updateOwnerProfile = useUpdateOwnerProfile();

  const countries = useMemo(() => geoData.countries ?? [], []);
  const usStates = useMemo(() => geoData.usStates ?? [], []);
  const indiaStates = useMemo(() => geoData.indiaStates ?? [], []);
  const travelerCountries = useMemo(
    () => countries.filter((country) => country.code === 'US' || country.code === 'IN'),
    [countries]
  );
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const activeStateOptions = useMemo(() => {
    if (formData.country === 'US') {
      return usStates;
    }
    if (formData.country === 'IN') {
      return indiaStates;
    }
    return [];
  }, [formData.country, indiaStates, usStates]);
  const isTraveler = user?.role === 'TRAVELER';

  // Initialize form data when user data loads
  useEffect(() => {
    if (!user) {
      return;
    }

    const profile = isTraveler ? user.travelerProfile : user.ownerProfile;
    const allowedCountry =
      profile?.country && ['US', 'IN'].includes(profile.country.toUpperCase())
        ? profile.country.toUpperCase()
        : '';
    const normalizedState = profile?.state ? profile.state.toUpperCase() : '';

    setFormData({
      name: user.name || '',
      email: user.email || '',
      ...(isTraveler && {
        phone: user.phone || '',
      }),
      about: profile?.about || '',
      avatarUrl: profile?.avatarUrl || '',
      ...(isTraveler && {
        city: profile?.city || '',
        state: normalizedState,
        country: allowedCountry,
        languages: profile?.languages || '',
        gender: profile?.gender || '',
      }),
      ...(!isTraveler && {
        location: profile?.location || '',
        phone: profile?.phone || '',
        company: profile?.company || '',
      }),
    });
  }, [isTraveler, user]);

  useEffect(() => {
    if (!formData.state) {
      return;
    }

    const isValid = activeStateOptions.some((state) => state.code === formData.state);
    if (!isValid) {
      setFormData((prev) => ({ ...prev, state: '' }));
    }
  }, [activeStateOptions, formData.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'country') {
      const normalizedCountry = value ? value.toUpperCase() : '';
      setFormData((prev) => ({
        ...prev,
        country: normalizedCountry,
        state: '',
      }));
      return;
    }

    if (name === 'state') {
      setFormData((prev) => ({
        ...prev,
        state: value ? value.toUpperCase() : '',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (user.role === 'TRAVELER') {
        await updateTravelerProfile.mutateAsync(formData);
      } else {
        await updateOwnerProfile.mutateAsync(formData);
      }
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) return <LoadingScreen />;
  if (userError) return <ErrorState message="Failed to load user data" />;
  if (!user) {
    navigate('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200 pt-20">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="card-surface p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-airbnb-charcoal">Your Profile</h1>
            <p className="text-sm text-airbnb-charcoal/70 mt-1">
              Update your profile information and preferences
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <AvatarUploader
              value={formData.avatarUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
              label="Profile Photo"
              userId={user.id}
              userRole={user.role}
            />

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name ?? ''}
                  onChange={handleInputChange}
                  required
                  className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Your full name"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email ?? ''}
                  onChange={handleInputChange}
                  required
                  className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="name@example.com"
                />
              </div>
              {isTraveler && (
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Phone number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone ?? ''}
                    onChange={handleInputChange}
                    className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="+1 555 000 1234"
                  />
                </div>
              )}
            </div>

            {/* About */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium text-airbnb-charcoal/80">About</span>
              </label>
              <textarea
                name="about"
                value={formData.about ?? ''}
                onChange={handleInputChange}
                className="textarea textarea-bordered w-full min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Traveler-specific fields */}
            {isTraveler && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-airbnb-charcoal/80">City</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city ?? ''}
                      onChange={handleInputChange}
                      className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Your city"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-airbnb-charcoal/80">State / Region</span>
                    </label>
                    <select
                      name="state"
                      value={formData.state ?? ''}
                      onChange={handleInputChange}
                      disabled={activeStateOptions.length === 0}
                      className="select select-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">
                        {activeStateOptions.length === 0 ? 'Select a country first' : 'Select state'}
                      </option>
                      {activeStateOptions.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 text-xs text-airbnb-charcoal/50">
                      {formData.country === 'US'
                        ? 'States limited to the United States.'
                        : formData.country === 'IN'
                        ? 'States limited to India.'
                        : 'Select India or the United States to choose a state.'}
                    </span>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Country</span>
                  </label>
                  <select
                    name="country"
                    value={formData.country ?? ''}
                    onChange={handleInputChange}
                    className="select select-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Select country</option>
                    {travelerCountries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Languages</span>
                    </label>
                    <input
                      type="text"
                      name="languages"
                      value={formData.languages ?? ''}
                      onChange={handleInputChange}
                      className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Languages you speak"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Gender</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender ?? ''}
                      onChange={handleInputChange}
                      className="select select-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Owner-specific fields */}
            {!isTraveler && (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Location</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location ?? ''}
                    onChange={handleInputChange}
                    className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Your location"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Phone</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone ?? ''}
                      onChange={handleInputChange}
                      className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Company</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company ?? ''}
                      onChange={handleInputChange}
                      className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Company name (optional)"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost rounded-full px-8"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-full px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
