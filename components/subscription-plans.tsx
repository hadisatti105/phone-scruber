"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, CreditCard, RefreshCw } from "lucide-react"
import { getMonthlyPlans, getYearlyPlans, getFreePlan } from "@/lib/subscription-plans"
import type { User, SubscriptionPlan } from "@/lib/types"
import { subscribeAction } from "@/app/actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SubscriptionPlansProps {
  user: User
}

export function SubscriptionPlans({ user }: SubscriptionPlansProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Get plans based on billing interval
  const plans = billingInterval === "monthly" ? getMonthlyPlans() : getYearlyPlans()
  const freePlan = getFreePlan()

  // Find default payment method
  useState(() => {
    if (user.paymentMethods && user.paymentMethods.length > 0) {
      const defaultMethod = user.paymentMethods.find((method) => method.isDefault)
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id)
      } else {
        setSelectedPaymentMethod(user.paymentMethods[0].id)
      }
    }
  })

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // Free plan doesn't require payment method
    if (plan.price > 0 && !selectedPaymentMethod) {
      toast({
        title: "No payment method",
        description: "Please add a payment method before subscribing",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await subscribeAction({
        planId: plan.id,
        paymentMethodId: selectedPaymentMethod || "",
      })

      if (result.success) {
        toast({
          title: "Subscription successful",
          description: `You've successfully subscribed to the ${plan.name} plan`,
        })
        router.refresh()
      } else {
        toast({
          title: "Subscription failed",
          description: result.error || "Failed to subscribe to plan",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error)
      toast({
        title: "Subscription failed",
        description: "An error occurred while processing your subscription",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Get selected payment method details
  const getSelectedPaymentMethodDetails = () => {
    if (!selectedPaymentMethod || !user.paymentMethods) return null
    return user.paymentMethods.find((method) => method.id === selectedPaymentMethod)
  }

  const selectedPaymentMethodDetails = getSelectedPaymentMethodDetails()

  // Check if user is already subscribed to a plan
  const isSubscribed = user.subscription && user.subscription.status === "active"
  const currentPlanId = user.subscription?.planId

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plans</CardTitle>
        <CardDescription>Choose a subscription plan that works for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="monthly" onValueChange={(value) => setBillingInterval(value as "monthly" | "yearly")}>
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly (Save 17%)</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="monthly" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <Card className={`${currentPlanId === "free" ? "border-primary" : ""}`}>
                <CardHeader>
                  <CardTitle>{freePlan.name}</CardTitle>
                  <CardDescription>{freePlan.description}</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${freePlan.price}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {freePlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={currentPlanId === "free" ? "outline" : "default"}
                    disabled={isProcessing || currentPlanId === "free"}
                    onClick={() => handleSubscribe(freePlan)}
                  >
                    {currentPlanId === "free" ? "Current Plan" : "Subscribe"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Paid Plans */}
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`${plan.popular ? "border-primary" : ""} ${
                    currentPlanId === plan.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <CardHeader>
                    {plan.popular && (
                      <div className="py-1 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium inline-block mb-2">
                        MOST POPULAR
                      </div>
                    )}
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-sm text-gray-500">/{billingInterval}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={currentPlanId === plan.id ? "outline" : "default"}
                      disabled={isProcessing || currentPlanId === plan.id}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : currentPlanId === plan.id ? (
                        "Current Plan"
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <Card className={`${currentPlanId === "free" ? "border-primary" : ""}`}>
                <CardHeader>
                  <CardTitle>{freePlan.name}</CardTitle>
                  <CardDescription>{freePlan.description}</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${freePlan.price}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {freePlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={currentPlanId === "free" ? "outline" : "default"}
                    disabled={isProcessing || currentPlanId === "free"}
                    onClick={() => handleSubscribe(freePlan)}
                  >
                    {currentPlanId === "free" ? "Current Plan" : "Subscribe"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Yearly Plans */}
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`${plan.popular ? "border-primary" : ""} ${
                    currentPlanId === plan.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <CardHeader>
                    {plan.popular && (
                      <div className="py-1 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium inline-block mb-2">
                        MOST POPULAR
                      </div>
                    )}
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-sm text-gray-500">/{billingInterval}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={currentPlanId === plan.id ? "outline" : "default"}
                      disabled={isProcessing || currentPlanId === plan.id}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : currentPlanId === plan.id ? (
                        "Current Plan"
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Method Selection */}
        {user.paymentMethods && user.paymentMethods.length > 0 && (
          <div className="space-y-4 mt-8 border-t pt-6">
            <h3 className="text-lg font-medium">Payment Method</h3>
            <div className="space-y-2">
              <Select value={selectedPaymentMethod || undefined} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select a payment method" />
                </SelectTrigger>
                <SelectContent>
                  {user.paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      •••• {method.last4} {method.isDefault ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPaymentMethodDetails && (
                <div className="border rounded-lg p-3 bg-gray-50 mt-2">
                  <div className="flex items-center">
                    <div className="bg-white p-2 rounded mr-3">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• {selectedPaymentMethodDetails.last4}</p>
                      <p className="text-xs text-gray-500">
                        Expires {selectedPaymentMethodDetails.expiryMonth}/
                        {selectedPaymentMethodDetails.expiryYear.slice(-2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
