"use server"

import * as XLSX from "xlsx"
import { cookies } from "next/headers"
import { getSuppressionList, addToSuppressionList } from "@/lib/suppression-list"
import type { User, Subscription, BankTransferPayment, ScrubOptions, PaymentMethod } from "@/lib/types"
import { getSubscriptionPlan } from "@/lib/subscription-plans"
import {
  getActiveBankAccounts,
  getAllBankAccounts,
  updateBankAccount,
  deleteBankAccount,
  getAllCurrencies,
  updateCurrency,
  deleteCurrency,
  getDncListsByType,
  updateDncList,
  deleteDncList,
  getUserScrubOptions,
  updateUserScrubOptions,
  getUserFromCookieWithData,
  getAdminFromCookie,
  getAllPendingPayments,
  addPayment,
  updatePaymentStatus,
} from "@/lib/data-service"

// Process phones action
export async function processPhonesAction(formData: FormData) {
  try {
    // Get the file from the form data
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("No file provided")
    }

    // Convert the file to an array buffer
    const arrayBuffer = await file.arrayBuffer()

    // Read the Excel file
    const workbook = XLSX.read(arrayBuffer)

    // Assume the first sheet contains the phone numbers
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert the sheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet)

    // Find the column that contains phone numbers
    // This is a simple approach - we look for columns with names like "phone", "mobile", etc.
    let phoneColumn = null
    if (data.length > 0) {
      const firstRow = data[0] as Record<string, any>
      const columns = Object.keys(firstRow)

      for (const col of columns) {
        const lowerCol = col.toLowerCase()
        if (
          lowerCol.includes("phone") ||
          lowerCol.includes("mobile") ||
          lowerCol.includes("cell") ||
          lowerCol.includes("number")
        ) {
          phoneColumn = col
          break
        }
      }

      // If we couldn't find a phone column, use the first column
      if (!phoneColumn && columns.length > 0) {
        phoneColumn = columns[0]
      }
    }

    if (!phoneColumn) {
      throw new Error("Could not identify a phone number column")
    }

    // Get the suppression list
    const suppressionList = await getSuppressionList()
    const suppressionSet = new Set(suppressionList)

    // Extract and normalize phone numbers
    const phoneNumbers = new Map()
    const totalCount = data.length
    let suppressedCount = 0

    for (const row of data) {
      const record = row as Record<string, any>
      let phoneNumber = record[phoneColumn]?.toString() || ""

      // Normalize the phone number (remove non-numeric characters)
      phoneNumber = phoneNumber.replace(/\D/g, "")

      if (phoneNumber) {
        // Check if the number is in the suppression list
        if (suppressionSet.has(phoneNumber)) {
          suppressedCount++
          continue
        }

        // Only keep the first occurrence of each phone number
        if (!phoneNumbers.has(phoneNumber)) {
          phoneNumbers.set(phoneNumber, record)
        }
      }
    }

    // Create a new array with unique phone numbers
    const uniqueData = Array.from(phoneNumbers.values())

    // Create a new workbook with the unique data
    const newWorkbook = XLSX.utils.book_new()
    const newWorksheet = XLSX.utils.json_to_sheet(uniqueData)
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Cleaned Phone Numbers")

    // Calculate statistics
    const uniqueCount = uniqueData.length
    const duplicatesCount = totalCount - uniqueCount - suppressedCount

    // Generate the Excel file as a buffer
    const excelBuffer = XLSX.write(newWorkbook, { type: "buffer", bookType: "xlsx" })

    // Convert the buffer to base64 for transfer
    const base64 = Buffer.from(excelBuffer).toString("base64")

    // Create a data URL that can be used for download
    const fileUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`

    return {
      fileUrl,
      stats: {
        total: totalCount,
        unique: uniqueCount,
        duplicates: duplicatesCount,
        suppressedNumbers: suppressedCount,
      },
    }
  } catch (error) {
    console.error("Error processing phone numbers:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// User authentication actions
export async function signupAction(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      return { success: false, error: "All fields are required" }
    }

    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match" }
    }

    // Create a user object
    const user: Partial<User> = {
      id: "user_" + Date.now(),
      name,
      email,
      credits: 15000,
      suppressionCount: 0,
      filesProcessed: 0,
      numbersProcessed: 0,
      numbersRemoved: 0,
      creditsUsed: 0,
      preferredCurrency: "USD",
      paymentMethods: [],
      pendingPayments: [],
    }

    // In a real app, you would hash the password and store the user in a database
    // For this demo, we'll store user data in a cookie
    cookies().set("user_auth", "demo_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    cookies().set("user_data", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, redirectTo: "/dashboard" }
  } catch (error) {
    console.error("Error signing up:", error)
    return { success: false, error: "An error occurred during signup" }
  }
}

export async function loginUserAction(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validate inputs
    if (!email || !password) {
      return { success: false, error: "Email and password are required" }
    }

    // In a real app, you would verify the credentials against a database
    // For this demo, we'll create a mock user with real data
    const user: Partial<User> = {
      id: "user_" + Date.now(),
      name: "Demo User",
      email,
      credits: 15000,
      suppressionCount: 0,
      filesProcessed: 0,
      numbersProcessed: 0,
      numbersRemoved: 0,
      creditsUsed: 0,
      preferredCurrency: "USD",
      paymentMethods: [],
      pendingPayments: [],
    }

    cookies().set("user_auth", "demo_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    cookies().set("user_data", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, redirectTo: "/dashboard" }
  } catch (error) {
    console.error("Error logging in:", error)
    return { success: false, error: "Invalid email or password" }
  }
}

export async function logoutUserAction() {
  try {
    cookies().delete("user_auth")
    cookies().delete("user_data")
    return { success: true, redirectTo: "/" }
  } catch (error) {
    console.error("Error logging out:", error)
    return { success: false, error: "An error occurred during logout" }
  }
}

// Add this function to upload a suppression file for a user
export async function uploadUserSuppressionListAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    // Get the file from the form data
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Convert the file to an array buffer
    const arrayBuffer = await file.arrayBuffer()

    // Read the Excel file
    const workbook = XLSX.read(arrayBuffer)

    // Assume the first sheet contains the phone numbers
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert the sheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet)

    // Find the column that contains phone numbers
    let phoneColumn = null
    if (data.length > 0) {
      const firstRow = data[0] as Record<string, any>
      const columns = Object.keys(firstRow)

      for (const col of columns) {
        const lowerCol = col.toLowerCase()
        if (
          lowerCol.includes("phone") ||
          lowerCol.includes("mobile") ||
          lowerCol.includes("cell") ||
          lowerCol.includes("number")
        ) {
          phoneColumn = col
          break
        }
      }

      // If we couldn't find a phone column, use the first column
      if (!phoneColumn && columns.length > 0) {
        phoneColumn = columns[0]
      }
    }

    if (!phoneColumn) {
      return { success: false, error: "Could not identify a phone number column" }
    }

    // Extract and normalize phone numbers
    const phoneNumbers: string[] = []

    for (const row of data) {
      const record = row as Record<string, any>
      let phoneNumber = record[phoneColumn]?.toString() || ""

      // Normalize the phone number (remove non-numeric characters)
      phoneNumber = phoneNumber.replace(/\D/g, "")

      if (phoneNumber) {
        phoneNumbers.push(phoneNumber)
      }
    }

    if (phoneNumbers.length === 0) {
      return { success: false, error: "No valid phone numbers found in the file" }
    }

    // Add the phone numbers to the suppression list
    await addToSuppressionList(phoneNumbers, file.name)

    // Update the user's suppression count in the cookie
    const userData = { ...user, suppressionCount: user.suppressionCount + phoneNumbers.length }
    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      message: `Added ${phoneNumbers.length} numbers to your suppression list`,
      count: phoneNumbers.length,
    }
  } catch (error) {
    console.error("Error uploading suppression list:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Process a file for a logged-in user (paid feature)
export async function processUserFileAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    // Get the file from the form data
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Get scrub options
    const scrubOptions = formData.get("scrubOptions")
      ? (JSON.parse(formData.get("scrubOptions") as string) as ScrubOptions)
      : getUserScrubOptions(user.id)

    // Convert the file to an array buffer
    const arrayBuffer = await file.arrayBuffer()

    // Read the Excel file
    const workbook = XLSX.read(arrayBuffer)

    // Assume the first sheet contains the phone numbers
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert the sheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet)

    // Find the column that contains phone numbers
    let phoneColumn = null
    if (data.length > 0) {
      const firstRow = data[0] as Record<string, any>
      const columns = Object.keys(firstRow)

      for (const col of columns) {
        const lowerCol = col.toLowerCase()
        if (
          lowerCol.includes("phone") ||
          lowerCol.includes("mobile") ||
          lowerCol.includes("cell") ||
          lowerCol.includes("number")
        ) {
          phoneColumn = col
          break
        }
      }

      // If we couldn't find a phone column, use the first column
      if (!phoneColumn && columns.length > 0) {
        phoneColumn = columns[0]
      }
    }

    if (!phoneColumn) {
      return { success: false, error: "Could not identify a phone number column" }
    }

    // Get the user's suppression list if needed
    let userSuppressionList: string[] = []
    if (scrubOptions.checkAgainstUserList) {
      userSuppressionList = await getSuppressionList() // This would be user-specific in a real app
    }

    // Get DNC and TCPA lists if needed
    let dncList: string[] = []
    let tcpaList: string[] = []

    if (scrubOptions.checkAgainstDNC) {
      // In a real app, you would fetch the DNC list from a database
      // For this demo, we'll use a mock list
      dncList = ["5551234567", "5559876543", "5552345678"]
    }

    if (scrubOptions.checkAgainstTCPA) {
      // In a real app, you would fetch the TCPA list from a database
      // For this demo, we'll use a mock list
      tcpaList = ["5553456789", "5554567890", "5555678901"]
    }

    // Combine all suppression lists
    const suppressionSet = new Set([
      ...(scrubOptions.checkAgainstUserList ? userSuppressionList : []),
      ...(scrubOptions.checkAgainstDNC ? dncList : []),
      ...(scrubOptions.checkAgainstTCPA ? tcpaList : []),
    ])

    // Extract and normalize phone numbers
    const phoneNumbers = new Map()
    const totalCount = data.length
    let suppressedCount = 0
    let dncCount = 0
    let tcpaCount = 0
    let userListCount = 0

    // Calculate additional costs for premium lists
    let additionalCredits = 0
    if (scrubOptions.checkAgainstDNC) additionalCredits += totalCount * 0.5 // 0.5 credits per number for DNC
    if (scrubOptions.checkAgainstTCPA) additionalCredits += totalCount * 0.3 // 0.3 credits per number for TCPA

    // Total credits needed
    const totalCreditsNeeded = totalCount + additionalCredits

    // Check if user has enough credits
    if (user.credits < totalCreditsNeeded) {
      return {
        success: false,
        error: `Not enough credits. You need ${totalCreditsNeeded} credits but have ${user.credits} credits. Please purchase more credits.`,
      }
    }

    for (const row of data) {
      const record = row as Record<string, any>
      let phoneNumber = record[phoneColumn]?.toString() || ""

      // Normalize the phone number (remove non-numeric characters)
      phoneNumber = phoneNumber.replace(/\D/g, "")

      if (phoneNumber) {
        // Check if the number is in any suppression list
        if (suppressionSet.has(phoneNumber)) {
          suppressedCount++

          // Track which list caught this number (for reporting)
          if (scrubOptions.checkAgainstUserList && userSuppressionList.includes(phoneNumber)) {
            userListCount++
          }
          if (scrubOptions.checkAgainstDNC && dncList.includes(phoneNumber)) {
            dncCount++
          }
          if (scrubOptions.checkAgainstTCPA && tcpaList.includes(phoneNumber)) {
            tcpaCount++
          }

          continue
        }

        // Only keep the first occurrence of each phone number if duplicate removal is enabled
        if (!scrubOptions.removeDuplicates || !phoneNumbers.has(phoneNumber)) {
          phoneNumbers.set(phoneNumber, record)
        }
      }
    }

    // Create a new array with unique phone numbers
    const uniqueData = Array.from(phoneNumbers.values())

    // Create a new workbook with the unique data
    const newWorkbook = XLSX.utils.book_new()
    const newWorksheet = XLSX.utils.json_to_sheet(uniqueData)
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Cleaned Phone Numbers")

    // Calculate statistics
    const uniqueCount = uniqueData.length
    const duplicatesCount = scrubOptions.removeDuplicates ? totalCount - uniqueCount - suppressedCount : 0
    const creditsUsed = totalCreditsNeeded

    // Generate the Excel file as a buffer
    const excelBuffer = XLSX.write(newWorkbook, { type: "buffer", bookType: "xlsx" })

    // Convert the buffer to base64 for transfer
    const base64 = Buffer.from(excelBuffer).toString("base64")

    // Create a data URL that can be used for download
    const fileUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`

    // Update the user's stats in the cookie
    let userData = {
      ...user,
      credits: user.credits - creditsUsed,
      filesProcessed: user.filesProcessed + 1,
      numbersProcessed: user.numbersProcessed + totalCount,
      numbersRemoved: user.numbersRemoved + (duplicatesCount + suppressedCount),
      creditsUsed: user.creditsUsed + creditsUsed,
    }

    // If user has an active subscription, update the credits used this period
    if (userData.subscription && userData.subscription.status === "active") {
      userData = {
        ...userData,
        subscription: {
          ...userData.subscription,
          creditsUsedThisPeriod: userData.subscription.creditsUsedThisPeriod + creditsUsed,
        },
      }
    }

    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      fileUrl,
      stats: {
        total: totalCount,
        unique: uniqueCount,
        duplicates: duplicatesCount,
        suppressedNumbers: suppressedCount,
        userListCount,
        dncCount,
        tcpaCount,
        creditsUsed,
      },
    }
  } catch (error) {
    console.error("Error processing user file:", error)
    return { success: false, error: "An error occurred while processing the file" }
  }
}

