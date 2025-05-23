"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { BankTransferPayment } from "@/lib/types"
import { verifyBankTransferAction } from "@/app/actions"
import Image from "next/image"
import { Check, X, Eye } from "lucide-react"

interface AdminPaymentVerificationProps {
  payments: BankTransferPayment[]
}

export function AdminPaymentVerification({ payments = [] }: AdminPaymentVerificationProps) {
  const { toast } = useToast()
  const [selectedPayment, setSelectedPayment] = useState<BankTransferPayment | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [localPayments, setLocalPayments] = useState<BankTransferPayment[]>(payments)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async (payment: BankTransferPayment) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("paymentId", payment.id)
      formData.append("action", "approve")

      const result = await verifyBankTransferAction(formData)

      if (result.success) {
        // Update the local state
        setLocalPayments(localPayments.filter((p) => p.id !== payment.id))

        toast({
          title: "Payment Approved",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error approving payment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedPayment) return

    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("paymentId", selectedPayment.id)
      formData.append("action", "reject")
      formData.append("rejectionReason", rejectionReason)

      const result = await verifyBankTransferAction(formData)

      if (result.success) {
        // Update the local state
        setLocalPayments(localPayments.filter((p) => p.id !== selectedPayment.id))

        toast({
          title: "Payment Rejected",
          description: result.message,
        })

        setSelectedPayment(null)
        setRejectionReason("")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error rejecting payment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (localPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pending Payments</CardTitle>
          <CardDescription>All payments have been processed.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {localPayments.map((payment) => (
        <Card key={payment.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Payment #{payment.id}</CardTitle>
                <CardDescription>
                  {new Date(payment.date).toLocaleDateString()} - ${payment.amount.toFixed(2)} {payment.currency}
                </CardDescription>
              </div>
              <Badge
                variant={
                  payment.status === "pending" ? "outline" : payment.status === "completed" ? "success" : "destructive"
                }
              >
                {payment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1">User Information</h3>
                <p className="text-sm">User ID: {payment.userId}</p>
                <p className="text-sm">Credits: {payment.credits.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Payment Details</h3>
                <p className="text-sm">Bank: {payment.bankName}</p>
                <p className="text-sm">Reference: {payment.referenceNumber}</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-1">Receipt</h3>
              <div className="border rounded-md overflow-hidden">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center py-8">
                      <Eye className="h-5 w-5 mr-2" />
                      View Receipt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Payment Receipt</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <div className="aspect-video relative rounded-lg overflow-hidden border">
                        <Image
                          src="/bank-transfer-receipt.png"
                          alt="Bank transfer receipt"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium">Amount:</div>
                          <div className="text-sm">${payment.amount.toFixed(2)}</div>
                          <div className="text-sm font-medium">Reference:</div>
                          <div className="text-sm">{payment.referenceNumber}</div>
                          <div className="text-sm font-medium">Date:</div>
                          <div className="text-sm">{new Date(payment.date).toLocaleDateString()}</div>
                          <div className="text-sm font-medium">Credits:</div>
                          <div className="text-sm">{payment.credits.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
          <div className="px-6 pb-6 flex justify-end space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setSelectedPayment(payment)} disabled={isProcessing}>
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Payment</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this payment. This will be visible to the user.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Reason for rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPayment(null)
                      setRejectionReason("")
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Reject Payment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={() => handleApprove(payment)} disabled={isProcessing}>
              <Check className="h-4 w-4 mr-1" /> {isProcessing ? "Processing..." : "Approve"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
