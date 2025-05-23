"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, RefreshCw, Plus, Search, AlertCircle, Upload, FileUp } from "lucide-react"
import {
  addPhoneToSuppressionAction,
  removePhoneFromSuppressionAction,
  getSuppressionListAction,
  uploadUserSuppressionListAction,
} from "@/app/actions"
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

interface SuppressionListManagerProps {
  initialList: string[]
  userId: string
}

// Number of items to show per page
const PAGE_SIZE = 100

export function SuppressionListManager({ initialList, userId }: SuppressionListManagerProps) {
  const [suppressionList, setSuppressionList] = useState<string[]>(initialList)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isAddingPhone, setIsAddingPhone] = useState(false)
  const [phoneToDelete, setPhoneToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("view")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeout: NodeJS.Timeout | null = null
      return (value: string) => {
        setIsSearching(true)
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          setSearchTerm(value)
          setCurrentPage(1)
          setIsSearching(false)
        }, 300)
      }
    })(),
    [],
  )

  // Function to refresh the suppression list
  const refreshSuppressionList = async () => {
    setIsRefreshing(true)
    try {
      const result = await getSuppressionListAction()
      if (result.success) {
        setSuppressionList(result.list)
        setTotalCount(result.list.length)
      }
    } catch (error) {
      console.error("Error refreshing suppression list:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Refresh the list when the component mounts
  useEffect(() => {
    refreshSuppressionList()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadUserSuppressionListAction(formData)

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        setFile(null)
        // Switch to view tab and refresh the list
        setActiveTab("view")
        refreshSuppressionList()
      } else {
        setMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while uploading the file" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber) return

    setIsAddingPhone(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("phoneNumber", phoneNumber)

      const result = await addPhoneToSuppressionAction(formData)

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        setPhoneNumber("")
        // Switch to view tab and refresh the list
        setActiveTab("view")
        refreshSuppressionList()
      } else {
        setMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while adding the phone number" })
    } finally {
      setIsAddingPhone(false)
    }
  }

  const handleDeletePhone = async () => {
    if (!phoneToDelete) return

    setIsDeleting(true)

    try {
      const formData = new FormData()
      formData.append("phoneNumber", phoneToDelete)

      const result = await removePhoneFromSuppressionAction(formData)

      if (result.success) {
        // Remove the number from the local state
        setSuppressionList(suppressionList.filter((phone) => phone !== phoneToDelete))
        setMessage({ type: "success", text: result.message })
      } else {
        setMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while deleting the phone number" })
    } finally {
      setIsDeleting(false)
      setPhoneToDelete(null)
    }
  }

  // Get filtered list - optimized for large datasets
  const getFilteredList = () => {
    if (!searchTerm) {
      // If no search term, just return the current page of data
      const startIndex = (currentPage - 1) * PAGE_SIZE
      return suppressionList.slice(startIndex, startIndex + PAGE_SIZE)
    }

    // If searching, filter the list but limit results to avoid performance issues
    const normalizedSearchTerm = searchTerm.replace(/\D/g, "")
    const filtered = suppressionList.filter((phone) => phone.includes(normalizedSearchTerm)).slice(0, PAGE_SIZE * 2)
    return filtered.slice(0, PAGE_SIZE)
  }

  const filteredList = getFilteredList()
  const totalPages = searchTerm
    ? Math.ceil(suppressionList.filter((phone) => phone.includes(searchTerm.replace(/\D/g, ""))).length / PAGE_SIZE)
    : Math.ceil(suppressionList.length / PAGE_SIZE)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suppression List Manager</CardTitle>
        <CardDescription>
          Manage your list of phone numbers that will be automatically removed from uploaded files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="view" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="view">View List</TabsTrigger>
            <TabsTrigger value="add">Add Numbers</TabsTrigger>
            <TabsTrigger value="upload">Upload List</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search phone numbers..."
                  onChange={(e) => debouncedSearch(e.target.value)}
                  disabled={isSearching}
                />
              </div>
              <Button variant="outline" size="sm" onClick={refreshSuppressionList} disabled={isRefreshing}>
                {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>

            <div className="border rounded-md">
              <div className="p-3 bg-gray-50 border-b font-medium flex justify-between items-center">
                <span>
                  Phone Numbers ({searchTerm ? filteredList.length + " matching" : totalCount})
                  {isSearching && " (Searching...)"}
                </span>
                {totalCount > 0 && (
                  <span className="text-sm text-gray-500">
                    Showing {filteredList.length} of {searchTerm ? "matching" : "total"} numbers
                  </span>
                )}
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-6 text-center text-gray-500 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </div>
                ) : filteredList.length > 0 ? (
                  filteredList.map((phone, index) => (
                    <div key={index} className="p-3 flex justify-between items-center">
                      <span>{phone}</span>
                      <Button variant="ghost" size="sm" onClick={() => setPhoneToDelete(phone)} disabled={isDeleting}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {searchTerm ? "No matching phone numbers found" : "No phone numbers in your suppression list"}
                  </div>
                )}
              </div>
              {totalPages > 1 && (
                <div className="p-3 border-t flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add">
            <form onSubmit={handleAddPhone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={isAddingPhone}>
                {isAddingPhone ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Suppression List
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="upload">
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                {file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <FileUp className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setFile(null)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <Upload className="h-10 w-10 text-gray-400" />
                    <span className="text-sm font-medium">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-500">Excel files with phone numbers (.xlsx, .xls, .csv)</span>
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              {file && (
                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>Upload Suppression List</>
                  )}
                </Button>
              )}
            </form>
          </TabsContent>
        </Tabs>

        {message && (
          <div
            className={`mt-4 p-3 text-sm rounded-md flex items-center gap-2 ${
              message.type === "success" ? "text-green-500 bg-green-50" : "text-red-500 bg-red-50"
            }`}
          >
            {message.type === "error" && <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog for Deleting Phone Numbers */}
      <AlertDialog open={!!phoneToDelete} onOpenChange={(open) => !open && setPhoneToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phone Number</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {phoneToDelete} from your suppression list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePhone} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
