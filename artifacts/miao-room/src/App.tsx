import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { CozyRoom } from "@/components/room/cozy-room";
import { LandingPage } from "@/pages/landing";
import { APP_VERSION } from "./version";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/room" component={CozyRoom} />
    </Switch>
  );
}

const VERSION_KEY = "app_version";

function useVersionCheck() {
  useEffect(() => {
    const checkVersion = () => {
      const stored = localStorage.getItem(VERSION_KEY);
      if (stored !== APP_VERSION) {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        window.location.reload();
      }
    };

    checkVersion();

    // visibilitychange 防抖：5 秒内只检测一次
    let lastCheck = Date.now();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastCheck > 5000) {
          lastCheck = now;
          checkVersion();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}

function App() {
  useVersionCheck();
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
