'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { AddToCartButton } from '../cart-ui';
import DishCard from './DishCard';

const PAGE_SIZE = 3;
const DEBOUNCE_MS = 300;

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// Search box with live, paged results from /api/dishes.
// `children` is the normal server-rendered menu; it is shown whenever the box is
// empty (same pattern as FilterShell: the list is passed in, never imported).
export default function SearchBox({ children }) {
  const [input, setInput] = useState('');
  const [pageState, setPageState] = useState({ term: '', n: 1 });

  // 1. Debounce: the key only changes 300 ms after the last keystroke.
  const debounced = useDebounced(input.trim(), DEBOUNCE_MS);
  // Clearing the box takes effect immediately; don't wait out the debounce.
  const term = input.trim() === '' ? '' : debounced;
  // 2. The page belongs to a term: a new term is always page 1.
  const page = pageState.term === term ? pageState.n : 1;

  // 3. Null key = no request. Empty term means "show the normal menu".
  const key = term
    ? `/api/dishes?${new URLSearchParams({ q: term, page: String(page), pageSize: String(PAGE_SIZE) })}`
    : null;

  const { data, error, isValidating } = useSWR(key, fetcher, {
    // 4. Keep showing the previous result while the next key loads (no flash).
    keepPreviousData: true,
    // Menu data changes rarely: reuse an identical request for 30 s, and don't
    // refetch just because the tab regained focus.
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
  });

  const searching = input.trim() !== '';

  return (
    <div>
      <input
        type="search"
        name="q"
        id="dish-search"
        className="search-input"
        placeholder="Search dishes…"
        aria-label="Search dishes"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {!searching && children}

      {searching && (
        <div className={isValidating ? 'results is-updating' : 'results'} aria-live="polite" aria-busy={isValidating}>
          {error && <p className="field-error">Search failed. Try again.</p>}
          {!data && !error && <p className="muted">Searching…</p>}
          {data && data.total === 0 && <p className="empty">No dishes match “{term}”.</p>}
          {data && data.total > 0 && (
            <>
              <div className="menu-section menu-section--bare">
                <ul className="menu-list">
                  {data.dishes.map((d) => (
                    <DishCard key={d.id} dish={d}>
                      <AddToCartButton id={d.id} name={d.name} />
                    </DishCard>
                  ))}
                </ul>
              </div>
              <div className="pager">
                <button type="button" className="btn btn-sm" disabled={data.page <= 1} onClick={() => setPageState({ term, n: data.page - 1 })}>Previous</button>
                <span>Page {data.page} of {data.totalPages}</span>
                <button type="button" className="btn btn-sm" disabled={data.page >= data.totalPages} onClick={() => setPageState({ term, n: data.page + 1 })}>Next</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
