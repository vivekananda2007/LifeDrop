export function queryCollection(items, query, allowedFilters) {
  const q = String(query.q || "").trim().toLocaleLowerCase("en-IN");
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 25));

  const filtered = items.filter((item) => {
    if (q && !String(item.name || "").toLocaleLowerCase("en-IN").includes(q)) {
      return false;
    }

    return allowedFilters.every((filter) => {
      if (query[filter] === undefined || query[filter] === "") return true;
      return String(item[filter] ?? "") === String(query[filter]);
    });
  });

  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      pages: Math.ceil(filtered.length / limit)
    }
  };
}
