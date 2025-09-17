"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Member } from "@/types"

interface SearchableMemberSelectProps {
  members: Member[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SearchableMemberSelect({
  members,
  value,
  onChange,
  placeholder = "Sélectionner un membre",
  disabled = false,
}: SearchableMemberSelectProps) {
  const [open, setOpen] = useState(false)

  // Sort members alphabetically by name
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))

  const selectedMember = members.find((member) => member.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !value && "text-muted-foreground")}
          disabled={disabled}
        >
          {value && selectedMember ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                <AvatarFallback>{selectedMember.initials}</AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedMember.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 shadow-md border border-gray-200">
        <Command>
          <CommandInput placeholder="Rechercher un membre..." className="border-none focus:ring-0 bg-transparent" />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-2 px-3 text-sm text-gray-500">Aucun membre trouvé.</CommandEmpty>
            <CommandGroup>
              {sortedMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.name}
                  onSelect={() => {
                    onChange(member.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
                >
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{member.name}</span>
                  <Check className={cn("ml-auto h-4 w-4", value === member.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
