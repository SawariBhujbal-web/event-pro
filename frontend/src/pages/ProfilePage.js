import React, { useEffect, useRef, useState } from 'react';
import API from '../api';
import { useAuth } from '../AuthContext';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=DM+Sans:wght@400;500;700&display=swap');

/* ---------- Tokens (dark theme) ---------- */
.pp-page {
  /* Match --pp-bg to your site's background so the ticket notches blend in. */
  --pp-bg: #0a0b0f;
  --pp-surface: #13161d;
  --pp-surface-raised: #1a1e29;
  --pp-ink: #f2f4f8;
  --pp-text: #d6dae3;
  --pp-muted: #8f98aa;
  --pp-line: #2a303d;
  --pp-focus: #7f95ff;
  --pp-danger: #ff9b92;
  --pp-danger-bg: #2b1416;
  --pp-ok: #7be0a4;
  --pp-ok-bg: #112619;
  --accent: #7f95ff;
  --on-accent: #0a0b0f;

  --pp-font-display: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  --pp-font-body: 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;

  min-height: 100%;
  padding: 48px 16px 80px;
  background: var(--pp-bg);
  font-family: var(--pp-font-body);
  color: var(--pp-text);
  color-scheme: dark;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  box-sizing: border-box;
}

.pp-page *,
.pp-page *::before,
.pp-page *::after {
  box-sizing: border-box;
}

.pp-wrap {
  width: 100%;
  max-width: 640px;
}

.pp-title {
  margin: 0 0 20px;
  font-family: var(--pp-font-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--pp-ink);
}

/* ---------- The pass (the one memorable element) ---------- */
.pp-pass {
  position: relative;
  overflow: hidden;
  background: var(--pp-surface);
  border: 1px solid var(--pp-line);
  border-radius: 20px;
  box-shadow: 0 24px 48px -28px rgba(0, 0, 0, 0.9);
}

.pp-pass[data-role='user'] { --accent: #7f95ff; }
.pp-pass[data-role='organizer'] { --accent: #ff9a5c; }
.pp-pass[data-role='admin'] { --accent: #b79bff; }

.pp-top {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px 32px 28px;
  background: var(--pp-surface-raised);
  color: var(--pp-ink);
  border-top: 6px solid var(--accent);
}

.pp-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  font-family: var(--pp-font-display);
  font-size: 2rem;
  font-weight: 700;
}

.pp-identity {
  min-width: 0;
}

.pp-identity h2 {
  margin: 0 0 8px;
  font-family: var(--pp-font-display);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--pp-ink);
  overflow-wrap: anywhere;
}

.pp-role {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent);
}

/* Perforated tear line with ticket notches cut into both edges */
.pp-tear {
  position: relative;
  height: 28px;
  background:
    radial-gradient(circle 14px at 0 50%, var(--pp-bg) 98%, transparent 100%) left / 51% 100% no-repeat,
    radial-gradient(circle 14px at 100% 50%, var(--pp-bg) 98%, transparent 100%) right / 51% 100% no-repeat,
    var(--pp-surface);
}

.pp-tear::before {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  top: 50%;
  border-top: 2px dashed var(--pp-line);
}

/* ---------- Body ---------- */
.pp-body {
  padding: 8px 32px 32px;
}

.pp-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 32px;
  margin: 0 0 32px;
}

.pp-field {
  min-width: 0;
}

.pp-field-wide {
  grid-column: 1 / -1;
}

.pp-field dt {
  margin: 0 0 4px;
  font-size: 0.875rem;
  color: var(--pp-muted);
}

.pp-field dd {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 500;
  color: var(--pp-ink);
  overflow-wrap: anywhere;
}

.pp-field dd.pp-empty {
  font-weight: 400;
  color: var(--pp-muted);
}

/* ---------- Form ---------- */
.pp-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;
}

.pp-input {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.pp-input label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--pp-ink);
}

