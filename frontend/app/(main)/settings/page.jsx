"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Save } from "lucide-react";
import { useAuthContext } from "../../../context/AuthContext";
import { useApp } from "../../../context/AppContext";
import LoadingButton from "../../../components/ui/LoadingButton.jsx";
import { updateNotificationPreferences } from "../../../services/authService.js";

const PREFERENCE_SECTIONS = [
  {
    key: "inApp",
    title: "In-App Notifications",
    description: "Control which events show up inside the app.",
    icon: Bell,
  },
  {
    key: "email",
    title: "Email Notifications",
    description: "Choose which events are allowed to trigger an email.",
    icon: Mail,
  },
];

const PREFERENCE_FIELDS = [
  {
    key: "followers",
    label: "Followers",
    description: "When someone follows you",
  },
  {
    key: "comments",
    label: "Comments",
    description: "When someone comments on your video",
  },
  {
    key: "likes",
    label: "Likes",
    description: "When someone likes your video",
  },
  {
    key: "tips",
    label: "Tips",
    description: "When someone sends you a tip",
  },
];

const createDefaultPreferences = () => ({
  inApp: {
    followers: true,
    comments: true,
    likes: true,
    tips: true,
  },
  email: {
    followers: true,
    comments: true,
    likes: true,
    tips: true,
  },
});

const normalizePreferences = (preferences) => {
  const defaults = createDefaultPreferences();

  return {
    inApp: {
      ...defaults.inApp,
      ...(preferences?.inApp ?? {}),
    },
    email: {
      ...defaults.email,
      ...(preferences?.email ?? {}),
    },
  };
};

export default function SettingsPage() {
  const { user, refetchUser } = useAuthContext();
  const { showError } = useApp();
  const [preferences, setPreferences] = useState(createDefaultPreferences);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    setPreferences(normalizePreferences(user?.notificationPreferences));
  }, [user?.notificationPreferences]);

  const handleToggle = (section, field) => {
    setSavedMessage("");
    setPreferences((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: !current[section][field],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage("");

    try {
      await updateNotificationPreferences(preferences);
      await refetchUser();
      setSavedMessage("Notification preferences updated.");
    } catch (error) {
      showError(error.message || "Failed to update notification preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
      
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Username</label>
              <p className="text-white">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Role</label>
              <p className="text-white capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Notification Preferences</h2>
              <p className="text-sm text-gray-400">
                Choose which events should appear in-app and which ones are allowed to send email.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedMessage ? (
                <p className="text-sm text-emerald-300">{savedMessage}</p>
              ) : null}
              <LoadingButton
                loading={saving}
                onClick={handleSave}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-500 hover:to-pink-500"
              >
                <span className="inline-flex items-center gap-2">
                  <Save size={16} />
                  Save Preferences
                </span>
              </LoadingButton>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {PREFERENCE_SECTIONS.map((section) => {
              const Icon = section.icon;

              return (
                <section
                  key={section.key}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{section.title}</h3>
                      <p className="mt-1 text-sm text-gray-400">{section.description}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {PREFERENCE_FIELDS.map((field) => {
                      const checked = Boolean(preferences[section.key][field.key]);

                      return (
                        <label
                          key={`${section.key}-${field.key}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{field.label}</p>
                            <p className="text-xs text-gray-400">{field.description}</p>
                          </div>

                          <button
                            type="button"
                            aria-pressed={checked}
                            aria-label={`${checked ? "Disable" : "Enable"} ${field.label} ${section.title}`}
                            onClick={() => handleToggle(section.key, field.key)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                              checked ? "bg-purple-500" : "bg-white/15"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                checked ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
