"use client"

import { useState, useEffect } from "react"
import { User, CreditCard, Bell, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  company?: string
  plan: string
  createdAt: string
  companyAddress?: string
  companyPhone?: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState({
    screenOffline: true,
    playlistUpdates: true,
    billingAlerts: true,
    systemMaintenance: false,
  })

  const [companyData, setCompanyData] = useState({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
  })
  const [companySaving, setCompanySaving] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        setCompanyData({
          companyName: data.user.company || "",
          companyAddress: data.user.companyAddress || "",
          companyPhone: data.user.companyPhone || "",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case "monthly":
        return "Monthly Plan"
      case "annual":
        return "Annual Plan"
      case "free":
        return "Free Plan"
      default:
        return "Unknown Plan"
    }
  }

  const saveCompanyInfo = async () => {
    if (!companyData.companyName.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive",
      })
      return
    }

    setCompanySaving(true)

    try {
      const response = await fetch("/api/user/company", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Company information updated successfully",
        })
        // Update user state with new company info
        if (user) {
          setUser({
            ...user,
            company: data.data.companyName,
            companyAddress: data.data.companyAddress,
            companyPhone: data.data.companyPhone,
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update company information",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save company info:", error)
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      })
    } finally {
      setCompanySaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600">Loading your account settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600">Failed to load user data</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user.firstName || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user.lastName || ""} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" defaultValue={user.company || ""} placeholder="Enter your company name" />
                </div>
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <Input value={formatDate(user.createdAt)} disabled />
                </div>
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input value={user.id} disabled className="font-mono text-xs" />
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Subscription & Billing
                </CardTitle>
                <CardDescription>Manage your subscription and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Current Plan</h3>
                    <p className="text-sm text-gray-600">{getPlanDisplayName(user.plan)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">$180/month</div>
                    <div className="text-sm text-gray-600">12 screens × $15</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Account Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Account Holder</span>
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email</span>
                      <span>{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plan Type</span>
                      <span>{getPlanDisplayName(user.plan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Member Since</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Screen Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Active Screens</span>
                      <span>12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Cost per Screen</span>
                      <span>$15</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Monthly Cost</span>
                      <span>$180</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline">Switch to Annual</Button>
                  <Button variant="outline">Download Invoice</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Screen Offline Alerts</Label>
                      <p className="text-sm text-gray-600">Get notified when a screen goes offline</p>
                    </div>
                    <Switch
                      checked={notifications.screenOffline}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, screenOffline: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Playlist Updates</Label>
                      <p className="text-sm text-gray-600">Notifications about playlist changes</p>
                    </div>
                    <Switch
                      checked={notifications.playlistUpdates}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, playlistUpdates: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Billing Alerts</Label>
                      <p className="text-sm text-gray-600">Payment and billing notifications</p>
                    </div>
                    <Switch
                      checked={notifications.billingAlerts}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, billingAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Maintenance</Label>
                      <p className="text-sm text-gray-600">Scheduled maintenance notifications</p>
                    </div>
                    <Switch
                      checked={notifications.systemMaintenance}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, systemMaintenance: checked }))
                      }
                    />
                  </div>
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>Manage your company information and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData((prev) => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter company name"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Address</Label>
                  <Input
                    id="companyAddress"
                    value={companyData.companyAddress}
                    onChange={(e) => setCompanyData((prev) => ({ ...prev, companyAddress: e.target.value }))}
                    placeholder="123 Business St, City, State 12345"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    value={companyData.companyPhone}
                    onChange={(e) => setCompanyData((prev) => ({ ...prev, companyPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    maxLength={20}
                  />
                </div>
                <Button onClick={saveCompanyInfo} disabled={companySaving}>
                  {companySaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Company Info
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
