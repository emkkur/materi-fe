import { useParams, Link } from 'react-router';

export default function Document() {
  const { documentId } = useParams();

  return (
    <div>
      <h1>Document Page</h1>
      <p>Viewing document ID: {documentId}</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}