// Add a phone number to the user's suppression list
export async function addPhoneToSuppressionAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const phoneNumber = (formData.get("phoneNumber") as string).replace(/\D/g, "")

    if (!phoneNumber) {
      return { success: false, error: "No phone number provided" }
    }

    // In a real app, you would add the phone number to the user's suppression list in the database
    // For this demo, we'll just use the global suppression list
    await addToSuppressionList([phoneNumber])

    // Update the user's suppression count in the cookie
    const userData = { ...user, suppressionCount: user.suppressionCount + 1 }
    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      message: `Added ${phoneNumber} to your suppression list`,
    }
  } catch (error) {
    console.error("Error adding phone to suppression list:", error)
    return { success: false, error: "An error occurred while adding the phone number" }
  }
}

// Add the missing removePhoneFromSuppressionAction function
export async function removePhoneFromSuppressionAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const phoneNumber = formData.get("phoneNumber") as string

    if (!phoneNumber) {
      return { success: false, error: "No phone number provided" }
    }

    // In a real app, you would remove the phone number from the user's suppression list in the database
    // For this demo, we'll just use the global suppression list
    const list = await getSuppressionList()
    const index = list.indexOf(phoneNumber)
    if (index !== -1) {
      list.splice(index, 1)

      // Update the user's suppression count in the cookie
      const userData = { ...user, suppressionCount: Math.max(0, user.suppressionCount - 1) }
      cookies().set("user_data", JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })
    }

    return {
      success: true,
      message: `Removed ${phoneNumber} from your suppression list`,
    }
  } catch (error) {
    console.error("Error removing phone from suppression list:", error)
    return { success: false, error: "An error occurred while removing the phone number" }
  }
}

