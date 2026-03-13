import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
        <input
          ref={ref}
          {...props}
          className={cn(
            'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800 placeholder-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400',
            'disabled:bg-slate-50 disabled:text-slate-500',
            error ? 'border-red-400' : 'border-slate-200',
            className
          )}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
        <select
          ref={ref}
          {...props}
          className={cn(
            'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800',
            'focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400',
            error ? 'border-red-400' : 'border-slate-200',
            className
          )}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
        <textarea
          ref={ref}
          {...props}
          className={cn(
            'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800 placeholder-slate-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400',
            error ? 'border-red-400' : 'border-slate-200',
            className
          )}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
