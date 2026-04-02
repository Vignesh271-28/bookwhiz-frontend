import { useState, useEffect } from "react";
import { loginUser } from "../../api/authApi";
import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const getDashboardRoute = (roles = []) => {
  const has = (role) =>
    roles.some(r => r === role || r?.name === role || r?.authority === role);
  if (has("SUPER_ADMIN")) return "/superadmin";
  if (has("ADMIN")) return "/admin";
  if (has("MANAGER")) return "/partner";
  return "/dashboard";
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser({ email, password });
      login(res.data.token);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    navigate(getDashboardRoute(user.roles), { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-8">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">🎬 BookWhiz</h1>
          <p className="text-sm text-gray-400">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-800 text-white border border-white/10 focus:border-red-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-red-500 hover:bg-red-600 transition text-white font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-500">NEW HERE?</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Register */}
        <button
          onClick={() => navigate("/register")}
          className="w-full p-3 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-red-400 transition"
        >
          Create Account
        </button>

        {/* Partner */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Theatre owner?{" "}
          <span
            onClick={() => navigate("/partner/register")}
            className="text-red-500 cursor-pointer"
          >
            Apply as Partner ↗
          </span>
        </p>

      </div>
    </div>
  );
}