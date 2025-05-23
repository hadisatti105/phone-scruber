"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSubscriptionsAction } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Calendar } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const result = await getSubscriptionsAction()
        if (result.success) {
          setSubscriptions(result.subscriptions)
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [])

  const filteredSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.planName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const getStatusBadge = (subscription) => {
    if (subscription.status === "active") {
      if (subscription.cancelAtPeriodEnd) {
        return <Badge variant="warning">Canceling</Badge>
      }
      return <Badge variant="success">Active</Badge>
    }
    return <Badge variant="destructive">Canceled</Badge>
  }

  const calculateUsagePercentage = (subscription) => {
    return Math.min(100, Math.round((subscription.creditsUsedThisPeriod / subscription.monthlyCredits) * 100))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>View all active and canceled subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading subscriptions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>View all active and canceled subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search subscriptions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No subscriptions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubscriptions.map((subscription) => (
              <div key={subscription.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{subscription.planName}</h3>
                      {getStatusBadge(subscription)}
                    </div>
                    <p className="text-sm text-muted-foreground">User ID: {subscription.userId}</p>
                    <p className="text-sm text-muted-foreground">
                      ${subscription.price}/{subscription.interval} • {subscription.monthlyCredits.toLocaleString()}{" "}
                      credits
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Current period: {formatDate(subscription.currentPeriodStart)} to{" "}
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Credits Usage</span>
                      <span>
                        {subscription.creditsUsedThisPeriod.toLocaleString()} /{" "}
                        {subscription.monthlyCredits.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={calculateUsagePercentage(subscription)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
