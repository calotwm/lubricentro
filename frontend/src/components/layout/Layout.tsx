import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import GrainOverlay from "../ui/GrainOverlay";

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <GrainOverlay />
      <div className="relative z-10">
        <Sidebar />
      </div>
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
