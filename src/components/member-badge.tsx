"use client"

import type { Member } from "@/types"
import { useState } from "react"

interface MemberBadgeProps {
  member: Member
  className?: string
  size?: "sm" | "md" | "lg"
}

export function MemberBadge({ member, className = "", size = "md" }: MemberBadgeProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  const avatarSizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  return (
    <div
      className={`flex items-center bg-indigo-50 px-3 py-2 rounded print:member-badge ${sizeClasses[size]} ${className}`}
    >
      <div
        className={`${avatarSizeClasses[size]} rounded-full bg-indigo-200 flex items-center justify-center mr-3 overflow-hidden print:member-avatar`}
      >
        {!imageError && member.avatar && member.avatar !== "/placeholder.svg" ? (
          <img
            src={member.avatar || "/placeholder.svg"}
            alt={member.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-indigo-800">
            {member.initials}
          </div>
        )}
      </div>
      <span className="text-gray-700 font-medium">{member.name}</span>
    </div>
  )
}
