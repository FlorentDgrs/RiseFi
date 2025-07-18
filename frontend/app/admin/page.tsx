import AdminDashboard from "@/components/shared/AdminDashboard";
import AdminGuard from "@/components/shared/AdminGuard";
import Header from "@/components/shared/Header";

export default function AdminPage() {
  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center">
            <AdminDashboard />
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
