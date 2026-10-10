'use client';

import { useState } from 'react';

// Client shell around a server-rendered list. It never imports DishList;
// the page passes the list in as `children`, so DishList stays on the server.
// The toggle sets a data attribute and CSS hides the non-matching rows
// (and any section left with no rows).
export default function FilterShell({ children }) {
  const [budgetOnly, setBudgetOnly] = useState(false);

  return (
    <div data-budget-only={budgetOnly}>
      <label className="filter">
        <input 
          type="checkbox"
          name="budget-only" 
          checked={budgetOnly} 
          onChange={(e) => setBudgetOnly(e.target.checked)} /> 
          Under $10 only
      </label>
      {children}
    </div>
  );
}
