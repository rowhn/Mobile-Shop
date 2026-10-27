import { Modal as BsModal } from 'react-bootstrap';
import './Modal.css';

/** Bootstrap modal. `wide` makes it large. Full-screen friendly on phones. */
export function Modal({ open, onClose, title, children, wide }) {
  return (
    <BsModal show={!!open} onHide={onClose} centered scrollable size={wide ? 'lg' : undefined} fullscreen="sm-down" aria-label={title} className="pm-modal">
      <BsModal.Header closeButton>
        <BsModal.Title as="h2" className="h5 fw-semibold">{title}</BsModal.Title>
      </BsModal.Header>
      <BsModal.Body>{children}</BsModal.Body>
    </BsModal>
  );
}
