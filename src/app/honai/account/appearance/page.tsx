import { Metadata } from 'next'

import { Separator } from '@/components/ui/separator'
import { AppearanceForm } from '../_components/appearance-form'

export const metadata: Metadata = {
  title: 'Appearance | Honai Puma'
}

export default function RouteComponent() {

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the app. Automatically switch between day
          and night themes.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>)
}
