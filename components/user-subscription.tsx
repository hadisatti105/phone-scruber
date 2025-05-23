"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubscriptionPlans } from "@/components/subscription-plans"
import { CurrentSubscription } from "@/components/current-subscription"
import { PaymentMethodsManager } from "@/components/payment-methods-manager"
import { PayPerUseCredits } from "@/components/pay-per-use-credits"
import { PendingPayments } from "@/components/pending-payments"
import type { User, BankAccount } from "@/lib/types"

interface UserSubscriptionProps {
  user: User
  bankAccounts: BankAccount[]
}

export function UserSubscription({ user, bankAccounts = [] }: UserSubscriptionProps) {
  const [activeTab, setActiveTab] = useState("subscription")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subscription" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="credits">Buy Credits</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="pending-payments">Pending Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6 mt-6">
          <CurrentSubscription user={user} />
          <SubscriptionPlans user={user} />
        </TabsContent>

        <TabsContent value="credits" className="space-y-6 mt-6">
          <PayPerUseCredits user={user} bankAccounts={bankAccounts} />
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethodsManager paymentMethods={user.paymentMethods || []} />
        </TabsContent>

        <TabsContent value="pending-payments" className="mt-6">
          <PendingPayments pendingPayments={user.pendingPayments || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
