import type { User, BankAccount, Currency, DncList, ScrubOptions, Payment, BankTransferPayment } from "./types"
import { cookies } from "next/headers"

// Mock data for development
const users: User[] = [
  {
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
    credits: 5000,
    suppressionCount: 1250,
    filesProcessed: 12,
    numbersProcessed: 25000,
    numbersRemoved: 3450,
    creditsUsed: 28450,
    preferredCurrency: "USD",
    paymentMethods: [
      {
        id: "pm_1",
        type: "card",
        last4: "4242",
        expiryMonth: "12",
        expiryYear: "2025",
        cardholderName: "John Doe",
        isDefault: true,
      },
    ],
    pendingPayments: [],
    scrubOptions: {
      removeDuplicates: true,
      checkAgainstUserList: true,
      checkAgainstDNC: false,
      checkAgainstTCPA: false,
    },
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane@example.com",
    credits: 2500,
    suppressionCount: 750,
    filesProcessed: 8,
    numbersProcessed: 15000,
    numbersRemoved: 2100,
    creditsUsed: 17100,
    preferredCurrency: "USD",
    paymentMethods: [],
    pendingPayments: [],
    scrubOptions: {
      removeDuplicates: true,
      checkAgainstUserList: true,
      checkAgainstDNC: true,
      checkAgainstTCPA: false,
    },
  },
]

let bankAccounts: BankAccount[] = [
  {
    id: "bank1",
    bankName: "First National Bank",
    accountName: "Phone Scrubber Inc",
    accountNumber: "1234567890",
    routingNumber: "987654321",
    swiftCode: "FNBUS123",
    bankAddress: "123 Banking St, Finance City, FC 12345",
    currency: "USD",
    isActive: true,
  },
  {
    id: "bank2",
    bankName: "Global Banking Corp",
    accountName: "Phone Scrubber International",
    accountNumber: "0987654321",
    routingNumber: "123456789",
    swiftCode: "GBCINT456",
    bankAddress: "456 Global Ave, World City, WC 54321",
    currency: "EUR",
    isActive: true,
  },
]

let currencies: Currency[] = [
  {
    id: "currency1",
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    exchangeRate: 1.0,
    isActive: true,
  },
  {
    id: "currency2",
    code: "EUR",
    name: "Euro",
    symbol: "€",
    exchangeRate: 0.85,
    isActive: true,
  },
  {
    id: "currency3",
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    exchangeRate: 0.75,
    isActive: true,
  },
]

let dncLists: DncList[] = [
  {
    id: "dnc1",
    name: "Federal DNC List",
    description: "Official Federal Do Not Call Registry",
    type: "dnc",
    count: 235000000,
    lastUpdated: "2023-05-01",
    isActive: true,
    costPerCheck: 0.001,
    uploadDate: "2023-05-01",
    status: "active",
    downloadUrl: "#",
  },
  {
    id: "tcpa1",
    name: "TCPA Litigator List",
    description: "List of known TCPA litigators and attorneys",
    type: "tcpa",
    count: 150000,
    lastUpdated: "2023-05-05",
    isActive: true,
    costPerCheck: 0.002,
    uploadDate: "2023-05-05",
    status: "active",
    downloadUrl: "#",
  },
  {
    id: "custom1",
    name: "Industry Blacklist",
    description: "Shared industry blacklist for known scammers",
    type: "custom",
    count: 500000,
    lastUpdated: "2023-04-15",
    isActive: true,
    costPerCheck: 0.0005,
    uploadDate: "2023-04-15",
    status: "active",
    downloadUrl: "#",
  },
]

let pendingPayments: BankTransferPayment[] = [
  {
    id: "pmt_1",
    userId: "user1",
    userName: "John Doe",
    userEmail: "john@example.com",
    bankId: "bank1",
    bankName: "First National Bank",
    amount: 50,
    credits: 50000,
    referenceNumber: "BT12345",
    screenshotUrl: "/bank-transfer-receipt.png",
    status: "pending",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    currency: "USD",
  },
  {
    id: "pmt_2",
    userId: "user2",
    userName: "Jane Smith",
    userEmail: "jane@example.com",
    bankId: "bank1",
    bankName: "First National Bank",
    amount: 25,
    credits: 25000,
    referenceNumber: "BT67890",
    screenshotUrl: "/bank-transfer-receipt.png",
    status: "pending",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    currency: "USD",
  },
]

// Authentication functions
export async function getUserFromCookie(): Promise<string | null> {
  const cookieStore = cookies()
  const auth = cookieStore.get("user_auth")
  return auth?.value || null
}

export async function getAdminFromCookie(): Promise<string | null> {
  const cookieStore = cookies()
  const auth = cookieStore.get("auth")
  return auth?.value === "admin" ? "admin" : null
}

export async function checkAuth(): Promise<void> {
  const admin = await getAdminFromCookie()
  if (!admin) {
    throw new Error("Unauthorized")
  }
}

// Data access functions
export async function getUserFromCookieWithData(): Promise<User | null> {
  const cookieStore = cookies()
  const userData = cookieStore.get("user_data")

  if (userData?.value) {
    try {
      return JSON.parse(userData.value) as User
    } catch (error) {
      console.error("Error parsing user data:", error)
    }
  }

  // If no user data in cookie, return the first user for demo purposes
  return users[0]
}

export function getActiveBankAccounts(): BankAccount[] {
  return bankAccounts.filter((bank) => bank.isActive)
}

export function getAllBankAccounts(): BankAccount[] {
  return bankAccounts
}

export function getActiveDncLists(): DncList[] {
  return dncLists.filter((list) => list.isActive)
}

