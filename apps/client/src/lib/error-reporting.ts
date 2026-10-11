import { createElement } from "react"
import { toast } from "react-hot-toast"
import {
  errorMessage,
  isNetworkError,
  isOfflineAcknowledged,
  isUnauthorized,
  reportError,
  setErrorReporter,
} from "@doska/core"
import { ErrorToast } from "@/components/toasts/error/error-toast"

// One id for every failure
const TOAST_ID = "error"

/**
 * Failures outside a render
 */
export function initErrorReporting(): void {
  setErrorReporter((error) => {
    console.error(error)
    if (isOfflineAcknowledged() && isNetworkError(error)) return
    if (isUnauthorized(error)) return
    toast.custom(
      (toastInstance) =>
        createElement(ErrorToast, {
          visible: toastInstance.visible,
          message: errorMessage(error),
        }),
      { id: TOAST_ID }
    )
  })

  window.addEventListener("unhandledrejection", (event) =>
    reportError(event.reason)
  )

  window.addEventListener("error", (event) =>
    reportError(event.error ?? event.message)
  )
}
