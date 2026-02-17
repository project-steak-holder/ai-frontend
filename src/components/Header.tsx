import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="flex h-16 w-full items-center border-b bg-background px-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">AI Chat</h1>
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <Button variant="outline" size="sm">
          Settings
        </Button>
      </div>
    </header>
  )
}
