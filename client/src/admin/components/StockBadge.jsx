import { Badge } from '../../components/ui';

export default function StockBadge({ n, threshold = 5 }) {
  return n <= 0 ? <Badge tone="red">Out of stock</Badge> : n <= threshold ? <Badge tone="amber">{n} left</Badge> : <Badge tone="green">{n}</Badge>;
}
