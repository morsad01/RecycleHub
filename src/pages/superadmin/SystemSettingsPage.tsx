import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">System Settings</h2>
        <p className="text-sm text-gray-500">Global configurations for the RecycleHub platform.</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 border-b pb-2">General Settings</h3>
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Maintenance Mode</p>
              <p className="text-sm text-gray-500">Disable marketplace access for buyers and sellers.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">AI Product Recognition</p>
              <p className="text-sm text-gray-500">Enable automatic image tagging during listing creation.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          
          <div className="pt-4">
            <Button>Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
