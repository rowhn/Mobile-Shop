import Icon from '../../components/Icon.jsx';
import { Button, Reveal } from '../../components/ui';
import { useConfig } from '../../context/Config.jsx';
import './RepairBanner.css';

const ITEMS = [['screen', 'Screen'], ['battery', 'Battery'], ['camera', 'Camera'], ['plug', 'Charging port']];

/** Dark "Repair Center" call-to-action on the homepage. */
export default function RepairBanner() {
  const { store } = useConfig();
  return (
    <Reveal className="container pm-repairbanner">
      <div className="pm-repairbanner__card">
        <div className="row g-4 align-items-center">
          <div className="col-md-6">
            <p className="pm-repairbanner__eyebrow">{store.name} Repair Center</p>
            <h2 className="pm-repairbanner__title">Broken screen? We've got it.</h2>
            <p className="pm-repairbanner__text">Pick your phone, choose the issue, see an estimate and book a slot. Visit us, or let us pick it up.</p>
            <div className="d-flex flex-wrap gap-2 mt-4">
              <Button to="/repair/book" variant="secondary" size="lg">Book a repair</Button>
              <Button to="/repair/track" variant="ghost" size="lg" className="pm-repairbanner__track">Track a repair</Button>
            </div>
          </div>
          <div className="col-md-6">
            <div className="row g-3">
              {ITEMS.map(([ic, t]) => (
                <div key={t} className="col-6">
                  <div className="pm-repairbanner__tile">
                    <Icon name={ic} size={28} strokeWidth={1.3} />
                    <span className="fw-medium">{t}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
