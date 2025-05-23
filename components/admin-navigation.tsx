"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CreditCard, PhoneOff, Building, DollarSign, Settings } from "lucide-react"

export default function AdminNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: "DNC Lists",
      href: "/admin/dnc-lists",
      icon: <PhoneOff className="h-5 w-5" />,
    },
    {
      name: "Banking Info",
      href: "/admin/banking",
      icon: <Building className="h-5 w-5" />,
    },
    {
      name: "Currencies",
      href: "/admin/currencies",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <nav className="border-b pb-2">
      <div className="flex overflow-x-auto space-x-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-2 rounded-md whitespace-nowrap ${
              pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {item.icon}
            <span className="ml-2">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
