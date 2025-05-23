"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { getAdminStatsAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

export function AdminDashboardStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    totalCreditsIssued: 0,
    totalFilesProcessed: 0,
    totalNumbersProcessed: 0,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const result = await getAdminStatsAction()

        if (result.success) {
          setStats(result.stats)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load dashboard statistics",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error)
        toast({
          title: "Error",
          description: "An error occurred while loading dashboard statistics",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Subscriptions</p>
              <p className="text-2xl font-bold">{stats.activeSubscriptions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold">{stats.pendingPayments.toLocaleString()}</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Revenue</h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Credits Issued</p>
              <p className="text-2xl font-bold">{stats.totalCreditsIssued.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Revenue per User</p>
              <p className="text-2xl font-bold">
                ${stats.totalUsers ? (stats.totalRevenue / stats.totalUsers).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Files Processed</p>
              <p className="text-2xl font-bold">{stats.totalFilesProcessed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Numbers Processed</p>
              <p className="text-2xl font-bold">{stats.totalNumbersProcessed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Numbers per File</p>
              <p className="text-2xl font-bold">
                {stats.totalFilesProcessed
                  ? Math.round(stats.totalNumbersProcessed / stats.totalFilesProcessed).toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
