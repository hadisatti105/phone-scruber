"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Upload, FileUp, RefreshCw, Download, Database, Search, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminDncListsProps {
  initialLists: {
    dnc: any[]
    tcpa: any[]
    custom: any[]
  }
  uploadAction: (formData: FormData) => Promise<any>
  deleteAction: (formData: FormData) => Promise<any>
}

export function AdminDncLists({ initialLists, uploadAction, deleteAction }: AdminDncListsProps) {
  const [activeTab, setActiveTab] = useState("dnc")
  const [lists, setLists] = useState(initialLists)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [listName, setListName] = useState("")
  const [listType, setListType] = useState<"dnc" | "tcpa" | "custom">("dnc")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !listName) {
      toast({
        title: "Missing information",
        description: "Please provide both a file and list name",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 5
      })
    }, 300)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", listName)
      formData.append("type", listType)

      const result = await uploadAction(formData)

      if (result.success) {
        clearInterval(progressInterval)
        setUploadProgress(100)

        setTimeout(() => {
          toast({
            title: "Upload successful",
            description: result.message,
          })

          // Add the new list to the state
          setLists((prev) => ({
            ...prev,
            [listType]: [...prev[listType], result.list],
          }))

          // Reset form
          setFile(null)
          setListName("")
          setUploadDialogOpen(false)
          setUploadProgress(0)
        }, 500)
      } else {
        clearInterval(progressInterval)
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload list",
          variant: "destructive",
        })
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error("Error uploading DNC list:", error)
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the list",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (listId: string) => {
    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append("listId", listId)

      const result = await deleteAction(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "List deleted successfully",
        })

        // Remove the list from state
        setLists((prev) => {
          const updatedLists = { ...prev }
          for (const type in updatedLists) {
            updatedLists[type as keyof typeof updatedLists] = updatedLists[type as keyof typeof updatedLists].filter(
              (list) => list.id !== listId,
            )
          }
          return updatedLists
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete list",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting list:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the list",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Filter lists based on search term
  const getFilteredLists = () => {
    const currentLists = lists[activeTab as keyof typeof lists] || []

    if (!searchTerm) return currentLists

    return currentLists.filter((list: any) => list.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  const filteredLists = getFilteredLists()

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>DNC & TCPA Lists</CardTitle>
              <CardDescription>Manage Do Not Call and TCPA compliance lists</CardDescription>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload DNC List</DialogTitle>
                  <DialogDescription>Upload a new list of phone numbers for DNC or TCPA compliance</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="listName">List Name</Label>
                    <Input
                      id="listName"
                      placeholder="Enter a name for this list"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>List Type</Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={listType === "dnc" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setListType("dnc")}
                      >
                        DNC
                      </Button>
                      <Button
                        type="button"
                        variant={listType === "tcpa" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setListType("tcpa")}
                      >
                        TCPA
                      </Button>
                      <Button
                        type="button"
                        variant={listType === "custom" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setListType("custom")}
                      >
                        Custom
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {file ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center">
                            <FileUp className="h-8 w-8 text-green-500" />
                          </div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFile(null)}
                            className="mt-2"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center space-y-2">
                          <Upload className="h-10 w-10 text-gray-400" />
                          <span className="text-sm font-medium">Click to upload or drag and drop</span>
                          <span className="text-xs text-gray-500">CSV, Excel, or text files with phone numbers</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.txt"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadDialogOpen(false)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!file || !listName || isUploading}>
                      {isUploading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload List"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dnc" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="dnc">DNC Lists</TabsTrigger>
                <TabsTrigger value="tcpa">TCPA Lists</TabsTrigger>
                <TabsTrigger value="custom">Custom Lists</TabsTrigger>
              </TabsList>

              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search lists..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : filteredLists.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          List Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Numbers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Upload Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLists.map((list: any) => (
                        <tr key={list.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Database className="h-5 w-5 text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">{list.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {list.count.toLocaleString()} numbers
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(list.uploadDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {list.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={list.downloadUrl} download>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this list? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => {}}>
                                      Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={() => handleDelete(list.id)}>
                                      Delete List
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No {activeTab} lists found</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}
