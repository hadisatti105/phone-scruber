"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { Currency } from "@/lib/types"

interface AdminCurrenciesProps {
  initialCurrencies: Currency[]
  updateAction: (formData: FormData) => Promise<any>
  deleteAction: (formData: FormData) => Promise<any>
}

export function AdminCurrencies({ initialCurrencies = [], updateAction, deleteAction }: AdminCurrenciesProps) {
  const [currencies, setCurrencies] = useState(initialCurrencies)
  const [loading, setLoading] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
    exchangeRate: "1.0",
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

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency.id)
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate.toString(),
      isActive: currency.isActive,
    })
    setIsAddingNew(false)
  }

  const handleAddNew = () => {
    setEditingCurrency(null)
    setFormData({
      code: "",
      name: "",
      symbol: "",
      exchangeRate: "1.0",
      isActive: true,
    })
    setIsAddingNew(true)
  }

  const handleCancel = () => {
    setEditingCurrency(null)
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

      // Add the currency ID if editing
      if (editingCurrency) {
        form.append("currencyId", editingCurrency)
      }

      const result = await updateAction(form)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Currency saved successfully",
        })

        // Update the local state
        if (editingCurrency) {
          setCurrencies(currencies.map((currency) => (currency.id === editingCurrency ? result.currency : currency)))
        } else {
          setCurrencies([...currencies, result.currency])
        }

        // Reset the form
        setEditingCurrency(null)
        setIsAddingNew(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save currency",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving currency:", error)
      toast({
        title: "Error",
        description: "An error occurred while saving the currency",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (currencyId: string) => {
    setLoading(true)
    try {
      const form = new FormData()
      form.append("currencyId", currencyId)

      const result = await deleteAction(form)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Currency deleted successfully",
        })

        // Update the local state
        setCurrencies(currencies.filter((currency) => currency.id !== currencyId))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete currency",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting currency:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the currency",
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
          <CardTitle>Currency Management</CardTitle>
          <CardDescription>Manage currencies and exchange rates</CardDescription>
        </div>
        <Button onClick={handleAddNew} disabled={isAddingNew || loading}>
          <Plus className="h-4 w-4 mr-1" /> Add Currency
        </Button>
      </CardHeader>
      <CardContent>
        {currencies.length === 0 && !isAddingNew ? (
          <div className="text-center p-8 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No currencies configured</p>
            <Button onClick={handleAddNew} className="mt-4">
              <Plus className="h-4 w-4 mr-1" /> Add Currency
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {isAddingNew && (
              <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-muted/10">
                <h3 className="font-medium">Add New Currency</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Currency Code</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="USD"
                      maxLength={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Currency Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="US Dollar"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Currency Symbol</Label>
                    <Input
                      id="symbol"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      placeholder="$"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exchangeRate">Exchange Rate (vs USD)</Label>
                    <Input
                      id="exchangeRate"
                      name="exchangeRate"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={formData.exchangeRate}
                      onChange={handleInputChange}
                      required
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

            {currencies.map((currency) => (
              <div
                key={currency.id}
                className={`border rounded-lg p-4 ${editingCurrency === currency.id ? "bg-muted/10" : ""}`}
              >
                {editingCurrency === currency.id ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-medium">Edit Currency</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Currency Code</Label>
                        <Input
                          id="code"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          placeholder="USD"
                          maxLength={3}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Currency Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="US Dollar"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symbol">Currency Symbol</Label>
                        <Input
                          id="symbol"
                          name="symbol"
                          value={formData.symbol}
                          onChange={handleInputChange}
                          placeholder="$"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exchangeRate">Exchange Rate (vs USD)</Label>
                        <Input
                          id="exchangeRate"
                          name="exchangeRate"
                          type="number"
                          step="0.0001"
                          min="0"
                          value={formData.exchangeRate}
                          onChange={handleInputChange}
                          required
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
                      <div className="flex items-center gap-2">
                        <div className="font-mono bg-muted px-2 py-1 rounded text-sm">{currency.code}</div>
                        <h3 className="font-medium">{currency.name}</h3>
                        <div className="text-xl">{currency.symbol}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(currency)} disabled={loading}>
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
                                Are you sure you want to delete the currency{" "}
                                <strong>
                                  {currency.code} - {currency.name}
                                </strong>
                                ?
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {}}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(currency.id)}
                                disabled={loading}
                              >
                                {loading ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="font-medium">Exchange Rate:</span> {currency.exchangeRate} USD
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {currency.isActive ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </div>
                    </div>
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
