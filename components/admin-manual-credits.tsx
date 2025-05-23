"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { adjustUserCreditsAction } from "@/app/actions"
import { PlusCircle, MinusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AdminManualCredits() {
  const [userId, setUserId] = useState("")
  const [credits, setCredits] = useState("")
  const [reason, setReason] = useState("")
  const [operation, setOperation] = useState("add")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!userId || !credits || !reason) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await adjustUserCreditsAction({
        userId,
        credits: Number.parseInt(credits),
        operation,
        reason,
      })

      if (result.success) {
        toast({
          title: "Credits adjusted",
          description: result.message,
        })

        // Reset form
        setUserId("")
        setCredits("")
        setReason("")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to adjust credits",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adjusting credits:", error)
      toast({
        title: "Error",
        description: "An error occurred while adjusting credits",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Credit Adjustment</CardTitle>
        <CardDescription>Add or remove credits from a user account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Credits</Label>
            <Input
              id="credits"
              type="number"
              min="1"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="Enter number of credits"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Operation</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={operation === "add" ? "default" : "outline"}
                className={operation === "add" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setOperation("add")}
              >
                <PlusCircle className="h-4 w-4 mr-1" /> Add Credits
              </Button>
              <Button
                type="button"
                variant={operation === "subtract" ? "default" : "outline"}
                className={operation === "subtract" ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => setOperation("subtract")}
              >
                <MinusCircle className="h-4 w-4 mr-1" /> Remove Credits
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adjustment"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              "Submit Adjustment"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
