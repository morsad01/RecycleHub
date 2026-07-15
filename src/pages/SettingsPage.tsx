import { useI18n } from '../i18n/I18nContext';
import { Settings, Shield, Bell, Key, Globe, LogIn } from 'lucide-react';

export function SettingsPage() {
  const { t, lang, setLang } = useI18n();

  return (
    <main className="min-h-screen pt-24 pb-20 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{t('settings.title') || 'Account Settings'}</h1>
          <p className="text-neutral-600 mt-2">Manage your account preferences and security settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Sidebar Nav */}
          <div className="md:col-span-1 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary-50 text-primary-700 font-bold rounded-xl text-left">
              <Globe size={18} /> {t('settings.preferences') || 'Preferences'}
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-600 hover:bg-neutral-100 font-medium rounded-xl text-left transition-colors">
              <Shield size={18} /> {t('settings.security') || 'Security'}
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-600 hover:bg-neutral-100 font-medium rounded-xl text-left transition-colors">
              <Bell size={18} /> {t('settings.notifications') || 'Notifications'}
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Language Settings */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Globe size={20} className="text-primary-600" />
                {t('settings.language') || 'Language'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLang('en')}
                  className={`p-4 border rounded-xl font-bold text-center transition-all ${
                    lang === 'en' ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang('bn')}
                  className={`p-4 border rounded-xl font-bold text-center transition-all ${
                    lang === 'bn' ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  বাংলা (Bengali)
                </button>
              </div>
            </div>

            {/* Security Settings Overview */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-primary-600" />
                {t('settings.security') || 'Security'}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <Key size={20} className="text-neutral-500" />
                    <div>
                      <h4 className="font-bold text-neutral-900">{t('settings.twoFactor') || 'Two-Factor Authentication'}</h4>
                      <p className="text-sm text-neutral-500">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-lg text-sm font-bold transition-colors">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <LogIn size={20} className="text-neutral-500" />
                    <div>
                      <h4 className="font-bold text-neutral-900">{t('settings.loginHistory') || 'Login History'}</h4>
                      <p className="text-sm text-neutral-500">View your recent login activity.</p>
                    </div>
                  </div>
                  <button className="text-primary-600 font-bold text-sm hover:text-primary-700">
                    View
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </main>
  );
}
