const pendingWorkItems = new Set()

export const registerPendingWork = ({ hasPending, flush }) => {
  const item = { hasPending, flush }
  pendingWorkItems.add(item)
  return () => pendingWorkItems.delete(item)
}

export const hasPendingWork = () => [...pendingWorkItems].some((item) => item.hasPending())

export const flushPendingWork = async () => {
  await Promise.all([...pendingWorkItems].map((item) => item.flush()))
}
