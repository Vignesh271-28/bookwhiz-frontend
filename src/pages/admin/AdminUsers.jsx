import { useEffect, useState } from "react";
import api from "../../api/axios";
import { deleteUser } from "../../api/superAdminApi";
import { useAuth } from "../../auth/AuthContext";

export default function AdminUsers() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);

  const loadUsers = () =>
    api.get("/admin/users").then(res => setUsers(res.data));

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Users</h2>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Email</th>
              <th>Roles</th>
              {isSuperAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td>{u.roles.map(r => r.name).join(", ")}</td>
                {isSuperAdmin && (
                  <td>
                    <button
                      onClick={() => deleteUser(u.id).then(loadUsers)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}