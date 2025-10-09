import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthActions } from '../../hooks/useAuth';

const ownerDefaults = {
  name: '',
  email: '',
  password: '',
};

const travelerDefaults = {
  name: '',
  email: '',
  password: '',
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { signupOwner, signupTraveler } = useAuthActions();
  const [role, setRole] = useState('owner');
  const [ownerForm, setOwnerForm] = useState(ownerDefaults);
  const [travelerForm, setTravelerForm] = useState(travelerDefaults);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const roleText = useMemo(
    () => ({
      owner: {
        title: 'Create your host account',
        description: 'Start hosting and manage your properties with our powerful dashboard tools.',
      },
      traveler: {
        title: 'Create your traveler account',
        description: 'Discover amazing stays and book unforgettable experiences around the world.',
      },
    }),
    []
  );

  const activeForm = useMemo(
    () => (role === 'owner' ? ownerForm : travelerForm),
    [ownerForm, travelerForm, role]
  );

  const setFieldValue = (name, value) => {
    if (role === 'owner') {
      setOwnerForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setTravelerForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (role === 'owner') {
        await signupOwner(ownerForm);
      } else {
        await signupTraveler(travelerForm);
      }
      setSuccess('Account created! You can now sign in.');
      setOwnerForm(ownerDefaults);
      setTravelerForm(travelerDefaults);
      setTimeout(() => navigate('/auth/login'), 1200);
    } catch (err) {
      setError(err.message || 'Unable to sign up right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (name, label, options = {}) => {
    const {
      type = 'text',
      multiline = false,
      required = false,
      autoComplete,
      placeholder,
      className = '',
    } = options;
    const value = activeForm[name] ?? '';

    return (
      <div key={name} className={`form-control ${className}`}>
        <label htmlFor={name} className="label">
          <span className="label-text text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
            {label}
          </span>
        </label>
        {multiline ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={(event) => setFieldValue(name, event.target.value)}
            required={required}
            autoComplete={autoComplete}
            placeholder={placeholder}
            className="textarea textarea-lg rounded-2xl border-base-200 bg-base-100 min-h-[120px] focus:border-airbnb-primary focus:outline-none focus:ring-2 focus:ring-airbnb-primary/20"
          />
        ) : (
          <input
            id={name}
            name={name}
            value={value}
            onChange={(event) => setFieldValue(name, event.target.value)}
            required={required}
            autoComplete={autoComplete}
            placeholder={placeholder}
            type={type}
            className="input input-lg rounded-2xl border-base-200 bg-base-100 focus:border-airbnb-primary focus:outline-none focus:ring-2 focus:ring-airbnb-primary/20"
          />
        )}
      </div>
    );
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="space-y-3 text-center -mt-2 mb-2">
        <h3 className="text-lg font-semibold text-airbnb-charcoal">{roleText[role].title}</h3>
        <p className="text-xs text-airbnb-charcoal/70">{roleText[role].description}</p>
      </div>

      <div className="flex justify-center">
        <div className="join">
          <input
            className="join-item btn btn-md rounded-l-full px-6"
            type="radio"
            name="role"
            aria-label="Host / Owner"
            checked={role === 'owner'}
            onChange={() => setRole('owner')}
          />
          <input
            className="join-item btn btn-md rounded-r-full px-6"
            type="radio"
            name="role"
            aria-label="Traveler"
            checked={role === 'traveler'}
            onChange={() => setRole('traveler')}
          />
        </div>
      </div>

      {renderField('name', 'Full name', { required: true, autoComplete: 'name', placeholder: 'John Doe' })}
      {renderField('email', 'Email address', {
        type: 'email',
        required: true,
        autoComplete: 'email',
        placeholder: 'your-email@domain.com',
      })}
      {renderField('password', 'Password', {
        type: 'password',
        required: true,
        autoComplete: 'new-password',
        placeholder: 'At least 8 characters',
      })}

      {error && (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg rounded-2xl border-none text-base font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? <span className="loading loading-spinner" /> : 'Create account'}
      </button>

      <div className="text-center text-sm text-airbnb-charcoal/60">
        By creating an account you agree to our terms of service and community guidelines.
      </div>

      <div className="text-center text-sm text-airbnb-charcoal/60">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-airbnb-primary">
          Sign in
        </Link>
      </div>
    </form>
  );
}
