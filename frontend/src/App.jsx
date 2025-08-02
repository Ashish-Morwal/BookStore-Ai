import { Outlet } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot"; // ✅ Import your Chatbot
import { AuthProvide } from "./context/AuthContext";
import { useEffect, useState } from "react";
import Loading from "./components/Loading";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Cleanup timer
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <AuthProvide>
        <Navbar />

        <main className="min-h-screen max-w-screen-2xl mx-auto px-4 py-6 font-primary">
          <Outlet />
        </main>

        {/* ✅ Add Chatbot here (will appear on every page) */}
        <Chatbot />

        <Footer />
      </AuthProvide>
    </>
  );
}

export default App;