// Add the missing getSuppressionListAction function
export async function getSuppressionListAction() {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in.", list: [] }
    }

    // In a real app, you would get the user's suppression list from the database
    // For this demo, we'll just use the global suppression list
    const list = await getSuppressionList()

    return {
      success: true,
      list,
    }
  } catch (error) {
    console.error("Error getting suppression list:", error)
    return { success: false, error: "An error occurred while getting the suppression list", list: [] }
  }
}

// Purchase credits (simulated)
export async function purchaseCreditsAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const packageId = formData.get("packageId") as string
    const credits = Number.parseInt(formData.get("credits") as string, 10)
    const amount = Number.parseFloat(formData.get("amount") as string)
    const paymentMethodId = formData.get("paymentMethodId") as string

    // Validate inputs
    if (!packageId || isNaN(credits) || isNaN(amount) || !paymentMethodId) {
      return { success: false, error: "Invalid input data" }
    }

    // Verify the payment method exists
    const paymentMethodExists = user.paymentMethods?.some((method) => method.id === paymentMethodId)

    if (!paymentMethodExists) {
      return { success: false, error: "Invalid payment method" }
    }

    // Update the user's credits in the cookie
    const userData = { ...user, credits: user.credits + credits }
    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    // For this demo, we'll just return success
    return {
      success: true,
      message: `Successfully purchased ${credits.toLocaleString()} credits for $${amount}`,
    }
  } catch (error) {
    console.error("Error purchasing credits:", error)
    return { success: false, error: "An error occurred while processing your payment" }
  }
}

