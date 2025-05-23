"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Building } from "lucide-react"
import { BankTransferPayment } from "./bank-transfer-payment"
import { AddPaymentMethod } from "./add-payment-method"
import type { User } from "@/lib/types"

interface PaymentMethodSelectorProps {
  user: User
  onSelectPaymentMethod?: (id: string) => void
  onClose?: () => void
}

export function PaymentMethodSelector({ user, onSelectPaymentMethod, onClose }: PaymentMethodSelectorProps) {
  const [activeTab, setActiveTab] = useState<"card" | "bank">("card")

  return (
    <Tabs defaultValue="card" value={activeTab} onValueChange={(value) => setActiveTab(value as "card" | "bank")}>
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="card" className="flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Credit Card
        </TabsTrigger>
        <TabsTrigger value="bank" className="flex items-center">
          <Building className="h-4 w-4 mr-2" />
          Bank Transfer
        </TabsTrigger>
      </TabsList>

      <TabsContent value="card">
        {user.paymentMethods && user.paymentMethods.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {user.paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`cursor-pointer hover:border-primary ${method.isDefault ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => onSelectPaymentMethod && onSelectPaymentMethod(method.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded mr-3">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• {method.last4}</p>
                        <p className="text-xs text-gray-500">
                          Expires {method.expiryMonth}/{method.expiryYear.slice(-2)} • {method.cardholderName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <AddPaymentMethod />
          </div>
        ) : (
          <AddPaymentMethod />
        )}
      </TabsContent>

      <TabsContent value="bank">
        <BankTransferPayment user={user} onClose={onClose} />
      </TabsContent>
    </Tabs>
  )
}
