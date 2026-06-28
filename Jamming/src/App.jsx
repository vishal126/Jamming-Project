import { useEffect } from "react";
import Search from "./components/Search";
import Spotify from "./util/Spotify";

function App() {
  useEffect(() => {
    async function authenticate() {
      const token = await Spotify.getAccessToken();
      console.log("Access Token:", token);
    }

    authenticate();
  }, []);

  return <Search />;
}

export default App;