export function getAllDncLists(): DncList[] {
  return dncLists
}

export function getDncListsByType(): { dnc: DncList[]; tcpa: DncList[]; custom: DncList[] } {
  return {
    dnc: dncLists.filter((list) => list.type === "dnc"),
    tcpa: dncLists.filter((list) => list.type === "tcpa"),
    custom: dncLists.filter((list) => list.type === "custom"),
  }
}

export function updateDncList(listId: string, data: Partial<DncList>): DncList {
  const index = dncLists.findIndex((list) => list.id === listId)

  if (index === -1) {
    // If list doesn't exist, create a new one
    const newList = { ...data } as DncList
    dncLists.push(newList)
    return newList
  }

  // Update existing list
  dncLists[index] = { ...dncLists[index], ...data }
  return dncLists[index]
}

export function deleteDncList(listId: string): boolean {
  const initialLength = dncLists.length
  dncLists = dncLists.filter((list) => list.id !== listId)
  return dncLists.length < initialLength
}

export function updateBankAccount(bankId: string, data: Partial<BankAccount>): BankAccount {
  const index = bankAccounts.findIndex((bank) => bank.id === bankId)

  if (index === -1) {
    // If bank account doesn't exist, create a new one
    const newBankAccount = { ...data } as BankAccount
    bankAccounts.push(newBankAccount)
    return newBankAccount
  }

  // Update existing bank account
  bankAccounts[index] = { ...bankAccounts[index], ...data }
  return bankAccounts[index]
}

export function deleteBankAccount(bankId: string): boolean {
  const initialLength = bankAccounts.length
  bankAccounts = bankAccounts.filter((bank) => bank.id !== bankId)
  return bankAccounts.length < initialLength
}

export function getActiveCurrencies(): Currency[] {
  return currencies.filter((currency) => currency.isActive)
}

export function getAllCurrencies(): Currency[] {
  return currencies
}

export function updateCurrency(currencyId: string, data: Partial<Currency>): Currency {
  const index = currencies.findIndex((currency) => currency.id === currencyId)

  if (index === -1) {
    // If currency doesn't exist, create a new one
    const newCurrency = { ...data } as Currency
    currencies.push(newCurrency)
    return newCurrency
  }

  // Update existing currency
  currencies[index] = { ...currencies[index], ...data }
  return currencies[index]
}

export function deleteCurrency(currencyId: string): boolean {
  const initialLength = currencies.length
  currencies = currencies.filter((currency) => currency.id !== currencyId)
  return currencies.length < initialLength
}

export function getUserPendingPayments(userId: string): Payment[] {
  const user = users.find((u) => u.id === userId)
  return user?.pendingPayments || []
}

export function getAllPendingPayments(): BankTransferPayment[] {
  return pendingPayments
}

export function getUserScrubOptions(userId: string): ScrubOptions {
  const user = users.find((u) => u.id === userId)

  // Default options if user not found or has no options set
  if (!user || !user.scrubOptions) {
    return {
      removeDuplicates: true,
      checkAgainstUserList: true,
      checkAgainstDNC: false,
      checkAgainstTCPA: false,
    }
  }

  return user.scrubOptions
}

export function updateUserScrubOptions(userId: string, options: Partial<ScrubOptions>): ScrubOptions {
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) throw new Error("User not found")

  // Initialize scrubOptions if it doesn't exist
  if (!users[userIndex].scrubOptions) {
    users[userIndex].scrubOptions = {
      removeDuplicates: true,
      checkAgainstUserList: true,
      checkAgainstDNC: false,
      checkAgainstTCPA: false,
    }
  }

  // Update with new options
  users[userIndex].scrubOptions = {
    ...users[userIndex].scrubOptions,
    ...options,
  }

  return users[userIndex].scrubOptions
}

export function addPayment(payment: BankTransferPayment): BankTransferPayment {
  // Add to global pending payments
  pendingPayments.push(payment)

  // Also add to user's pending payments if needed
  const userIndex = users.findIndex((u) => u.id === payment.userId)
  if (userIndex !== -1) {
    if (!users[userIndex].pendingPayments) {
      users[userIndex].pendingPayments = []
    }
    users[userIndex].pendingPayments.push(payment)
  }

  return payment
}

export function updatePaymentStatus(
  paymentId: string,
  status: "pending" | "completed" | "rejected",
  rejectionReason?: string,
): BankTransferPayment | null {
  // Update in global pending payments
  const paymentIndex = pendingPayments.findIndex((p) => p.id === paymentId)

  if (paymentIndex === -1) return null

  pendingPayments[paymentIndex].status = status
  if (rejectionReason) {
    pendingPayments[paymentIndex].rejectionReason = rejectionReason
  }

  // If payment is completed, add credits to user
  if (status === "completed") {
    const userIndex = users.findIndex((u) => u.id === pendingPayments[paymentIndex].userId)
    if (userIndex !== -1) {
      users[userIndex].credits += pendingPayments[paymentIndex].credits
    }
  }

  // Also update in user's pending payments
  for (const user of users) {
    if (!user.pendingPayments) continue

    const userPaymentIndex = user.pendingPayments.findIndex((p) => p.id === paymentId)
    if (userPaymentIndex !== -1) {
      user.pendingPayments[userPaymentIndex].status = status
      if (rejectionReason) {
        user.pendingPayments[userPaymentIndex].rejectionReason = rejectionReason
      }
    }
  }

  // If approved or rejected, remove from pending payments
  if (status === "completed" || status === "rejected") {
    pendingPayments = pendingPayments.filter((p) => p.id !== paymentId)
  }

  return pendingPayments[paymentIndex]
}
