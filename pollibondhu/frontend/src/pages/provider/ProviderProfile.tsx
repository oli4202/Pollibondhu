import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  CheckCircle,
  FileText,
  Lock,
  MapPin,
  Settings,
  User,
  Plus,
  Save,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/feedback/ToastProvider";
import api from "@/utils/api";

const tabs = [
  { id: "personal", label: "Personal info", icon: User },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];
export default function ProfilePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState("personal");
  const [alerts, setAlerts] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    district: "",
    upazila: "",
    nid: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        email: user.email || "",
        district: user.district || "",
        upazila: user.upazila || "",
        nid: user.nid || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (tab !== "activity") return;
    const load = () =>
      api
        .get("/users/activity")
        .then((res) => setActivities(res.data.data || []))
        .catch(() => undefined);
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [tab]);
  const completion =
    [user?.full_name, user?.email, user?.phone, user?.district].filter(Boolean)
      .length * 25;

  const [uploading, setUploading] = useState(false);

  const processFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return addToast("File too large (max 5MB)", "error");

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("entity_type", "avatars");

    try {
      const res = await api.post("/upload", form);
      const avatar_url = res.data.data.file_url;
      await api.put("/users/profile", { avatar_url });
      addToast("Profile photo updated!", "success");
      window.location.reload();
    } catch (err) {
      addToast("Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0] || null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    processFile(e.dataTransfer.files?.[0] || null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      processFile(file);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.full_name.trim()) errs.full_name = "Business / Full Name is required";
    else if (formData.full_name.length < 3) errs.full_name = "Must be at least 3 characters";

    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^01[3-9]\d{8}$/.test(formData.phone)) errs.phone = "Invalid Bangladesh mobile number";

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Invalid email format";

    if (formData.nid && !/^(\d{10}|\d{17})$/.test(formData.nid)) errs.nid = "NID must be 10 or 17 digits";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return addToast("Please fix the validation errors", "error");
    try {
      await api.put("/users/profile", formData);
      addToast("Profile changes saved", "success");
      setEditing(false);
      window.location.reload(); // Reload to update auth context
    } catch (err: any) {
      addToast(
        err.response?.data?.message || "Failed to update profile",
        "error",
      );
    }
  };

  const handleMagicFill = () => {
    setFormData({
      full_name: "Karim Agriculture & Seeds Ltd.",
      phone: "017" + Math.floor(10000000 + Math.random() * 90000000).toString(),
      email: "contact.karim" + Math.floor(Math.random() * 100) + "@example.com",
      district: "Rajshahi",
      upazila: "Puthia",
      nid: (Math.floor(1000000000 + Math.random() * 9000000000)).toString(),
    });
    addToast("Form auto-filled with mock data!", "success");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-earth-900">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 to-green-600 p-6 text-white shadow-sm">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <label
              tabIndex={0}
              className={`relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border-2 border-white/30 bg-emerald-100 text-xl font-bold text-emerald-700 cursor-pointer transition-all hover:scale-105 focus:ring-2 focus:ring-emerald-500 focus:outline-none ${uploading ? 'opacity-50' : ''}`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
              onPaste={handlePaste}
              title="Drag & Drop, Paste, or Click to change picture"
            >
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
              {user?.avatar_url ? (
                <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'}${user.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user?.full_name?.slice(0, 1) || "P"
              )}
            </label>
            <div>
              <h1 className="text-2xl font-bold">
                {user?.full_name || "Service Provider (e.g. Karim Agro)"}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-emerald-100">
                <MapPin size={14} /> {user?.district || "Bangladesh"}
              </p>
              <p className="mt-1 text-xs text-emerald-200">
                Verified Provider · Joined 2026
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-white/20 bg-emerald-800/30 px-5 py-3 text-center">
            <b className="text-xl">{completion}%</b>
            <p className="text-xs text-emerald-100">Profile complete</p>
          </div>
        </div>
      </section>
      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="flex shrink-0 gap-1 overflow-auto rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm md:block md:w-56">
          <div className="flex gap-1 md:block">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex min-w-max items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold md:mb-1 md:w-full ${tab === id ? "bg-emerald-700 text-white" : "text-earth-500 hover:bg-emerald-50"}`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          {tab === "personal" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Provider Information</h2>
                <div className="flex items-center gap-3">
                  {editing && (
                    <button
                      onClick={handleMagicFill}
                      className="flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                    >
                      ✨ Magic Fill
                    </button>
                  )}
                  <button
                    onClick={() => (editing ? handleSave() : setEditing(true))}
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    {editing ? (
                      <span className="flex items-center gap-1">
                        <Save size={14} /> Save
                      </span>
                    ) : (
                      "Edit details"
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {[
                  { label: "Business Name / Full Name", field: "full_name", value: formData.full_name || "—", type: "text" },
                  { label: "Phone number", field: "phone", value: formData.phone || "Add phone number", type: "tel" },
                  { label: "Email", field: "email", value: formData.email || "—", type: "email" },
                  { label: "National ID (10 or 17 digits)", field: "nid", value: formData.nid || "—", type: "text" },
                  { label: "District", field: "district", value: formData.district || "Add district", type: "select" },
                  { label: "Upazila / Local Area", field: "upazila", value: formData.upazila || "—", type: "text" },
                ].map(({ label, field, value, type }) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-xs font-medium text-earth-500">{label}</label>
                    {editing ? (
                      type === "select" && field === "district" ? (
                        <select
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          className="mt-2 w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Select district</option>
                          {['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={type}
                          value={formData[field as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                          className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-earth-200'}`}
                        />
                      )
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-earth-900">
                        {value}
                        {field === "nid" && formData.nid && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                            <CheckCircle size={10} /> Verified
                          </span>
                        )}
                      </p>
                    )}
                    {editing && errors[field] && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors[field]}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <b className="text-sm">Complete your provider profile</b>
                <p className="mt-1 text-xs text-earth-500">
                  Add banking details to receive payments for your services.
                </p>
                <button
                  onClick={() =>
                    addToast(
                      "Bank information form will be available in your next profile update.",
                    )
                  }
                  className="mt-3 flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-700"
                >
                  <Plus size={14} /> Add bank information
                </button>
              </div>
            </>
          )}
          {tab === "documents" && (
            <>
              <h2 className="text-lg font-bold">My documents</h2>
              <p className="mt-1 text-sm text-earth-500">
                Keep these documents available for faster applications.
              </p>
              <div className="mt-6 divide-y rounded-xl border border-earth-100">
                {[
                  ["National ID", "Verified", "2026"],
                  ["Birth certificate", "Uploaded", "2026"],
                  ["Farmer card", "Add document", "—"],
                  ["Land ownership record", "Add document", "—"],
                ].map(([name, status, date]) => (
                  <div
                    className="flex items-center justify-between p-4"
                    key={name}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                        <FileText size={18} />
                      </span>
                      <div>
                        <b className="text-sm">{name}</b>
                        <p className="text-xs text-earth-400">
                          {status} · {date}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        addToast(
                          `${name}: document upload is ready for backend storage integration.`,
                        )
                      }
                      className="text-xs font-bold text-emerald-700"
                    >
                      {status === "Add document" ? "Upload" : "View"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "activity" && (
            <>
              <h2 className="text-lg font-bold">Activity history</h2>
              <div className="mt-6 space-y-4 border-l border-emerald-200 pl-5">
                {activities.length === 0 ? (
                  <p className="text-sm text-earth-400">
                    No activity history yet.
                  </p>
                ) : (
                  activities.map((activity: any) => (
                    <div className="relative" key={activity.activity_id}>
                      <i className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-emerald-500" />
                      <b className="text-sm">{activity.action}</b>
                      <p className="mt-1 text-xs text-earth-400">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          {tab === "settings" && (
            <>
              <h2 className="text-lg font-bold">Settings</h2>
              <div className="mt-6 space-y-4">
                <label className="flex items-center justify-between rounded-xl border border-earth-100 p-4">
                  <span>
                    <b className="text-sm">Notifications</b>
                    <p className="mt-1 text-xs text-earth-400">
                      Weather, application and community updates
                    </p>
                  </span>
                  <input
                    type="checkbox"
                    checked={alerts}
                    onChange={(e) => {
                      setAlerts(e.target.checked);
                      addToast(
                        e.target.checked
                          ? "Notifications enabled"
                          : "Notifications disabled",
                      );
                    }}
                    className="h-5 w-5 accent-emerald-600"
                  />
                </label>
                <button
                  onClick={() =>
                    addToast(
                      "Password reset support will contact you by email.",
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-earth-100 p-4 text-left"
                >
                  <Lock size={18} className="text-violet-600" />
                  <span>
                    <b className="text-sm">Security</b>
                    <p className="mt-1 text-xs text-earth-400">
                      Request a password reset
                    </p>
                  </span>
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
