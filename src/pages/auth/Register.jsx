import { useState } from "react";
import { registerUser } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await registerUser(form);
      toast.success("Account created!");
      navigate("/login");
    } catch {
      toast.error("Error creating account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-8">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">🎬 BookWhiz</h1>
          <p className="text-sm text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={set("name")}
            className="w-full p-3 rounded-lg bg-zinc-800 text-white border border-white/10 focus:border-red-500 outline-none"
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={set("email")}
            className="w-full p-3 rounded-lg bg-zinc-800 text-white border border-white/10 focus:border-red-500 outline-none"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={set("password")}
              className="w-full p-3 pr-10 rounded-lg bg-zinc-800 text-white border border-white/10 focus:border-red-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-3 text-gray-400"
            >
              👁
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={form.confirm}
              onChange={set("confirm")}
              className="w-full p-3 pr-10 rounded-lg bg-zinc-800 text-white border border-white/10 focus:border-red-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3 text-gray-400"
            >
              👁
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-red-500 hover:bg-red-600 transition text-white font-semibold"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-red-500 cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}