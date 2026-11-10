export const getInitialCount = ({ total, pageSize, requestedCount = pageSize }) =>
  Math.min(total, Math.max(pageSize, Number.isInteger(requestedCount) ? requestedCount : pageSize))

export const getNextCount = ({ renderedCount, total, pageSize }) => Math.min(total, renderedCount + pageSize)

export const hasMoreItems = ({ renderedCount, total }) => renderedCount < total

export const shouldShowEndMessage = ({ renderedCount, total, pageSize, isAppending }) =>
  !isAppending && renderedCount >= total && total > pageSize
