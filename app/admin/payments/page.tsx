import { checkAuth } from "@/lib/auth"
import { getAllPendingPayments } from "@/lib/data-service"
import AdminNavigation from "@/components/admin-navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { logoutAction } from "@/app/actions"
import { AdminPaymentVerification } from "@/components/admin-payment-verification"

export default async function AdminPaymentsPage() {
  // Check if user is authenticated
  await checkAuth()

  // Get pending payments for verification
  const pendingPayments = getAllPendingPayments()

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/">Go to Scrubber</Link>
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="destructive">
              Logout
            </Button>
          </form>
        </div>
      </div>

      <AdminNavigation />

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Payment Verification</h2>
        <p className="text-gray-500 mb-6">Verify pending bank transfer payments from users.</p>

        {pendingPayments.length > 0 ? (
          <AdminPaymentVerification payments={pendingPayments} />
        ) : (
          <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
            <h3 className="text-xl font-medium mb-2">No Pending Payments</h3>
            <p className="text-gray-500">There are no pending bank transfer payments to verify at this time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
