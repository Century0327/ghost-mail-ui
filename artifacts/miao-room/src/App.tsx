import { Switch, Route, Router as WouterRouter } from "wouter";
import { CozyRoom } from "@/components/room/cozy-room";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CozyRoom} />
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
