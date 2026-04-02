// usePagination.js
// Wraps Spring Page response: { content, totalElements, totalPages, number, size }
//
// Usage:
//   const { items, page, pageSize, totalPages, totalItems,
//           setPage, setPageSize, loading, reload } = usePagination(fetchFn);
//
// fetchFn must accept (page, size) and return a Spring Page response.

import { useState, useEffect, useCallback } from "react";

export default function usePagination(fetchFn, initialSize = 10) {
  const [page,       setPage]       = useState(0);
  const [pageSize,   setPageSize]   = useState(initialSize);
  const [items,      setItems]      = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchFn(page, pageSize)
      .then(res => {
        const data = res.data;
        // Support both Spring Page wrapper and plain arrays
        if (data && typeof data === "object" && "content" in data) {
          setItems(data.content ?? []);
          setTotalPages(data.totalPages ?? 1);
          setTotalItems(data.totalElements ?? 0);
        } else {
          // Fallback: plain array (no pagination from backend yet)
          const arr = Array.isArray(data) ? data : [];
          setItems(arr);
          setTotalPages(1);
          setTotalItems(arr.length);
        }
      })
      .catch(err => console.error("Pagination fetch error:", err))
      .finally(() => setLoading(false));
  }, [fetchFn, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  return {
    items, page, pageSize, totalPages, totalItems,
    loading,
    setPage,
    setPageSize: (s) => { setPageSize(s); setPage(0); },
    reload: load,
  };
}