// Add a payment method for a user
export async function addPaymentMethodAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const last4 = formData.get("last4") as string
    const expiryMonth = formData.get("expiryMonth") as string
    const expiryYear = formData.get("expiryYear") as string
    const cardholderName = formData.get("cardholderName") as string
    const makeDefault = formData.get("makeDefault") === "on"

    if (!last4 || !expiryMonth || !expiryYear || !cardholderName) {
      return { success: false, error: "All fields are required" }
    }

    // Create a new payment method
    const newPaymentMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      type: "card",
      last4,
      expiryMonth,
      expiryYear,
      cardholderName,
      isDefault: makeDefault || !user.paymentMethods || user.paymentMethods.length === 0,
    }

    // Get existing payment methods or initialize empty array
    const existingPaymentMethods = user.paymentMethods || []

    // If this is set as default, update other payment methods
    let updatedPaymentMethods
    if (newPaymentMethod.isDefault) {
      updatedPaymentMethods = existingPaymentMethods.map((method) => ({
        ...method,
        isDefault: false,
      }))
    } else {
      updatedPaymentMethods = [...existingPaymentMethods]
    }

    // Add the new payment method
    updatedPaymentMethods.push(newPaymentMethod)

    // Update the user's payment methods in the cookie
    const userData = {
      ...user,
      paymentMethods: updatedPaymentMethods,
    }

    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      message: "Payment method added successfully",
    }
  } catch (error) {
    console.error("Error adding payment method:", error)
    return { success: false, error: "An error occurred while adding your payment method" }
  }
}

// Remove a payment method
export async function removePaymentMethodAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const paymentMethodId = formData.get("paymentMethodId") as string

    if (!paymentMethodId) {
      return { success: false, error: "Payment method ID is required" }
    }

    // Get existing payment methods
    const existingPaymentMethods = user.paymentMethods || []

    // Find the payment method to remove
    const methodToRemove = existingPaymentMethods.find((method) => method.id === paymentMethodId)

    if (!methodToRemove) {
      return { success: false, error: "Payment method not found" }
    }

    // Check if it's the default and there are other payment methods
    if (methodToRemove.isDefault && existingPaymentMethods.length > 1) {
      return { success: false, error: "Cannot remove default payment method. Set another method as default first." }
    }

    // Remove the payment method
    const updatedPaymentMethods = existingPaymentMethods.filter((method) => method.id !== paymentMethodId)

    // If we removed the only payment method, make sure we don't have any default set
    // If we removed the default and have other methods, set the first one as default
    if (methodToRemove.isDefault && updatedPaymentMethods.length > 0) {
      updatedPaymentMethods[0].isDefault = true
    }

    // Update the user's payment methods in the cookie
    const userData = {
      ...user,
      paymentMethods: updatedPaymentMethods,
    }

    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      message: "Payment method removed successfully",
    }
  } catch (error) {
    console.error("Error removing payment method:", error)
    return { success: false, error: "An error occurred while removing your payment method" }
  }
}

