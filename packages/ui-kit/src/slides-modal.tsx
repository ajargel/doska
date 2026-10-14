import { Button } from "./button"
import { cn } from "./lib/cn"
import { Markdown } from "./markdown"
import { Modal, ModalContent, ModalHeader } from "./modal"
import { useState } from "react"

interface IProps {
  slides: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SlidesModal({ slides, open, onOpenChange }: IProps) {
  const [index, setIndex] = useState(0)
  const isFirst = index === 0
  const isLast = index === slides.length - 1

  function close() {
    onOpenChange(false)
    setIndex(0)
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <ModalContent className="md:max-w-lg">
        <ModalHeader onClose={close} />
        <div className="min-h-64 flex-1 overflow-y-auto px-6 py-2">
          <Markdown>{slides[index]}</Markdown>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div className="flex items-center gap-1.5 pl-3">
            {slides.map((slide, dot) => (
              <button
                key={slide}
                type="button"
                aria-label={`Slide ${dot + 1}`}
                onClick={() => setIndex(dot)}
                className={cn(
                  "size-1.5 rounded-full bg-muted-foreground/30 transition-colors",
                  dot === index && "bg-foreground"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIndex(index - 1)}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => (isLast ? close() : setIndex(index + 1))}
            >
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
