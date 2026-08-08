import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Input, Select } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { Settings, ShieldAlert, Sparkles, DollarSign } from 'lucide-react';

export function SystemSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [platformName, setPlatformName] = useState('ResellBD');
  const [commissionRate, setCommissionRate] = useState(5);
  const [currency, setCurrency] = useState('BDT');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [aiProductRecognition, setAiProductRecognition] = useState(true); // default local flag

  // Fetch Settings from DB
  async function fetchSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      
      if (data) {
        data.forEach((setting) => {
          switch (setting.key) {
            case 'platform_name':
              setPlatformName(setting.value);
              break;
            case 'commission_rate':
              setCommissionRate(Number(setting.value));
              break;
            case 'currency':
              setCurrency(setting.value);
              break;
            case 'default_language':
              setDefaultLanguage(setting.value);
              break;
            case 'maintenance_mode':
              setMaintenanceMode(setting.value === true || setting.value === 'true');
              break;
          }
        });
      }
    } catch (err: any) {
      toast('Failed to load system settings: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Upsert each setting
      const settingsList = [
        { key: 'platform_name', value: platformName },
        { key: 'commission_rate', value: commissionRate },
        { key: 'currency', value: currency },
        { key: 'default_language', defaultLanguage }, // wait, defaultLanguage: defaultLanguage
        { key: 'maintenance_mode', value: maintenanceMode },
      ];

      for (const item of settingsList) {
        // Fix syntax shorthand if defaultLanguage is used
        const val = item.key === 'default_language' ? defaultLanguage : item.value;
        const { error } = await supabase
          .from('system_settings')
          .upsert({ key: item.key, value: val as any, updated_at: new Date().toISOString() });
        if (error) throw error;
      }
      
      toast('Global Platform Configuration Updated.', 'success');
      fetchSettings();
    } catch (err: any) {
      toast('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="text-red-500" size={20} /> System Configurations
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Configure global marketplace variables, transaction commissions, and engine operations.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* General Platform Config */}
          <Card className="p-6 bg-gray-950 border-gray-800 space-y-4">
            <h3 className="text-xs font-bold text-white tracking-wider font-mono mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
              GENERAL MARKETPLACE VARIABLES
            </h3>
            
            <Input
              label="Platform Name"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="bg-gray-900 border-gray-800 text-white focus:border-red-500/50"
              required
            />
            
            <Input
              label="Default Commission Rate (%)"
              type="number"
              value={commissionRate.toString()}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              className="bg-gray-900 border-gray-800 text-white focus:border-red-500/50"
              icon={<DollarSign size={16} />}
              required
              min="0"
              max="100"
            />
          </Card>

          {/* Regional Localization Settings */}
          <Card className="p-6 bg-gray-950 border-gray-800 space-y-4">
            <h3 className="text-xs font-bold text-white tracking-wider font-mono mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
              LOCALIZATION & STANDARD RULES
            </h3>
            
            <Select
              label="Base Currency Code"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-gray-900 border-gray-800 text-white"
            >
              <option value="BDT">BDT (৳) - Bangladesh Taka</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
            </Select>

            <Select
              label="Default Locale / Language"
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="bg-gray-900 border-gray-800 text-white"
            >
              <option value="bn">Bengali (বাংলা)</option>
              <option value="en">English (US)</option>
            </Select>
          </Card>
        </div>

        {/* Global Security & Mode Controls */}
        <Card className="p-6 bg-gray-950 border-gray-800">
          <h3 className="text-xs font-bold text-white tracking-wider font-mono mb-4 border-b border-gray-800 pb-2">
            CRITICAL PLATFORM OPERATIONS
          </h3>
          <div className="space-y-4 max-w-3xl">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="text-red-500" size={14} /> Global Maintenance Mode
                </p>
                <p className="text-2xs text-gray-500 mt-0.5">Locks all public marketplace transactions and buyer/seller portal listings access.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-950 border border-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-700 after:border-transparent after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            {/* AI Product Tagger Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="text-yellow-500 animate-pulse" size={14} /> AI Product Recognition Engine
                </p>
                <p className="text-2xs text-gray-500 mt-0.5">Enables automatic photo categorization and wear level estimation during upload.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={aiProductRecognition}
                  onChange={(e) => setAiProductRecognition(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-950 border border-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-700 after:border-transparent after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            loading={saving} 
            className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl border border-red-500/20 font-bold"
          >
            Apply Configurations
          </Button>
        </div>
      </form>
    </div>
  );
}
export default SystemSettingsPage;
