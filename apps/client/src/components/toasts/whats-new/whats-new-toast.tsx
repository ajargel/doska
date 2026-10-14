import { toast } from "react-hot-toast"
import { useEffect, useState } from "react"
import { WhatsNewModal } from "../../whats-new/whats-new-modal"
import { WhatsNewToastContent } from "./whats-new-toast-content"

const TOAST_ID = "whats-new"

export function WhatsNewToast() {
  const [open, setOpen] = useState(false)

  // TODO: show only when the version went up since the last launch
  useEffect(() => {
    toast.custom(
      (toastInstance) => (
        <WhatsNewToastContent
          visible={toastInstance.visible}
          onOpen={() => {
            toast.dismiss(TOAST_ID)
            setOpen(true)
          }}
          onDismiss={() => toast.dismiss(TOAST_ID)}
        />
      ),
      { duration: Infinity, id: TOAST_ID }
    )
  }, [])

  return <WhatsNewModal open={open} onOpenChange={setOpen} />
}
