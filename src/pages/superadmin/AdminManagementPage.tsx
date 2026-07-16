import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserPlus, Shield, MoreVertical } from 'lucide-react';

export function AdminManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Admin Management</h2>
          <p className="text-sm text-gray-500">Manage administrative accounts and audit access.</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus size={18} /> Invite Admin
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Roles</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">John Doe</div>
                  <div className="text-gray-500">john@example.com</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Shield size={12} /> Admin
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">2 mins ago</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm">
                    <MoreVertical size={18} />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
