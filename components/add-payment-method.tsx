"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, PlusCircle, RefreshCw } from "lucide-react"
import { addPaymentMethodAction } from "@/app/actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

export function AddPaymentMethod() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardNumber, setCardNumber] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Generate month options
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return { value: month.toString().padStart(2, "0"), label: month.toString().padStart(2, "0") }
  })

  // Generate year options (current year + 20 years)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => {
    const year = currentYear + i
    return { value: year.toString(), label: year.toString() }
  })

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value)
    setCardNumber(formattedValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Basic validation
    if (!cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
      setError("Please enter a valid 16-digit card number")
      setIsSubmitting(false)
      return
    }

    if (!expiryMonth || !expiryYear) {
      setError("Please select expiration date")
      setIsSubmitting(false)
      return
    }

    if (!cvc.match(/^\d{3,4}$/)) {
      setError("Please enter a valid CVC (3 or 4 digits)")
      setIsSubmitting(false)
      return
    }

    if (!cardholderName) {
      setError("Please enter the cardholder name")
      setIsSubmitting(false)
      return
    }

    try {
      console.log("Submitting payment method...")
      // In a real app, you would use a secure payment processor like Stripe
      // and would never send raw card details to your server
      const result = await addPaymentMethodAction({
        // Only send the last 4 digits for display purposes
        last4: cardNumber.replace(/\s/g, "").slice(-4),
        expiryMonth,
        expiryYear,
        cardholderName,
        makeDefault,
      })

      console.log("Payment method result:", result)

      if (result.success) {
        // Show success toast
        toast({
          title: "Payment method added",
          description: "Your card has been added successfully.",
        })

        // Close the dialog
        setOpen(false)

        // Reset form
        setCardNumber("")
        setExpiryMonth("")
        setExpiryYear("")
        setCvc("")
        setCardholderName("")
        setMakeDefault(false)

        // Refresh the page to show the new payment method
        router.refresh()
      } else {
        setError(result.error || "Failed to add payment method")
        toast({
          title: "Error",
          description: result.error || "Failed to add payment method",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding payment method:", error)
      setError("An error occurred while adding your payment method")
      toast({
        title: "Error",
        description: "An error occurred while adding your payment method",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>Enter your credit card information to add a new payment method.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                className="pl-10"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19} // 16 digits + 3 spaces
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Expiration Date</Label>
              <div className="flex gap-2">
                <Select value={expiryMonth} onValueChange={setExpiryMonth} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={expiryYear} onValueChange={setExpiryYear} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              placeholder="John Smith"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="makeDefault"
              checked={makeDefault}
              onCheckedChange={(checked) => setMakeDefault(checked === true)}
            />
            <Label htmlFor="makeDefault" className="text-sm font-normal">
              Make this my default payment method
            </Label>
          </div>

          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Payment Method"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
