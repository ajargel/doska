import { Button } from "@doska/ui-kit"
import { CircleHelp } from "lucide-react"
import { useState } from "react"
import { CardHelpModal } from "./card-help-modal"

export function CardHelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <CircleHelp />
        Shortcuts
      </Button>
      <CardHelpModal open={open} onOpenChange={setOpen} />
    </>
  )
}
