import Icon from './Icon.jsx';
import { cx } from './ui';
import './QtyStepper.css';

/** − 2 + quantity control. `compact` = smaller version for the cart drawer. */
export default function QtyStepper({ value, onChange, max = 10, compact }) {
  return (
    <div className={cx('pm-qty', compact && 'pm-qty--compact')}>
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(value - 1)}>
        <Icon name="minus" size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
