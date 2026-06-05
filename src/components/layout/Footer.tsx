const Footer = () => {
  return (
    <footer className="p-4 bg-white/10 backdrop-blur-md shadow-md">
      <div className="container mx-auto text-center text-forest-green-dark">
        <p>&copy; {new Date().getFullYear()} El Nido. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
