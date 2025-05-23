"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash, Edit, Check, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { BankAccount, Currency } from "@/lib/types"

interface AdminBankingInfoProps {
  initialBankAccounts: BankAccount[]
  currencies: Currency[]
  updateAction: (formData: FormData) => Promise<any>
  deleteAction: (formData: FormData) => Promise<any>
}

export function AdminBankingInfo({
  initialBankAccounts = [],
  currencies = [],
  updateAction,
  deleteAction,
}: AdminBankingInfoProps) {
  const [bankAccounts, setBankAccounts] = useState(initialBankAccounts)
  const [loading, setLoading] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
    bankAddress: "",
    currency: "USD",
    isActive: true,
  })
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account.id)
    setFormData({
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      routingNumber: account.routingNumber,
      swiftCode: account.swiftCode || "",
      bankAddress: account.bankAddress || "",
      currency: account.currency,
      isActive: account.isActive,
    })
    setIsAddingNew(false)
  }

  const handleAddNew = () => {
    setEditingAccount(null)
    setFormData({
      bankName: "",
      accountName: "",
      accountNumber: "",
      routingNumber: "",
      swiftCode: "",
      bankAddress: "",
      currency: "USD",
      isActive: true,
    })
    setIsAddingNew(true)
  }

  const handleCancel = () => {
    setEditingAccount(null)
    setIsAddingNew(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const form = new FormData()

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "isActive") {
          form.append(key, value ? "on" : "off")
        } else {
          form.append(key, value.toString())
        }
      })

      // Add the bank ID if editing
      if (editingAccount) {
        form.append("bankId", editingAccount)
      }

      const result = await updateAction(form)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Bank account saved successfully",
        })

        // Update the local state
        if (editingAccount) {
          setBankAccounts(bankAccounts.map((account) => (account.id === editingAccount ? result.bankAccount : account)))
        } else {
          setBankAccounts([...bankAccounts, result.bankAccount])
        }

        // Reset the form
        setEditingAccount(null)
        setIsAddingNew(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save bank account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving bank account:", error)
      toast({
        title: "Error",
        description: "An error occurred while saving the bank account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (bankId: string) => {
    setLoading(true)
    try {
      const form = new FormData()
      form.append("bankId", bankId)

      const result = await deleteAction(form)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Bank account deleted successfully",
        })

        // Update the local state
        setBankAccounts(bankAccounts.filter((account) => account.id !== bankId))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete bank account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting bank account:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the bank account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Banking Information</CardTitle>
          <CardDescription>Manage bank accounts for customer payments</CardDescription>
        </div>
        <Button onClick={handleAddNew} disabled={isAddingNew || loading}>
          <Plus className="h-4 w-4 mr-1" /> Add Bank Account
        </Button>
      </CardHeader>
      <CardContent>
        {bankAccounts.length === 0 && !isAddingNew ? (
          <div className="text-center p-8 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No bank accounts configured</p>
            <Button onClick={handleAddNew} className="mt-4">
              <Plus className="h-4 w-4 mr-1" /> Add Bank Account
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {isAddingNew && (
              <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-muted/10">
                <h3 className="font-medium">Add New Bank Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      name="routingNumber"
                      value={formData.routingNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swiftCode">SWIFT/BIC Code (Optional)</Label>
                    <Input id="swiftCode" name="swiftCode" value={formData.swiftCode} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleSelectChange("currency", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bankAddress">Bank Address (Optional)</Label>
                    <Input
                      id="bankAddress"
                      name="bankAddress"
                      value={formData.bankAddress}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                    />
                    <Label htmlFor="isActive">Active for customer payments</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            )}

            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className={`border rounded-lg p-4 ${editingAccount === account.id ? "bg-muted/10" : ""}`}
              >
                {editingAccount === account.id ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-medium">Edit Bank Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                          id="accountName"
                          name="accountName"
                          value={formData.accountName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="routingNumber">Routing Number</Label>
                        <Input
                          id="routingNumber"
                          name="routingNumber"
                          value={formData.routingNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="swiftCode">SWIFT/BIC Code (Optional)</Label>
                        <Input
                          id="swiftCode"
                          name="swiftCode"
                          value={formData.swiftCode}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => handleSelectChange("currency", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.code} - {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bankAddress">Bank Address (Optional)</Label>
                        <Input
                          id="bankAddress"
                          name="bankAddress"
                          value={formData.bankAddress}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                        />
                        <Label htmlFor="isActive">Active for customer payments</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{account.bankName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {account.accountName} • {account.currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(account)} disabled={loading}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={loading}>
                              <Trash className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Deletion</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p>
                                Are you sure you want to delete the bank account for <strong>{account.bankName}</strong>
                                ?
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {}}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={() => handleDelete(account.id)} disabled={loading}>
                                {loading ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="font-medium">Account Number:</span> {account.accountNumber}
                      </div>
                      <div>
                        <span className="font-medium">Routing Number:</span> {account.routingNumber}
                      </div>
                      {account.swiftCode && (
                        <div>
                          <span className="font-medium">SWIFT/BIC:</span> {account.swiftCode}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {account.isActive ? (
                          <span className="text-green-600 flex items-center">
                            <Check className="h-3 w-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <X className="h-3 w-3 mr-1" /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    {account.bankAddress && (
                      <div className="text-sm">
                        <span className="font-medium">Address:</span> {account.bankAddress}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
