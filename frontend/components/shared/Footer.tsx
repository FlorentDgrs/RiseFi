export default function Footer() {
  return (
    <footer className="w-full mt-12 py-6 bg-gray-900 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <span className="text-gray-400 text-sm">
          © {new Date().getFullYear()} RiseFi. Tous droits réservés.
        </span>
      </div>
    </footer>
  );
}