.pp-input input {
  height: 46px;
  padding: 0 14px;
  border: 1.5px solid var(--pp-line);
  border-radius: 10px;
  background: #0d0f14;
  font: inherit;
  color: var(--pp-ink);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.pp-input input::placeholder {
  color: #5f6879;
}

.pp-input input:hover:not(:disabled) {
  border-color: #454d5f;
}

.pp-input input:focus-visible {
  outline: none;
  border-color: var(--pp-focus);
  box-shadow: 0 0 0 3px rgba(127, 149, 255, 0.28);
}

.pp-input input:disabled {
  background: #181b23;
  color: var(--pp-muted);
  -webkit-text-fill-color: var(--pp-muted);
  cursor: not-allowed;
}

.pp-hint {
  font-size: 0.8125rem;
  color: var(--pp-muted);
}

.pp-counter {
  align-self: flex-end;
  margin-top: -2px;
}

/* ---------- Buttons ---------- */
.pp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.pp-btn {
  min-height: 46px;
  padding: 0 22px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.pp-btn:focus-visible {
  outline: 3px solid rgba(127, 149, 255, 0.6);
  outline-offset: 2px;
}

.pp-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pp-btn-primary {
  background: var(--accent);
  color: var(--on-accent);
}

.pp-btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.pp-btn-ghost {
  background: transparent;
  border-color: var(--pp-line);
  color: var(--pp-ink);
}

.pp-btn-ghost:hover:not(:disabled) {
  border-color: var(--pp-muted);
}

/* ---------- Alerts ---------- */
.pp-alert {
  margin: 0 0 16px;
  padding: 12px 16px;
  border-radius: 10px;
  border-left: 4px solid var(--pp-muted);
  background: var(--pp-surface);
  font-size: 0.9375rem;
}

.pp-alert-error {
  border-left-color: var(--pp-danger);
  background: var(--pp-danger-bg);
  color: var(--pp-danger);
}

.pp-alert-success {
  border-left-color: var(--pp-ok);
  background: var(--pp-ok-bg);
  color: var(--pp-ok);
}

/* ---------- Loading skeleton ---------- */
.pp-skel-block {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  height: 20px;
}

.pp-skeleton .pp-avatar {
  background: rgba(255, 255, 255, 0.08);
}

.pp-skel-lines {
  flex: 1;
  display: grid;
  gap: 12px;
}

.pp-skel-block.short { width: 45%; }
.pp-skel-block.tall { height: 48px; margin-top: 24px; }

.pp-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: no-preference) {
  .pp-skeleton .pp-skel-block {
    animation: pp-pulse 1.4s ease-in-out infinite;
  }
  @keyframes pp-pulse {
    50% { opacity: 0.5; }
  }
}

/* ---------- Small screens ---------- */
@media (max-width: 560px) {
  .pp-page { padding: 24px 12px 56px; }
  .pp-top { padding: 24px 20px 22px; gap: 16px; }
  .pp-avatar { width: 60px; height: 60px; font-size: 1.6rem; }
  .pp-identity h2 { font-size: 1.35rem; }
  .pp-body { padding: 4px 20px 24px; }
  .pp-details,
  .pp-form { grid-template-columns: 1fr; }
  .pp-actions .pp-btn { flex: 1 1 100%; }
}
`;

const ROLE_LABEL = {
  user: 'EventPro User',
  organizer: 'Event Organizer',
  admin: 'Administrator'
};

function ProfileContent() {
  const { role, user, login, token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

const [passwordForm, setPasswordForm] = useState({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const [passwordSaving, setPasswordSaving] = useState(false);

  const nameInputRef = useRef(null);

  const hasPhone = role === 'user' || role === 'organizer';
  const hasOrganization = role === 'organizer';

  // `silent` reloads the data without swapping the page for the loading state,
  // so saving doesn't make the card flash.
  const loadProfile = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const response = await API.get('/profile');
      const data = response.data.profile;

      setProfile(data);
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        organization: data.organization || ''
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Unable to load your profile. Please log in again if your session expired.'
      );
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (editing) nameInputRef.current?.focus();
  }, [editing]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const startEditing = () => {
    setMessage('');
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      organization: profile.organization || ''
    });
    setEditing(false);
    setError('');
    setMessage('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const name = form.name.trim();

    if (!name) {
      setError('Name cannot be empty.');
      return;
    }

    if (name.length > 100) {
      setError('Name must be 100 characters or fewer.');
      return;
    }

    if (hasPhone && form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, '');

      if (
        !/^[0-9+() -]+$/.test(form.phone.trim()) ||
        digits.length < 7 ||
        digits.length > 15
      ) {
        setError('Enter a valid phone number with 7 to 15 digits.');
        return;
      }
    }

    if (hasOrganization && form.organization.trim().length > 150) {
      setError('Organization must be 150 characters or fewer.');
      return;
    }

    const updates = { name };
    if (hasPhone) updates.phone = form.phone.trim();
    if (hasOrganization) updates.organization = form.organization.trim();

    setSaving(true);

    try {
      await API.put('/profile', updates);
      await loadProfile({ silent: true });

      // Keep the saved name synchronized with the current login context.
      login({ ...user, name }, role, token);

      setEditing(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Unable to save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

const handlePasswordChange = (event) => {
  setPasswordForm({
    ...passwordForm,
    [event.target.name]: event.target.value
  });
};

const handlePasswordSubmit = async (event) => {
  event.preventDefault();
  setError('');
  setMessage('');

  if (!passwordForm.current_password) {
    setError('Enter your current password.');
    return;
  }

  if (passwordForm.new_password.length < 8) {
    setError('New password must be at least 8 characters long.');
    return;
  }

  if (passwordForm.new_password.length > 72) {
    setError('New password must be 72 characters or fewer.');
    return;
  }

  if (passwordForm.new_password !== passwordForm.confirm_password) {
    setError('The new passwords do not match.');
    return;
  }

  setPasswordSaving(true);

  try {
    const response = await API.put('/change-password', {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password
    });

    setMessage(response.data.message || 'Password changed successfully!');

    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });

    setShowPasswordForm(false);
  } catch (err) {
    setError(
      err.response?.data?.error ||
      'Unable to change password. Please try again.'
    );
  } finally {
    setPasswordSaving(false);
  }
};

  /* ---------- Page states ---------- */

  if (loading) {
    return (
      <main className="pp-page" aria-busy="true">
        <div className="pp-wrap">
          <h1 className="pp-title">My profile</h1>
          <div className="pp-pass pp-skeleton" role="status">
            <span className="pp-sr-only">Loading your profile…</span>
            <div className="pp-top">
              <div className="pp-avatar pp-skel-block" />
              <div className="pp-skel-lines">
                <div className="pp-skel-block" />
                <div className="pp-skel-block short" />
              </div>
            </div>
            <div className="pp-body">
              <div className="pp-skel-block tall" />
              <div className="pp-skel-block tall" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="pp-page">
        <div className="pp-wrap">
          <h1 className="pp-title">My profile</h1>
          <p role="alert" className="pp-alert pp-alert-error">
            {error}
          </p>
          <button type="button" className="pp-btn pp-btn-primary" onClick={() => loadProfile()}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="pp-page">
        <div className="pp-wrap">
          <h1 className="pp-title">My profile</h1>
          <p className="pp-alert">We couldn't find a profile for this account.</p>
        </div>
      </main>
    );
  }

  const createdAt = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Not available';

  const fields = [
    { label: 'Email address', value: profile.email, wide: true },
    ...(hasOrganization
      ? [{ label: 'Organization', value: profile.organization }]
      : []),
    ...(hasPhone ? [{ label: 'Phone', value: profile.phone }] : []),
    { label: 'Member since', value: createdAt }
  ];

  const nameLength = (form.name || '').length;

  return (
    <main className="pp-page">
      <div className="pp-wrap">
        <h1 className="pp-title">My profile</h1>

        {message && (
          <p role="status" className="pp-alert pp-alert-success">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="pp-alert pp-alert-error">
            {error}
          </p>
        )}

        <section className="pp-pass" data-role={role}>
          <div className="pp-top">
            <div className="pp-avatar" aria-hidden="true">
              {(profile.name || 'U').charAt(0).toUpperCase()}
            </div>

            <div className="pp-identity">
              <h2>{profile.name || 'Unnamed account'}</h2>
              <span className="pp-role">{ROLE_LABEL[role] || 'EventPro Account'}</span>
            </div>
          </div>

          <div className="pp-tear" aria-hidden="true" />

          {!editing ? (
            <div className="pp-body">
              <dl className="pp-details">
                {fields.map(({ label, value, wide }) => (
                  <div className={`pp-field${wide ? ' pp-field-wide' : ''}`} key={label}>
                    <dt>{label}</dt>
                    <dd className={value ? '' : 'pp-empty'}>{value || 'Not provided'}</dd>
                  </div>
                ))}
              </dl>

              <div className="pp-actions">
                <button type="button" className="pp-btn pp-btn-primary" onClick={startEditing}>
                  Edit profile
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="pp-body pp-form" noValidate>
              <div className="pp-input pp-field-wide">
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  ref={nameInputRef}
                  name="name"
                  type="text"
                  maxLength={100}
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
                <span className="pp-hint pp-counter">{nameLength}/100</span>
              </div>

              <div className="pp-input pp-field-wide">
                <label htmlFor="profile-email">Email address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email || ''}
                  disabled
                  aria-describedby="profile-email-hint"
                />
                <span id="profile-email-hint" className="pp-hint">
                  Your email is your login and can't be changed here.
                </span>
              </div>

              {hasOrganization && (
                <div className="pp-input">
                  <label htmlFor="profile-organization">Organization</label>
                  <input
                    id="profile-organization"
                    name="organization"
                    type="text"
                    maxLength={150}
                    value={form.organization}
                    onChange={handleChange}
                    placeholder="Company or group name"
                    autoComplete="organization"
                  />
                </div>
              )}

              {hasPhone && (
                <div className="pp-input">
                  <label htmlFor="profile-phone">Phone number</label>
                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                  />
                </div>
              )}

              <div className="pp-actions pp-field-wide">
                <button type="submit" className="pp-btn pp-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="pp-btn pp-btn-ghost"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        
<section className="pp-pass" data-role={role} style={{ marginTop: 24 }}>
  <div className="pp-top">
    <div className="pp-identity">
      <h2>Account Security</h2>
      <p>Keep your EventPro account secure.</p>
    </div>
  </div>

  <div className="pp-body">
    {!showPasswordForm ? (
      <button
        type="button"
        className="pp-btn pp-btn-primary"
        onClick={() => {
          setError('');
          setMessage('');
          setShowPasswordForm(true);
        }}
      >
        Change Password
      </button>
    ) : (
      <form
        className="pp-form"
        onSubmit={handlePasswordSubmit}
        noValidate
      >
        <div className="pp-input pp-field-wide">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            name="current_password"
            type="password"
            value={passwordForm.current_password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="pp-input pp-field-wide">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            name="new_password"
            type="password"
            value={passwordForm.new_password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
          <span className="pp-hint">
            Use at least 8 characters.
          </span>
        </div>

        <div className="pp-input pp-field-wide">
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            name="confirm_password"
            type="password"
            value={passwordForm.confirm_password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="pp-actions pp-field-wide">
          <button
            type="submit"
            className="pp-btn pp-btn-primary"
            disabled={passwordSaving}
          >
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>

          <button
            type="button"
            className="pp-btn pp-btn-ghost"
            disabled={passwordSaving}
            onClick={() => {
              setShowPasswordForm(false);
              setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_password: ''
              });
              setError('');
              setMessage('');
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    )}
  </div>
</section>

      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <>
      <style>{STYLES}</style>
      <ProfileContent />
    </>
  );
}