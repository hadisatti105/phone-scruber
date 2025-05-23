"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Building, RefreshCw, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { initiateTransferAction } from "@/app/actions"
import type { User, BankAccount } from "@/lib/types"
import { PAY_PER_USE_PACKAGES } from "@/lib/subscription-plans"

interface BankTransferPaymentProps {
  user: User
  bankAccounts: BankAccount[]
  onClose?: () => void
}

export function BankTransferPayment({ user, bankAccounts = [], onClose }: BankTransferPaymentProps) {
  const [selectedPackage, setSelectedPackage] = useState("20k")
  const [selectedBank, setSelectedBank] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Set default bank if only one is available
  useEffect(() => {
    if (bankAccounts.length === 1) {
      setSelectedBank(bankAccounts[0].id)
    }
  }, [bankAccounts])

  const selectedPkg = PAY_PER_USE_PACKAGES.find((pkg) => pkg.id === selectedPackage)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedBank) {
      setError("Please select a bank")
      setIsSubmitting(false)
      return
    }

    if (!screenshot) {
      setError("Please upload a payment screenshot")
      setIsSubmitting(false)
      return
    }

    if (!selectedPkg) {
      setError("Please select a package")
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("bankId", selectedBank)
      formData.append("packageId", selectedPackage)
      formData.append("amount", selectedPkg.price.toString())
      formData.append("credits", selectedPkg.credits.toString())
      formData.append("referenceNumber", referenceNumber)
      formData.append("screenshot", screenshot)

      const result = await initiateTransferAction(formData)

      if (result.success) {
        toast({
          title: "Payment initiated",
          description: "Your payment is being processed. We'll notify you once it's verified.",
        })
        if (onClose) {
          onClose()
        }
        router.refresh()
      } else {
        setError(result.error || "Failed to process payment")
      }
    } catch (error) {
      console.error("Error initiating bank transfer:", error)
      setError("An error occurred while processing your payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBankDetails = bankAccounts.find((bank) => bank.id === selectedBank)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Transfer Payment</CardTitle>
        <CardDescription>Pay via bank transfer and upload your payment proof</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="package">Select Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger id="package">
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {PAY_PER_USE_PACKAGES.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.credits.toLocaleString()} credits - ${pkg.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Select Bank</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger id="bank">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.bankName} ({bank.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBank && selectedBankDetails && (
              <div className="p-4 border rounded-md bg-gray-50">
                <div className="flex items-center mb-3">
                  <Building className="h-5 w-5 mr-2 text-gray-500" />
                  <h3 className="font-medium">{selectedBankDetails.bankName} Transfer Details</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-gray-500">Account Name:</div>
                    <div className="col-span-2 font-medium">{selectedBankDetails.accountName}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-gray-500">Account Number:</div>
                    <div className="col-span-2 font-medium">{selectedBankDetails.accountNumber}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-gray-500">Routing Number:</div>
                    <div className="col-span-2 font-medium">{selectedBankDetails.routingNumber}</div>
                  </div>
                  {selectedBankDetails.swiftCode && (
                    <div className="grid grid-cols-3 gap-1">
                      <div className="text-gray-500">SWIFT/BIC:</div>
                      <div className="col-span-2 font-medium">{selectedBankDetails.swiftCode}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-gray-500">Amount:</div>
                    <div className="col-span-2 font-medium">
                      {selectedBankDetails.currency} {selectedPkg?.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-gray-500">Reference:</div>
                    <div className="col-span-2 font-medium">PS-{user.id.substring(0, 8)}</div>
                  </div>
                  {selectedBankDetails.bankAddress && (
                    <div className="grid grid-cols-3 gap-1">
                      <div className="text-gray-500">Bank Address:</div>
                      <div className="col-span-2 font-medium">{selectedBankDetails.bankAddress}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reference">Reference/Transaction Number</Label>
              <Input
                id="reference"
                placeholder="Enter your bank reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                This helps us identify your payment. You can find this in your bank statement or receipt.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot">Payment Screenshot</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {screenshot ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <img
                        src={URL.createObjectURL(screenshot) || "/placeholder.svg"}
                        alt="Payment screenshot"
                        className="max-h-40 rounded-md"
                      />
                    </div>
                    <p className="text-sm font-medium">{screenshot.name}</p>
                    <p className="text-xs text-gray-500">{(screenshot.size / 1024).toFixed(2)} KB</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setScreenshot(null)}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <Upload className="h-10 w-10 text-gray-400" />
                    <span className="text-sm font-medium">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-500">PNG, JPG or PDF (max 5MB)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleFileChange}
                      max-size={5 * 1024 * 1024} // 5MB
                    />
                  </label>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Payment"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
