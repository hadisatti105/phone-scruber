"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getSubscriptionPlan } from "@/lib/subscription-plans"
import type { User } from "@/lib/types"
import { cancelSubscriptionAction } from "@/app/actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Calendar, CheckCircle, CreditCard, RefreshCw } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"

interface CurrentSubscriptionProps {
  user: User
}

export function CurrentSubscription({ user }: CurrentSubscriptionProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // If user has no subscription, don't render this component
  if (!user.subscription) {
    return null
  }

  const subscription = user.subscription
  const plan = getSubscriptionPlan(subscription.planId)

  if (!plan) {
    return null
  }

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  const handleCancelSubscription = async () => {
    setIsProcessing(true)
    try {
      const result = await cancelSubscriptionAction()

      if (result.success) {
        toast({
          title: "Subscription canceled",
          description: result.message,
        })
        setShowCancelDialog(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel subscription",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      toast({
        title: "Error",
        description: "An error occurred while canceling your subscription",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate credits usage percentage
  const creditsUsedPercentage = Math.min(
    100,
    Math.round((subscription.creditsUsedThisPeriod / subscription.monthlyCredits) * 100),
  )

  // Calculate days left in billing period
  const currentPeriodEnd = new Date(subscription.currentPeriodEnd)
  const today = new Date()
  const daysLeft = Math.ceil((currentPeriodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Manage your current subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-4 border rounded-lg bg-primary/5">
            <div>
              <h3 className="text-xl font-bold">{plan.name} Plan</h3>
              <p className="text-sm text-gray-500">{plan.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${plan.price}
                <span className="text-sm text-gray-500">/{plan.interval}</span>
              </div>
              <div
                className={`text-sm ${
                  subscription.cancelAtPeriodEnd ? "text-amber-600" : "text-green-600"
                } flex items-center justify-end`}
              >
                {subscription.cancelAtPeriodEnd ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Cancels on {formatDate(subscription.currentPeriodEnd)}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <CreditCard className="h-5 w-5 mr-2 text-gray-500" />
                <h3 className="font-medium">Billing Period</h3>
              </div>
              <p className="text-sm text-gray-500">
                Current period: {formatDate(subscription.currentPeriodStart)} to{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </p>
              <p className="text-sm font-medium mt-1">{daysLeft} days left in billing period</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                <h3 className="font-medium">Next Billing Date</h3>
              </div>
              {subscription.cancelAtPeriodEnd ? (
                <p className="text-sm text-amber-600">
                  Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Your next billing date is{" "}
                  <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Credits Usage</h3>
              <span className="text-sm font-medium">
                {subscription.creditsUsedThisPeriod.toLocaleString()} / {subscription.monthlyCredits.toLocaleString()}
              </span>
            </div>
            <Progress value={creditsUsedPercentage} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">
              {subscription.monthlyCredits - subscription.creditsUsedThisPeriod > 0
                ? `${(subscription.monthlyCredits - subscription.creditsUsedThisPeriod).toLocaleString()} credits remaining this month`
                : "You've used all your credits for this month"}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          {!subscription.cancelAtPeriodEnd && (
            <Button variant="outline" className="w-full text-red-500" onClick={() => setShowCancelDialog(true)}>
              Cancel Subscription
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access to your subscription
              benefits until the end of your current billing period on {formatDate(subscription.currentPeriodEnd)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes, Cancel Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