// Set a payment method as default
export async function setDefaultPaymentMethodAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const paymentMethodId = formData.get("paymentMethodId") as string

    if (!paymentMethodId) {
      return { success: false, error: "Payment method ID is required" }
    }

    // Get existing payment methods
    const existingPaymentMethods = user.paymentMethods || []

    // Find the payment method to set as default
    const methodExists = existingPaymentMethods.some((method) => method.id === paymentMethodId)

    if (!methodExists) {
      return { success: false, error: "Payment method not found" }
    }

    // Update all payment methods, setting the selected one as default
    const updatedPaymentMethods = existingPaymentMethods.map((method) => ({
      ...method,
      isDefault: method.id === paymentMethodId,
    }))

    // Update the user's payment methods in the cookie
    const userData = {
      ...user,
      paymentMethods: updatedPaymentMethods,
    }

    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      message: "Default payment method updated successfully",
    }
  } catch (error) {
    console.error("Error setting default payment method:", error)
    return { success: false, error: "An error occurred while updating your default payment method" }
  }
}

// New subscription actions
export async function subscribeAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const planId = formData.get("planId") as string
    const paymentMethodId = formData.get("paymentMethodId") as string

    if (!planId || !paymentMethodId) {
      return { success: false, error: "Plan ID and payment method ID are required" }
    }

    // Get the plan details
    const plan = getSubscriptionPlan(planId)
    if (!plan) {
      return { success: false, error: "Invalid subscription plan" }
    }

    // For paid plans, verify the payment method exists
    if (plan.price > 0) {
      const paymentMethodExists = user.paymentMethods?.some((method) => method.id === paymentMethodId)
      if (!paymentMethodExists) {
        return { success: false, error: "Invalid payment method" }
      }
    }

    // Create a new subscription
    const now = new Date()
    const currentPeriodEnd = new Date()

    // Set the end date based on the billing interval
    if (plan.interval === "monthly") {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    } else if (plan.interval === "yearly") {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    }

    const newSubscription: Subscription = {
      id: `sub_${Date.now()}`,
      planId: plan.id,
      status: "active",
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      monthlyCredits: plan.credits,
      creditsUsedThisPeriod: 0,
    }

    // Update the user's subscription in the cookie
    const userData = {
      ...user,
      subscription: newSubscription,
      // Add the monthly credits to the user's account
      credits: user.credits + plan.credits,
    }

    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      message: `Successfully subscribed to the ${plan.name} plan`,
    }
  } catch (error) {
    console.error("Error subscribing to plan:", error)
    return { success: false, error: "An error occurred while processing your subscription" }
  }
}

export async function cancelSubscriptionAction() {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    // Check if user has an active subscription
    if (!user.subscription || user.subscription.status !== "active") {
      return { success: false, error: "No active subscription found" }
    }

    // Update the subscription to cancel at the end of the period
    const updatedSubscription: Subscription = {
      ...user.subscription,
      cancelAtPeriodEnd: true,
    }

    // Update the user's subscription in the cookie
    const userData = {
      ...user,
      subscription: updatedSubscription,
    }

    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      message: "Your subscription has been canceled and will end at the end of your current billing period",
    }
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return { success: false, error: "An error occurred while canceling your subscription" }
  }
}

// New function to initiate a bank transfer payment
export async function initiateTransferAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    // Get form data
    const bankId = formData.get("bankId") as string
    const packageId = formData.get("packageId") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const credits = Number.parseInt(formData.get("credits") as string)
    const referenceNumber = formData.get("referenceNumber") as string
    const screenshot = formData.get("screenshot") as File

    // Validate inputs
    if (!bankId || !packageId || isNaN(amount) || isNaN(credits) || !referenceNumber || !screenshot) {
      return { success: false, error: "All fields are required" }
    }

    // In a real app, you would:
    // 1. Upload the screenshot to a storage service like AWS S3 or Vercel Blob
    // 2. Store the payment details in a database

    // For this demo, we'll simulate storing the screenshot URL
    const screenshotUrl = "/bank-transfer-receipt.png" // Use the placeholder image

    // Get bank details from our data service
    const banks = getActiveBankAccounts()
    const bank = banks.find((b) => b.id === bankId)
    const bankName = bank?.bankName || "Unknown Bank"

    // Create a new bank transfer payment
    const newPayment: BankTransferPayment = {
      id: `pmt_${Date.now()}`,
      userId: user.id,
      bankId,
      bankName,
      amount,
      credits,
      referenceNumber,
      screenshotUrl,
      status: "pending",
      date: new Date().toISOString(),
      currency: "USD",
    }

    // Add the payment to our data store
    addPayment(newPayment)

    // Get existing pending payments or initialize empty array
    const existingPayments = user.pendingPayments || []

    // Add the new payment
    const updatedPayments = [...existingPayments, newPayment]

    // Update the user's pending payments in the cookie
    const userData = {
      ...user,
      pendingPayments: updatedPayments,
    }

    cookies().set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
      message: "Bank transfer initiated successfully. Your payment is pending verification.",
    }
  } catch (error) {
    console.error("Error initiating bank transfer:", error)
    return { success: false, error: "An error occurred while processing your bank transfer" }
  }
}

