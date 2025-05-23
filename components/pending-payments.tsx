"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Payment } from "@/lib/types"

interface PendingPaymentsProps {
  payments?: Payment[]
  onViewDetails?: (payment: Payment) => void
}

export function PendingPayments({ payments = [], onViewDetails }: PendingPaymentsProps) {
  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">You don't have any pending payments.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="font-medium">{payment.description}</div>
                <div className="text-sm text-gray-500">Reference: {payment.referenceNumber}</div>
                <div className="mt-1">
                  <Badge variant={payment.status === "pending" ? "outline" : "secondary"}>
                    {payment.status === "pending" ? "Pending" : "Processing"}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">${payment.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</div>
                {onViewDetails && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => onViewDetails(payment)}>
                    View Details
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
