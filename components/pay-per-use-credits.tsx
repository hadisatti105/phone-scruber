"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentMethodSelector } from "@/components/payment-method-selector"
import { BankTransferPayment } from "@/components/bank-transfer-payment"
import { purchaseCreditsAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { User, BankAccount } from "@/lib/types"

export const PAY_PER_USE_PACKAGES = [
  { id: "20k", name: "Basic", credits: 20000, price: 10 },
  { id: "50k", name: "Standard", credits: 50000, price: 22 },
  { id: "100k", name: "Premium", credits: 100000, price: 40 },
  { id: "250k", name: "Enterprise", credits: 250000, price: 90 },
]

interface PayPerUseCreditsProps {
  user: User
  bankAccounts: BankAccount[]
}

export function PayPerUseCredits({ user, bankAccounts }: PayPerUseCreditsProps) {
  const [selectedPackage, setSelectedPackage] = useState(PAY_PER_USE_PACKAGES[0])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card")
  const { toast } = useToast()
  const router = useRouter()

  const handlePurchase = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "No payment method selected",
        description: "Please select a payment method to continue",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const result = await purchaseCreditsAction({
        userId: user.id,
        packageId: selectedPackage.id,
        credits: selectedPackage.credits,
        amount: selectedPackage.price,
        paymentMethodId: selectedPaymentMethod,
      })

      if (result.success) {
        toast({
          title: "Credits purchased",
          description: result.message,
        })
        router.refresh()
      } else {
        toast({
          title: "Purchase failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error purchasing credits:", error)
      toast({
        title: "Purchase failed",
        description: "An error occurred while processing your payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buy Credits</CardTitle>
          <CardDescription>Purchase credits to process your phone number files</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="card"
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as "card" | "bank")}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="card">Credit Card</TabsTrigger>
              <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
            </TabsList>

            <TabsContent value="card">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {PAY_PER_USE_PACKAGES.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`cursor-pointer transition-all ${
                        selectedPackage.id === pkg.id ? "border-primary ring-2 ring-primary ring-opacity-50" : ""
                      }`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <CardDescription>{pkg.credits.toLocaleString()} credits</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${pkg.price}</div>
                        <p className="text-xs text-gray-500 mt-1">
                          ${((pkg.price / pkg.credits) * 10000).toFixed(2)} per 10,000 numbers
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <PaymentMethodSelector
                  user={user}
                  selectedPaymentMethod={selectedPaymentMethod}
                  onSelectPaymentMethod={setSelectedPaymentMethod}
                />

                <div className="flex justify-end">
                  <button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
                    onClick={handlePurchase}
                    disabled={!selectedPaymentMethod || isProcessing}
                  >
                    {isProcessing
                      ? "Processing..."
                      : `Purchase ${selectedPackage.credits.toLocaleString()} Credits for $${selectedPackage.price}`}
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bank">
              <BankTransferPayment user={user} bankAccounts={bankAccounts} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
