import { Route, Routes } from "react-router-dom";
import { DocumentTitle } from "./components/DocumentTitle.jsx";
import { Header } from "./components/layout/Header.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import { ScrollToTop } from "./components/layout/ScrollToTop.jsx";
import { ActivePage } from "./pages/ActivePage.jsx";
import { HallOfFamePage } from "./pages/HallOfFamePage.jsx";
import { ExpiredPage } from "./pages/ExpiredPage.jsx";
import { PendingEntryPage } from "./pages/PendingEntryPage.jsx";
import { PickDetailPage } from "./pages/PickDetailPage.jsx";
import { PickTradingHistoryPage } from "./pages/PickTradingHistoryPage.jsx";
import { UserPage } from "./pages/UserPage.jsx";
import { UsersLeaderboardPage } from "./pages/UsersLeaderboardPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";
import { GuidePage } from "./pages/GuidePage.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <DocumentTitle />
      <Header />
      <main id="main-content" className="flex-1">
        <Routes>
          <Route path="/" element={<ActivePage />} />
          <Route path="/hall-of-fame" element={<HallOfFamePage />} />
          <Route path="/pending-entry" element={<PendingEntryPage />} />
          <Route path="/expired" element={<ExpiredPage />} />
          <Route path="/pick/:id/history" element={<PickTradingHistoryPage />} />
          <Route path="/pick/:id" element={<PickDetailPage />} />
          <Route path="/users" element={<UsersLeaderboardPage />} />
          <Route path="/user/:username" element={<UserPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Routes>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
