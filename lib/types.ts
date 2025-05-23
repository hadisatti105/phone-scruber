export interface User {
  id: string
  name: string
  email: string
  credits: number
  suppressionCount: number
  filesProcessed: number
  numbersProcessed: number
  numbersRemoved: number
  creditsUsed: number
  preferredCurrency: string
  subscription?: Subscription
  paymentMethods?: PaymentMethod[]
  pendingPayments?: Payment[]
  scrubOptions?: ScrubOptions
}

export interface Subscription {
  id: string
  planId: string
  status: "active" | "canceled" | "past_due"
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  monthlyCredits: number
  creditsUsedThisPeriod: number
}

export interface PaymentMethod {
  id: string
  type: "card" | "bank_account"
  last4: string
  expiryMonth: string
  expiryYear: string
  cardholderName: string
  isDefault: boolean
}

export interface Payment {
  id: string
  userId: string
  amount: number
  date: string
  status: "pending" | "completed" | "rejected"
  method: "credit_card" | "bank_transfer"
  description: string
  referenceNumber?: string
  bankId?: string
  rejectionReason?: string
  userName?: string
  userEmail?: string
}

export interface BankTransferPayment {
  id: string
  userId: string
  bankId: string
  bankName: string
  amount: number
  credits: number
  referenceNumber: string
  screenshotUrl: string
  status: "pending" | "completed" | "rejected"
  date: string
  currency: string
  rejectionReason?: string
  userName?: string
  userEmail?: string
}

export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  routingNumber: string
  swiftCode?: string
  bankAddress?: string
  currency: string
  isActive: boolean
}

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  exchangeRate: number
  isActive: boolean
}

export interface DncList {
  id: string
  name: string
  description: string
  type: "dnc" | "tcpa" | "custom"
  count: number
  lastUpdated: string
  isActive: boolean
  costPerCheck: number
  uploadDate: string
  status: string
  downloadUrl: string
}

export interface ScrubOptions {
  removeDuplicates: boolean
  checkAgainstUserList: boolean
  checkAgainstDNC: boolean
  checkAgainstTCPA: boolean
}
