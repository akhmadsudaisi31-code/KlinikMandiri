
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
        Halaman Tidak Ditemukan
      </h2>
      <p className="mt-2 text-gray-600">
        Maaf, halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 font-medium text-white bg-primary rounded-md shadow-sm hover:bg-primary-dark"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}

export default NotFound;