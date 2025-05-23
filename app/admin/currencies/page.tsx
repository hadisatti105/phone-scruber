import { checkAuth } from "@/lib/auth"
import { getAllCurrencies } from "@/lib/data-service"
import AdminNavigation from "@/components/admin-navigation"
import { AdminCurrencies } from "@/components/admin-currencies"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { logoutAction, updateCurrencyAction, deleteCurrencyAction } from "@/app/actions"

export default async function AdminCurrenciesPage() {
  // Check if user is authenticated
  await checkAuth()

  // Get currencies
  const currencies = getAllCurrencies()

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Currency Management</h1>
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
        <AdminCurrencies
          initialCurrencies={currencies}
          updateAction={updateCurrencyAction}
          deleteAction={deleteCurrencyAction}
        />
      </div>
    </div>
  )
}
