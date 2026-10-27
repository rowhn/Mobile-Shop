import { Link } from 'react-router-dom';
import { useConfig } from '../context/Config.jsx';
import './AnnouncementBar.css';

/** Thin dark bar above the navbar. Text is set in Admin → Settings → Announcement. */
export default function AnnouncementBar() {
  const { store } = useConfig();
  const a = store.announcement;
  if (!a?.isActive || !a.text) return null;
  return <div className="pm-announce">{a.link ? <Link to={a.link}>{a.text}</Link> : <span>{a.text}</span>}</div>;
}
