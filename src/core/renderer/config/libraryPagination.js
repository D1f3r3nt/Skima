const columns = 4
const rowsPerPage = 5

export const libraryPagination = Object.freeze({
  columns,
  rowsPerPage,
  pageSize: columns * rowsPerPage
})
