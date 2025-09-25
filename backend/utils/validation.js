// Validation helpers for pagination & sorting
function sanitizePagination(pageRaw, limitRaw, { maxLimit = 100 } = {}) {
  let page = parseInt(pageRaw, 10); if (isNaN(page) || page < 1) page = 1;
  let limit = parseInt(limitRaw, 10); if (isNaN(limit) || limit < 1) limit = 20; if (limit > maxLimit) limit = maxLimit;
  return { page, limit, skip: (page - 1) * limit };
}

function validateSort(sortBy, order, allowedFields, defaultField = 'createdAt') {
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const dir = ['asc','desc'].includes(order) ? order : 'desc';
  return { field, dir };
}

module.exports = { sanitizePagination, validateSort };
