import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import GrainOverlay from "../ui/GrainOverlay";

export default function Layout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <GrainOverlay />
      <div className="relative z-10">
        <Sidebar isOpen={isDrawerOpen} onClose={closeDrawer} />
      </div>
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={toggleDrawer} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
