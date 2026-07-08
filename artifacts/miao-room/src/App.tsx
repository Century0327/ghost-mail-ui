import { Switch, Route, Router as WouterRouter } from "wouter";
import { CozyRoom } from "@/components/room/cozy-room";
import { LandingPage } from "@/pages/landing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/room" component={CozyRoom} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
