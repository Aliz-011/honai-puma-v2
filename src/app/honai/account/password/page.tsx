import { Separator } from '@/components/ui/separator'
import { PasswordForm } from '../_components/password-form'


export default function RouteComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Password</h3>
        <p className="text-sm text-muted-foreground">
          Update your password to keep your account secure.
        </p>
      </div>
      <Separator />
      <PasswordForm />
    </div>
  )
}
