/** Renders the admin-authored plain text: "## Heading", "- bullet", blank-line separated paragraphs. */
export default function RichText({ text }) {
  const blocks = [];
  let list = null;
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trimEnd();
    if (/^- /.test(line)) { (list ||= []).push(line.slice(2)); continue; }
    if (list) { blocks.push({ t: 'ul', items: list }); list = null; }
    if (/^## /.test(line)) blocks.push({ t: 'h2', text: line.slice(3) });
    else if (line.trim()) blocks.push({ t: 'p', text: line });
  }
  if (list) blocks.push({ t: 'ul', items: list });
  return (
    <div className="prose-cms">
      {blocks.map((b, i) => b.t === 'h2' ? <h2 key={i}>{b.text}</h2> : b.t === 'ul' ? <ul key={i}>{b.items.map((x, j) => <li key={j}>{x}</li>)}</ul> : <p key={i}>{b.text}</p>)}
    </div>
  );
}