// Verify a bank transfer payment (admin function)
export async function verifyBankTransferAction(formData: FormData) {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    const paymentId = formData.get("paymentId") as string
    const action = formData.get("action") as "approve" | "reject"
    const rejectionReason = formData.get("rejectionReason") as string | undefined

    if (!paymentId || !action) {
      return { success: false, error: "Payment ID and action are required" }
    }

    // Update the payment status
    const updatedPayment = updatePaymentStatus(
      paymentId,
      action === "approve" ? "completed" : "rejected",
      action === "reject" ? rejectionReason : undefined,
    )

    if (!updatedPayment) {
      return { success: false, error: "Payment not found" }
    }

    return {
      success: true,
      message:
        action === "approve"
          ? `Payment verified successfully. ${updatedPayment.credits.toLocaleString()} credits added to the account.`
          : "Payment rejected successfully.",
    }
  } catch (error) {
    console.error("Error verifying bank transfer:", error)
    return { success: false, error: "An error occurred while verifying the payment" }
  }
}

// Admin login action
export async function loginAction(formData: FormData) {
  try {
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    // Validate inputs
    if (!username || !password) {
      return { success: false, error: "Username and password are required" }
    }

    // In a real app, you would verify the admin credentials against a database
    // For this demo, we'll use hardcoded credentials
    if (username === "admin" && password === "PhoneScrubber2024!") {
      // Set a cookie to indicate the user is logged in as admin
      cookies().set("auth", "admin", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      })

      return { success: true, redirectTo: "/admin/dashboard" }
    }

    return { success: false, error: "Invalid username or password" }
  } catch (error) {
    console.error("Error logging in:", error)
    return { success: false, error: "An error occurred during login" }
  }
}

// Admin logout action
export async function logoutAction() {
  try {
    cookies().delete("auth")
    return { success: true, redirectTo: "/admin/login" }
  } catch (error) {
    console.error("Error logging out:", error)
    return { success: false, error: "An error occurred during logout" }
  }
}

// Admin reset password action
export async function resetPasswordAction(formData: FormData) {
  try {
    const email = formData.get("email") as string

    // Validate input
    if (!email) {
      return { success: false, error: "Email is required" }
    }

    // In a real app, you would send a password reset email
    // For this demo, we'll just return success
    return {
      success: true,
      message: "If an account exists with that email, we've sent password reset instructions.",
    }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, error: "An error occurred while processing your request" }
  }
}

// Get admin dashboard stats
export async function getAdminStatsAction() {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    // In a real app, you would fetch these stats from a database
    // For this demo, we'll return mock data
    return {
      success: true,
      stats: {
        totalUsers: 156,
        activeSubscriptions: 78,
        pendingPayments: 12,
        totalRevenue: 8750,
        totalCreditsIssued: 15250000,
        totalFilesProcessed: 1245,
        totalNumbersProcessed: 28750000,
      },
    }
  } catch (error) {
    console.error("Error getting admin stats:", error)
    return { success: false, error: "An error occurred while fetching admin stats" }
  }
}

// Get all bank transfers for admin
export async function getAllBankTransfersAction() {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    // Get all pending payments from our data service
    const payments = getAllPendingPayments()

    return { success: true, payments }
  } catch (error) {
    console.error("Error getting bank transfers:", error)
    return { success: false, error: "An error occurred while fetching bank transfers" }
  }
}

// Get credit card payments for admin
export async function getCreditCardPaymentsAction() {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    // In a real app, you would fetch these from a database
    // For this demo, we'll return mock data
    const payments = [
      {
        id: "cc_1",
        transactionId: "txn_123456",
        userId: "user_123",
        amount: 10,
        credits: 20000,
        last4: "4242",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        packageName: "Basic Package",
      },
      {
        id: "cc_2",
        transactionId: "txn_789012",
        userId: "user_456",
        amount: 22,
        credits: 50000,
        last4: "1234",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        packageName: "Standard Package",
      },
      {
        id: "cc_3",
        transactionId: "txn_345678",
        userId: "user_789",
        amount: 40,
        credits: 100000,
        last4: "5678",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        packageName: "Premium Package",
      },
    ]

    return { success: true, payments }
  } catch (error) {
    console.error("Error getting credit card payments:", error)
    return { success: false, error: "An error occurred while fetching credit card payments" }
  }
}

