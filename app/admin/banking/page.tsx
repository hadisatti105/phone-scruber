import { checkAuth } from "@/lib/auth"
import { getAllBankAccounts, getAllCurrencies } from "@/lib/data-service"
import AdminNavigation from "@/components/admin-navigation"
import { AdminBankingInfo } from "@/components/admin-banking-info"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { logoutAction, updateBankingInfoAction, deleteBankInfoAction } from "@/app/actions"

export default async function AdminBankingPage() {
  // Check if user is authenticated
  await checkAuth()

  // Get bank accounts and currencies
  const bankAccounts = getAllBankAccounts()
  const currencies = getAllCurrencies()

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Banking Information</h1>
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
        <AdminBankingInfo
          initialBankAccounts={bankAccounts}
          currencies={currencies}
          updateAction={updateBankingInfoAction}
          deleteAction={deleteBankInfoAction}
        />
      </div>
    </div>
  )
}
