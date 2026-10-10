import { dishes } from '@/lib/dishes';
import { CartContents } from '../cart-ui';
import { NO_INDEX } from '@/lib/seo';

export const metadata = {
  title: 'Your cart',
  description: 'Review the dishes in your cart before you check out.',
  robots: NO_INDEX, // private: also excluded in robots.js
};

// Server page (static). Only <CartContents> is a client leaf; it gets the
// dish data it needs as props.
export default function CartPage() {
  const dishData = dishes.map(({ id, name, price }) => ({ id, name, price }));

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <p className="eyebrow">Your order</p>
        <h1>Your cart</h1>
      </header>
      <CartContents dishes={dishData} />
    </div>
  );
}
