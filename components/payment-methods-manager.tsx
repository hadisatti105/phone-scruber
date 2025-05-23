"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddPaymentMethod } from "./add-payment-method"
import { CreditCard, Trash2, CheckCircle2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { removePaymentMethodAction, setDefaultPaymentMethodAction } from "@/app/actions"
import { useRouter } from "next/navigation"
import type { PaymentMethod } from "@/lib/types"

interface PaymentMethodsManagerProps {
  paymentMethods: PaymentMethod[]
}

export function PaymentMethodsManager({ paymentMethods = [] }: PaymentMethodsManagerProps) {
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleRemovePaymentMethod = async () => {
    if (!paymentToDelete) return

    setIsProcessing(true)
    try {
      const result = await removePaymentMethodAction({ paymentMethodId: paymentToDelete })

      if (result.success) {
        toast({
          title: "Payment method removed",
          description: "Your payment method has been removed successfully.",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove payment method",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing payment method:", error)
      toast({
        title: "Error",
        description: "An error occurred while removing your payment method",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setPaymentToDelete(null)
    }
  }

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    setIsProcessing(true)
    try {
      const result = await setDefaultPaymentMethodAction({ paymentMethodId })

      if (result.success) {
        toast({
          title: "Default payment method updated",
          description: "Your default payment method has been updated successfully.",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update default payment method",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting default payment method:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating your default payment method",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your saved payment methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-4 ${method.isDefault ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex justify-between items-center">
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
                  <div className="flex items-center gap-2">
                    {method.isDefault ? (
                      <div className="flex items-center text-xs text-green-500 bg-green-50 px-2 py-1 rounded">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Default
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefaultPaymentMethod(method.id)}
                        disabled={isProcessing}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPaymentToDelete(method.id)}
                      disabled={isProcessing || (method.isDefault && paymentMethods.length > 1)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-gray-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-gray-500">No payment methods added yet</p>
            </div>
          </div>
        )}

        <AddPaymentMethod />
      </CardContent>

      <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePaymentMethod}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isProcessing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
