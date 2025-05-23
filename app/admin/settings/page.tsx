import { checkAuth } from "@/lib/auth"
import AdminNavigation from "@/components/admin-navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { logoutAction } from "@/app/actions"

export default async function AdminSettings() {
  // Check if user is authenticated
  await checkAuth()

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/">Go to Scrubber</Link>
          </Button>
          <form
            action={async () => {
              "use server"
              const result = await logoutAction()
              if (result.success) {
                return result.redirectTo
              }
            }}
          >
            <Button type="submit" variant="destructive">
              Logout
            </Button>
          </form>
        </div>
      </div>

      <AdminNavigation />

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Settings</h2>
        <p className="text-gray-500 mb-6">Configure system settings and preferences.</p>

        {/* Settings content would go here */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-center text-gray-500 py-8">System settings interface will be displayed here.</p>
        </div>
      </div>
    </div>
  )
}
