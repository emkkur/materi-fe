import { Link } from 'react-router';

export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold underline text-blue-600">Home Page</h1>
      <p className="mt-4 text-gray-600">Welcome to the home page.</p>
      <ul className="mt-4 list-disc pl-5">
        <li>
          <Link to="/document/123" className="text-blue-500 hover:underline">Go to Document 123</Link>
        </li>
        <li>
          <Link to="/document/456" className="text-blue-500 hover:underline">Go to Document 456</Link>
        </li>
      </ul>
    </div>
  );
}
