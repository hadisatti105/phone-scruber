import { cookies } from "next/headers"
import type { User } from "./types"

// Get user from cookie
export async function getUserFromCookie(): Promise<User | null> {
  const userDataCookie = cookies().get("user_data")
  if (!userDataCookie) return null

  try {
    const userData = JSON.parse(userDataCookie.value)
    return userData
  } catch (error) {
    console.error("Error parsing user data:", error)
    return null
  }
}

// Get admin from cookie
export async function getAdminFromCookie() {
  const authCookie = cookies().get("auth")

  if (!authCookie || authCookie.value !== "admin") {
    return null
  }

  return {
    id: "admin",
    name: "Admin User",
    role: "admin",
  }
}

// Check admin authentication
export async function checkAuth() {
  const admin = await getAdminFromCookie()

  if (!admin) {
    // In server components, we need to throw a redirect
    // This will be caught by Next.js and redirected
    throw new Response("Unauthorized", {
      status: 401,
      headers: {
        Location: "/admin/login",
      },
    })
  }

  return admin
}
