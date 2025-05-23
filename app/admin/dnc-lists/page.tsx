import { checkAuth } from "@/lib/auth"
import { getDncListsByType } from "@/lib/data-service"
import AdminNavigation from "@/components/admin-navigation"
import { AdminDncLists } from "@/components/admin-dnc-lists"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { logoutAction, uploadDncListAction, deleteDncListAction } from "@/app/actions"

export default async function AdminDncListsPage() {
  // Check if user is authenticated
  await checkAuth()

  // Get DNC lists
  const lists = getDncListsByType()

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">DNC & TCPA Lists</h1>
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
        <AdminDncLists initialLists={lists} uploadAction={uploadDncListAction} deleteAction={deleteDncListAction} />
      </div>
    </div>
  )
}
