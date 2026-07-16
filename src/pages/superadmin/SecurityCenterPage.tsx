import { Card } from '../../components/ui/Card';

export function SecurityCenterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Security Center</h2>
        <p className="text-sm text-gray-500">Monitor system audit logs and critical security events.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Audit Logs (Database Triggers)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-4 text-gray-500">Just now</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    UPDATE
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">system_settings</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">c8a7b9-123...</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-500">5 mins ago</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    DELETE
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">user_roles</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">a1b2c3-456...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
