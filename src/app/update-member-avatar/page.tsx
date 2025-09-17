"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { getMembers, updateMember } from "@/services/firebase-service"
import { SearchableMemberSelect } from "@/components/searchable-member-select"
import type { Member } from "@/types"

export default function UpdateMemberAvatarPage() {
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Load members on component mount
  useEffect(() => {
    const loadMembers = async () => {
      setLoadingMembers(true)
      try {
        const membersData = await getMembers()
        setMembers(membersData)
      } catch (error) {
        console.error("Error loading members:", error)
      } finally {
        setLoadingMembers(false)
      }
    }

    loadMembers()
  }, [])

  // Update preview when member or URL changes
  useEffect(() => {
    if (selectedMemberId && avatarUrl) {
      setPreviewUrl(avatarUrl)
    } else if (selectedMemberId) {
      const member = members.find((m) => m.id === selectedMemberId)
      if (member && member.avatar && member.avatar !== "/placeholder.svg") {
        setPreviewUrl(member.avatar)
      } else {
        setPreviewUrl(null)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [selectedMemberId, avatarUrl, members])

  const handleMemberChange = (memberId: string) => {
    setSelectedMemberId(memberId)
    const member = members.find((m) => m.id === memberId)
    if (member && member.avatar && member.avatar !== "/placeholder.svg") {
      setAvatarUrl(member.avatar)
    } else {
      setAvatarUrl("")
    }
  }

  const handleUpdate = async () => {
    if (!selectedMemberId || !avatarUrl.trim()) {
      setResult({
        success: false,
        message: "Please select a member and enter an avatar URL",
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)

      // Update the member with the new avatar URL
      await updateMember(selectedMemberId, { avatar: avatarUrl })

      setResult({
        success: true,
        message: "Avatar URL updated successfully!",
      })
    } catch (error) {
      console.error("Update error:", error)
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Update Member Avatar</h1>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Update Avatar URL</CardTitle>
          <CardDescription>Enter a direct URL to an image to use as the member's avatar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Member</label>
            {loadingMembers ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading members...
              </div>
            ) : (
              <SearchableMemberSelect
                members={members}
                value={selectedMemberId}
                onChange={handleMemberChange}
                placeholder="Select a member"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Avatar URL</label>
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">Enter a direct URL to an image (JPG, PNG, etc.)</p>
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-200">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=96&width=96"
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button
            onClick={handleUpdate}
            disabled={loading || !selectedMemberId || !avatarUrl.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Avatar"
            )}
          </Button>

          {result && (
            <div
              className={`p-3 rounded w-full ${
                result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {result.success ? (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {result.message}
                </div>
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {result.message}
                </div>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      <div className="mt-8 text-center">
        <a href="/" className="text-blue-600 hover:underline">
          Back to Home
        </a>
      </div>
    </div>
  )
}
