import { forwardRef, useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type FieldProps = React.ComponentProps<typeof Input> & {
  label: string
  hint?: string
}

/**
 * A labelled text input built from the shadcn Input + Label primitives. Keeps
 * the label/hint composition co-located so forms stay declarative.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, id, className, ...props },
  ref,
) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} ref={ref} className={cn('h-11', className)} {...props} />
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
})
