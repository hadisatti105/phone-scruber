import { redirect } from "next/navigation"
import { getUserFromCookieWithData } from "@/lib/data-service"
import { DashboardView } from "@/components/dashboard-view"
import { getActiveBankAccounts, getActiveDncLists } from "@/lib/data-service"

export default async function DashboardPage() {
  // Check if user is authenticated
  const user = await getUserFromCookieWithData()

  if (!user) {
    redirect("/login")
  }

  // Get active bank accounts for bank transfers
  const bankAccounts = getActiveBankAccounts() || []

  // Get active DNC and TCPA lists
  const dncLists = getActiveDncLists().filter((list) => list.type === "dnc") || []
  const tcpaLists = getActiveDncLists().filter((list) => list.type === "tcpa") || []

  return <DashboardView user={user} bankAccounts={bankAccounts} dncLists={dncLists} tcpaLists={tcpaLists} />
}
