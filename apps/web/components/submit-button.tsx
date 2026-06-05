import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SubmitButton({
  children,
  pending,
  pendingLabel,
}: {
  children: React.ReactNode
  pending?: boolean
  pendingLabel?: string
}) {
  return (
    <Button type="submit" disabled={pending} size="lg" className="h-11 w-full">
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
