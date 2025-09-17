export function ClipboardIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M18 5V2.4C18 1.08 16.92 0 15.6 0H8.4C7.08 0 6 1.08 6 2.4V5C4.35 5 3 6.35 3 8V20C3 21.65 4.35 23 6 23H18C19.65 23 21 21.65 21 20V8C21 6.35 19.65 5 18 5ZM8.4 2.4H15.6V5H8.4V2.4ZM18 20H6V8H18V20Z" />
    </svg>
  )
}
