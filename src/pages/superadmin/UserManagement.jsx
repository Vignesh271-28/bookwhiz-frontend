import { deleteUser } from "../../api/superAdminApi";

export default function UserManagement({ users, refresh }) {
  const handleDelete = async (id) => {
    await deleteUser(id);
    refresh();
  };

  return (
    <div>
      <h2>User Management</h2>

      {users.map(u => (
        <div key={u.id}>
          <span>{u.email}</span>
          <button onClick={() => handleDelete(u.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}