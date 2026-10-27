/** Join class names, skipping falsy values: cx('btn', isOn && 'active') */
export const cx = (...a) => a.filter(Boolean).join(' ');
