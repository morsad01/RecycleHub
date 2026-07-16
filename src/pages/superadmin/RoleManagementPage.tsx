import { Card } from '../../components/ui/Card';

export function RoleManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Role Matrix</h2>
        <p className="text-sm text-gray-500">Configure granular permissions for each organizational role.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4 w-1/3">Permission</th>
                <th className="px-6 py-4 text-center">Admin</th>
                <th className="px-6 py-4 text-center">Moderator</th>
                <th className="px-6 py-4 text-center">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-4 font-medium">Manage Users</td>
                <td className="px-6 py-4 text-center"><input type="checkbox" checked readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
                <td className="px-6 py-4 text-center"><input type="checkbox" checked readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
                <td className="px-6 py-4 text-center"><input type="checkbox" readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Manage Payments</td>
                <td className="px-6 py-4 text-center"><input type="checkbox" checked readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
                <td className="px-6 py-4 text-center"><input type="checkbox" readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
                <td className="px-6 py-4 text-center"><input type="checkbox" readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">View Orders</td>
                <td className="px-6 py-4 text-center"><input type="checkbox" checked readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
                <td className="px-6 py-4 text-center"><input type="checkbox" checked readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
                <td className="px-6 py-4 text-center"><input type="checkbox" checked readOnly className="w-4 h-4 text-primary-600 rounded" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