// Get subscriptions for admin
export async function getSubscriptionsAction() {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    // In a real app, you would fetch these from a database
    // For this demo, we'll return mock data
    const subscriptions = [
      {
        id: "sub_1",
        userId: "user_123",
        planId: "starter-monthly",
        planName: "Starter",
        price: 19,
        interval: "monthly",
        status: "active",
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        monthlyCredits: 20000,
        creditsUsedThisPeriod: 5000,
      },
      {
        id: "sub_2",
        userId: "user_456",
        planId: "pro-monthly",
        planName: "Professional",
        price: 49,
        interval: "monthly",
        status: "active",
        currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        monthlyCredits: 100000,
        creditsUsedThisPeriod: 25000,
      },
      {
        id: "sub_3",
        userId: "user_789",
        planId: "business-yearly",
        planName: "Business (Yearly)",
        price: 990,
        interval: "yearly",
        status: "active",
        currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        monthlyCredits: 250000,
        creditsUsedThisPeriod: 50000,
      },
      {
        id: "sub_4",
        userId: "user_012",
        planId: "pro-monthly",
        planName: "Professional",
        price: 49,
        interval: "monthly",
        status: "canceled",
        currentPeriodStart: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: true,
        monthlyCredits: 100000,
        creditsUsedThisPeriod: 75000,
      },
    ]

    return { success: true, subscriptions }
  } catch (error) {
    console.error("Error getting subscriptions:", error)
    return { success: false, error: "An error occurred while fetching subscriptions" }
  }
}

// Adjust user credits (admin function)
export async function adjustUserCreditsAction(formData: FormData) {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    const userId = formData.get("userId") as string
    const credits = Number.parseInt(formData.get("credits") as string, 10)
    const operation = formData.get("operation") as "add" | "subtract"
    const reason = formData.get("reason") as string

    if (!userId || isNaN(credits) || !operation || !reason) {
      return { success: false, error: "All fields are required" }
    }

    // In a real app, you would update the user's credits in the database
    // For this demo, we'll just return success
    return {
      success: true,
      message: `Successfully ${operation === "add" ? "added" : "subtracted"} ${credits.toLocaleString()} credits ${
        operation === "add" ? "to" : "from"
      } user ${userId}.`,
    }
  } catch (error) {
    console.error("Error adjusting user credits:", error)
    return { success: false, error: "An error occurred while adjusting user credits" }
  }
}

// Get DNC lists for admin
export async function getDncListsAction() {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    // Get all DNC lists from our data service
    const lists = getDncListsByType()

    return { success: true, lists }
  } catch (error) {
    console.error("Error getting DNC lists:", error)
    return { success: false, error: "An error occurred while fetching DNC lists" }
  }
}

// Upload DNC list (admin function)
export async function uploadDncListAction(formData: FormData) {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const price = Number(formData.get("price") as string)

    if (!file || !name || !type) {
      return { success: false, error: "Missing required fields" }
    }

    // Create a new DNC list
    const newList = {
      id: `${type}_${Date.now()}`,
      name,
      description: `${name} - Uploaded on ${new Date().toLocaleDateString()}`,
      type: type as "dnc" | "tcpa" | "custom",
      count: Math.floor(Math.random() * 1000000) + 500000,
      lastUpdated: new Date().toISOString(),
      isActive: true,
      costPerCheck: price || (type === "dnc" ? 0.001 : type === "tcpa" ? 0.002 : 0.0005),
      uploadDate: new Date().toISOString(),
      status: "active",
      downloadUrl: "#",
    }

    // Update the list in our data service
    const updatedList = updateDncList(newList.id, newList)

    return {
      success: true,
      message: `Successfully uploaded ${name} to the ${type.toUpperCase()} list.`,
      list: updatedList,
    }
  } catch (error) {
    console.error("Error uploading DNC list:", error)
    return { success: false, error: "An error occurred while uploading the DNC list" }
  }
}

// Delete DNC list (admin function)
export async function deleteDncListAction(formData: FormData) {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    const listId = formData.get("listId") as string

    if (!listId) {
      return { success: false, error: "List ID is required" }
    }

    // Delete the list from our data service
    const success = deleteDncList(listId)

    if (!success) {
      return { success: false, error: "List not found" }
    }

    return {
      success: true,
      message: "List deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting DNC list:", error)
    return { success: false, error: "An error occurred while deleting the DNC list" }
  }
}

// Get banking info for admin
export async function getBankingInfoAction() {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    // Get all bank accounts from our data service
    const bankAccounts = getAllBankAccounts()

    return { success: true, bankAccounts }
  } catch (error) {
    console.error("Error getting banking info:", error)
    return { success: false, error: "An error occurred while fetching banking information" }
  }
}

