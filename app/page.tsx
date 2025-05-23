"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileUp, Download, Trash2, RefreshCw, User, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { processPhonesAction } from "./actions"
import Link from "next/link"

export default function PhoneNumberScrubber() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    total: number
    unique: number
    duplicates: number
    suppressedNumbers: number
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setProcessedFileUrl(null)
      setStats(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await processPhonesAction(formData)

      setProcessedFileUrl(result.fileUrl)
      setStats(result.stats)
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setProcessedFileUrl(null)
    setStats(null)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Phone Number Scrubber</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/signup">
              <User className="h-4 w-4 mr-2" />
              Sign Up
            </Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/login">Admin</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Free Plan</CardTitle>
            <CardDescription>Basic deduplication</CardDescription>
            <div className="mt-2 text-3xl font-bold">$0</div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Remove duplicates from files
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Basic file processing
              </li>
              <li className="flex items-center text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                No custom suppression list
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link href="#scrubber">Use Free Version</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-primary">
          <CardHeader className="text-center">
            <div className="py-1 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium inline-block mb-2">
              MOST POPULAR
            </div>
            <CardTitle className="text-xl">Pro Plan</CardTitle>
            <CardDescription>Custom suppression lists</CardDescription>
            <div className="mt-2 text-3xl font-bold">$10</div>
            <div className="text-sm text-gray-500">per 20K numbers</div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Everything in Free plan
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Custom suppression lists
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Scrub against your lists
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/signup">Sign Up Now</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Enterprise</CardTitle>
            <CardDescription>For large organizations</CardDescription>
            <div className="mt-2 text-3xl font-bold">Custom</div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Everything in Pro plan
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                API access
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Dedicated support
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card id="scrubber" className="w-full max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Free Phone Number Scrubber</CardTitle>
          <CardDescription>
            Upload your Excel file with phone numbers to remove duplicates and get a clean list
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            {file && !processedFileUrl && (
              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Remove Duplicates</>
                )}
              </Button>
            )}

            {stats && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Results:</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-sm text-gray-500">Total Numbers</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-sm text-gray-500">Unique Numbers</p>
                    <p className="text-xl font-bold text-green-600">{stats.unique}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-sm text-gray-500">Duplicates</p>
                    <p className="text-xl font-bold text-red-600">{stats.duplicates}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-sm text-gray-500">Suppressed</p>
                    <p className="text-xl font-bold text-orange-600">{stats.suppressedNumbers || 0}</p>
                  </div>
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

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Want more features?</h2>
        <p className="mb-6 max-w-2xl mx-auto">
          Sign up for a Pro account to create your own custom suppression lists and scrub your files against them.
        </p>
        <Button asChild size="lg">
          <Link href="/signup">Sign Up Now</Link>
        </Button>
      </div>
    </div>
  )
}
