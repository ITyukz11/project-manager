export const avoidDefaultDomBehavior = (e: Event) => {
  e.preventDefault();
};

export const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === "Escape" || event.keyCode === 27) {
    event.stopPropagation();
  }
};

// Prevent dialog from closing when clicking or interacting outside
export const preventDialogCloseProps = {
  onPointerDownOutside: (e: Event) => e.preventDefault(),
  onInteractOutside: (e: Event) => e.preventDefault(),
};
