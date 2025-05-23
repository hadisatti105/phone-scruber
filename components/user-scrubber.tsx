"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileUp, Download, Trash2, RefreshCw, AlertCircle, CreditCard, Shield, ShieldAlert } from "lucide-react"
import { processUserFileAction, getUserScrubOptionsAction, updateUserScrubOptionsAction } from "@/app/actions"
import type { User, ScrubOptions, DncList } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface UserScrubberProps {
  user: User
  dncLists?: DncList[]
  tcpaLists?: DncList[]
}

export function UserScrubber({ user, dncLists = [], tcpaLists = [] }: UserScrubberProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    total: number
    unique: number
    duplicates: number
    suppressedNumbers: number
    userListCount?: number
    dncCount?: number
    tcpaCount?: number
    creditsUsed: number
  } | null>(null)
  const [scrubOptions, setScrubOptions] = useState<ScrubOptions>({
    removeDuplicates: true,
    checkAgainstUserList: true,
    checkAgainstDNC: false,
    checkAgainstTCPA: false,
  })
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const { toast } = useToast()

  // Fetch user's scrub options
  useEffect(() => {
    async function fetchScrubOptions() {
      try {
        const result = await getUserScrubOptionsAction()
        if (result.success && result.options) {
          setScrubOptions(result.options)
        }
      } catch (error) {
        console.error("Error fetching scrub options:", error)
      } finally {
        setIsLoadingOptions(false)
      }
    }

    fetchScrubOptions()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setProcessedFileUrl(null)
      setStats(null)
      setError(null)
    }
  }

  const handleOptionChange = async (option: keyof ScrubOptions, value: boolean) => {
    const updatedOptions = { ...scrubOptions, [option]: value }
    setScrubOptions(updatedOptions)

    // Save the updated options
    try {
      const formData = new FormData()
      formData.append("options", JSON.stringify(updatedOptions))
      await updateUserScrubOptionsAction(formData)
    } catch (error) {
      console.error("Error updating scrub options:", error)
      toast({
        title: "Error",
        description: "Failed to save your scrubbing preferences",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("scrubOptions", JSON.stringify(scrubOptions))

      const result = await processUserFileAction(formData)

      if (result.success) {
        setProcessedFileUrl(result.fileUrl)
        setStats(result.stats)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError("An error occurred while processing the file. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setProcessedFileUrl(null)
    setStats(null)
    setError(null)
  }

  // Calculate estimated cost
  const calculateEstimatedCost = (fileSize: number) => {
    // Rough estimate: 1KB = ~20 phone numbers
    const estimatedNumbers = Math.ceil((fileSize / 1024) * 20)

    // Calculate additional costs for premium lists
    let additionalCredits = 0
    if (scrubOptions.checkAgainstDNC) additionalCredits += estimatedNumbers * 0.5 // 0.5 credits per number for DNC
    if (scrubOptions.checkAgainstTCPA) additionalCredits += estimatedNumbers * 0.3 // 0.3 credits per number for TCPA

    // Total credits needed
    const totalCreditsNeeded = estimatedNumbers + additionalCredits

    // Estimate cost at $10 per 20,000 credits
    const estimatedCost = Math.ceil(totalCreditsNeeded / 20000) * 10

    return {
      estimatedNumbers,
      totalCreditsNeeded,
      estimatedCost,
      additionalCredits,
    }
  }

  const estimatedInfo = file ? calculateEstimatedCost(file.size) : null

  const notEnoughCredits = estimatedInfo && estimatedInfo.totalCreditsNeeded > user.credits

  // Calculate DNC and TCPA costs
  const dncCost = dncLists.length > 0 ? dncLists[0].price : 5
  const tcpaCost = tcpaLists.length > 0 ? tcpaLists[0].price : 3

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scrub Your File</CardTitle>
        <CardDescription>
          Upload your Excel file to remove duplicates and check against your suppression list
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <span className="text-xs text-gray-500">Excel files only (.xlsx, .xls, .csv)</span>
                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {!isLoadingOptions && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Scrubbing Options:</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="removeDuplicates"
                    checked={scrubOptions.removeDuplicates}
                    onCheckedChange={(checked) => handleOptionChange("removeDuplicates", checked === true)}
                  />
                  <label
                    htmlFor="removeDuplicates"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remove duplicate numbers
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="checkAgainstUserList"
                    checked={scrubOptions.checkAgainstUserList}
                    onCheckedChange={(checked) => handleOptionChange("checkAgainstUserList", checked === true)}
                  />
                  <label
                    htmlFor="checkAgainstUserList"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Check against my suppression list
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="checkAgainstDNC"
                    checked={scrubOptions.checkAgainstDNC}
                    onCheckedChange={(checked) => handleOptionChange("checkAgainstDNC", checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="checkAgainstDNC"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                    >
                      <Shield className="h-4 w-4 mr-1 text-orange-500" />
                      Check against Federal DNC List
                      <span className="ml-2 text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                        Premium
                      </span>
                    </label>
                    <p className="text-xs text-gray-500">
                      Additional ${dncCost} per 10,000 numbers (0.5 credits per number)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="checkAgainstTCPA"
                    checked={scrubOptions.checkAgainstTCPA}
                    onCheckedChange={(checked) => handleOptionChange("checkAgainstTCPA", checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="checkAgainstTCPA"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                    >
                      <ShieldAlert className="h-4 w-4 mr-1 text-red-500" />
                      Check against TCPA Litigator List
                      <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">Premium</span>
                    </label>
                    <p className="text-xs text-gray-500">
                      Additional ${tcpaCost} per 10,000 numbers (0.3 credits per number)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {file && !processedFileUrl && (
            <>
              {estimatedInfo && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-2">Estimated Processing:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Estimated Numbers</p>
                      <p className="text-lg font-medium">{estimatedInfo.estimatedNumbers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Base Credits</p>
                      <p className="text-lg font-medium">{estimatedInfo.estimatedNumbers.toLocaleString()}</p>
                    </div>
                    {(scrubOptions.checkAgainstDNC || scrubOptions.checkAgainstTCPA) && (
                      <div>
                        <p className="text-sm text-gray-500">Premium List Credits</p>
                        <p className="text-lg font-medium text-orange-600">
                          +{estimatedInfo.additionalCredits.toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Total Credits Required</p>
                      <p className="text-lg font-medium">{estimatedInfo.totalCreditsNeeded.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Your Credits</p>
                      <p className={`text-lg font-medium ${notEnoughCredits ? "text-red-500" : "text-green-500"}`}>
                        {user.credits.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estimated Cost</p>
                      <p className="text-lg font-medium">${estimatedInfo.estimatedCost}</p>
                    </div>
                  </div>
                </div>
              )}

              {notEnoughCredits ? (
                <div className="space-y-4">
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Enough Credits</AlertTitle>
                    <AlertDescription>
                      You need to purchase more credits to process this file. Each $10 gives you 20,000 credits.
                    </AlertDescription>
                  </Alert>
                  <Button asChild className="w-full">
                    <Link href="/dashboard?tab=subscription">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase Credits
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Process File</>
                  )}
                </Button>
              )}
            </>
          )}

          {stats && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Results:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Total Numbers</p>
                  <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Unique Numbers</p>
                  <p className="text-xl font-bold text-green-600">{stats.unique.toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Duplicates</p>
                  <p className="text-xl font-bold text-red-600">{stats.duplicates.toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Suppressed</p>
                  <p className="text-xl font-bold text-orange-600">{stats.suppressedNumbers.toLocaleString()}</p>
                </div>
              </div>

              {(stats.userListCount || stats.dncCount || stats.tcpaCount) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-4">
                  {stats.userListCount !== undefined && (
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center justify-center mb-1">
                        <Shield className="h-4 w-4 mr-1 text-blue-500" />
                        <p className="text-sm text-gray-500">Your List</p>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{stats.userListCount.toLocaleString()}</p>
                    </div>
                  )}

                  {stats.dncCount !== undefined && stats.dncCount > 0 && (
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center justify-center mb-1">
                        <Shield className="h-4 w-4 mr-1 text-orange-500" />
                        <p className="text-sm text-gray-500">DNC List</p>
                      </div>
                      <p className="text-xl font-bold text-orange-600">{stats.dncCount.toLocaleString()}</p>
                    </div>
                  )}

                  {stats.tcpaCount !== undefined && stats.tcpaCount > 0 && (
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center justify-center mb-1">
                        <ShieldAlert className="h-4 w-4 mr-1 text-red-500" />
                        <p className="text-sm text-gray-500">TCPA List</p>
                      </div>
                      <p className="text-xl font-bold text-red-600">{stats.tcpaCount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white p-3 rounded shadow-sm text-center">
                <p className="text-sm text-gray-500">Credits Used</p>
                <p className="text-xl font-bold text-blue-600">{stats.creditsUsed.toLocaleString()}</p>
              </div>
            </div>
          )}

          {processedFileUrl && (
            <div className="flex justify-center">
              <Button asChild variant="outline" className="flex items-center">
                <a href={processedFileUrl} download="cleaned_phone_numbers.xlsx">
                  <Download className="h-4 w-4 mr-2" />
                  Download Cleaned File
                </a>
              </Button>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={resetForm}>
          Start Over
        </Button>
        {processedFileUrl && (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Process Another File
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
