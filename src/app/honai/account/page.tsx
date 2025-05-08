import { Separator } from '@/components/ui/separator'
import { AccountForm } from './_components/account-form'

export default function RouteComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <AccountForm />
    </div>
  )
}
