"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SuppressionListManager } from "@/components/suppression-list-manager"
import { UserScrubber } from "@/components/user-scrubber"
import { UserSubscription } from "@/components/user-subscription"
import { logoutUserAction } from "@/app/actions"
import { useRouter } from "next/navigation"
import type { User, BankAccount, DncList } from "@/lib/types"

interface DashboardViewProps {
  user: User
  bankAccounts: BankAccount[]
  dncLists: DncList[]
  tcpaLists: DncList[]
}

export function DashboardView({ user, bankAccounts = [], dncLists = [], tcpaLists = [] }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState("scrubber")
  const router = useRouter()

  const handleLogout = async () => {
    const result = await logoutUserAction()
    if (result.success) {
      router.push("/")
    }
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user.name}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Credits Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.credits.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">1 credit = 1 number processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Suppression List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.suppressionCount.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Numbers in your list</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Files Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.filesProcessed}</div>
            <p className="text-xs text-gray-500 mt-1">Total files scrubbed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Numbers Removed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.numbersRemoved.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Duplicates & suppressed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scrubber" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="scrubber">Scrub Files</TabsTrigger>
          <TabsTrigger value="suppression">Manage Suppression List</TabsTrigger>
          <TabsTrigger value="subscription">Subscription & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="scrubber">
          <UserScrubber user={user} dncLists={dncLists} tcpaLists={tcpaLists} />
        </TabsContent>

        <TabsContent value="suppression">
          <SuppressionListManager initialList={[]} userId={user.id} />
        </TabsContent>

        <TabsContent value="subscription">
          <UserSubscription user={user} bankAccounts={bankAccounts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
