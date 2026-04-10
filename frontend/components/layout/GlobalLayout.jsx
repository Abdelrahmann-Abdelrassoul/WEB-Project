"use client";

import Navbar from "./Navbar";
import ErrorModal from "../ui/ErrorModal";
import { useError } from "../../hooks/useError";

export default function GlobalLayout({ children }) {
  const { error, clearError } = useError();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
      <ErrorModal error={error} onClose={clearError} />
    </>
  );
}