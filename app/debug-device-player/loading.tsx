import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading debug tools...</span>
      </div>
    </div>
  )
}