// Update banking info (admin function)
export async function updateBankingInfoAction(formData: FormData) {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    const bankId = formData.get("bankId") as string
    const bankName = formData.get("bankName") as string
    const accountName = formData.get("accountName") as string
    const accountNumber = formData.get("accountNumber") as string
    const routingNumber = formData.get("routingNumber") as string
    const swiftCode = formData.get("swiftCode") as string
    const bankAddress = formData.get("bankAddress") as string
    const currency = formData.get("currency") as string
    const isActive = formData.get("isActive") === "on"

    if (!bankName || !accountName || !accountNumber || !routingNumber || !currency) {
      return { success: false, error: "Required fields are missing" }
    }

    const bankInfo = {
      id: bankId || `bank_${Date.now()}`,
      bankName,
      accountName,
      accountNumber,
      routingNumber,
      swiftCode,
      bankAddress,
      currency,
      isActive,
    }

    // Update the bank account in our data service
    const updatedBank = updateBankAccount(bankInfo.id, bankInfo)

    return {
      success: true,
      message: `Successfully ${bankId ? "updated" : "added"} bank account.`,
      bankAccount: updatedBank,
    }
  } catch (error) {
    console.error("Error updating banking info:", error)
    return { success: false, error: "An error occurred while updating banking information" }
  }
}

// Delete bank info (admin function)
export async function deleteBankInfoAction(formData: FormData) {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    const bankId = formData.get("bankId") as string

    if (!bankId) {
      return { success: false, error: "Bank ID is required" }
    }

    // Delete the bank account from our data service
    const success = deleteBankAccount(bankId)

    if (!success) {
      return { success: false, error: "Bank account not found" }
    }

    return {
      success: true,
      message: "Bank account deleted successfully.",
    }
  } catch (error) {
    console.error("Error deleting bank info:", error)
    return { success: false, error: "An error occurred while deleting the bank account" }
  }
}

// Get currencies for admin
export async function getCurrenciesAction() {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    // Get all currencies from our data service
    const currencies = getAllCurrencies()

    return { success: true, currencies }
  } catch (error) {
    console.error("Error getting currencies:", error)
    return { success: false, error: "An error occurred while fetching currencies" }
  }
}

// Update currency (admin function)
export async function updateCurrencyAction(formData: FormData) {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    const currencyId = formData.get("currencyId") as string
    const code = formData.get("code") as string
    const name = formData.get("name") as string
    const symbol = formData.get("symbol") as string
    const exchangeRate = Number.parseFloat(formData.get("exchangeRate") as string)
    const isActive = formData.get("isActive") === "on"

    if (!code || !name || !symbol || isNaN(exchangeRate)) {
      return { success: false, error: "Required fields are missing" }
    }

    const currencyInfo = {
      id: currencyId || `currency_${Date.now()}`,
      code,
      name,
      symbol,
      exchangeRate,
      isActive,
    }

    // Update the currency in our data service
    const updatedCurrency = updateCurrency(currencyInfo.id, currencyInfo)

    return {
      success: true,
      message: `Successfully ${currencyId ? "updated" : "added"} currency.`,
      currency: updatedCurrency,
    }
  } catch (error) {
    console.error("Error updating currency:", error)
    return { success: false, error: "An error occurred while updating currency" }
  }
}

// Delete currency (admin function)
export async function deleteCurrencyAction(formData: FormData) {
  try {
    // Check if user is authenticated as admin
    const admin = await getAdminFromCookie()
    if (!admin) {
      return { success: false, error: "Unauthorized. Please log in as admin." }
    }

    const currencyId = formData.get("currencyId") as string

    if (!currencyId) {
      return { success: false, error: "Currency ID is required" }
    }

    // Delete the currency from our data service
    const success = deleteCurrency(currencyId)

    if (!success) {
      return { success: false, error: "Currency not found" }
    }

    return {
      success: true,
      message: "Currency deleted successfully.",
    }
  } catch (error) {
    console.error("Error deleting currency:", error)
    return { success: false, error: "An error occurred while deleting the currency" }
  }
}

// Get user scrub options
export async function getUserScrubOptionsAction() {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    // Get the user's scrub options
    const options = getUserScrubOptions(user.id)

    return { success: true, options }
  } catch (error) {
    console.error("Error getting scrub options:", error)
    return { success: false, error: "An error occurred while fetching scrub options" }
  }
}

// Update user scrub options
export async function updateUserScrubOptionsAction(formData: FormData) {
  try {
    // Check if user is authenticated
    const user = await getUserFromCookieWithData()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const optionsJson = formData.get("options") as string
    if (!optionsJson) {
      return { success: false, error: "No options provided" }
    }

    const options = JSON.parse(optionsJson) as ScrubOptions

    // Update the user's scrub options
    const updatedOptions = updateUserScrubOptions(user.id, options)

    return { success: true, options: updatedOptions }
  } catch (error) {
    console.error("Error updating scrub options:", error)
    return { success: false, error: "An error occurred while updating scrub options" }
  }
}
