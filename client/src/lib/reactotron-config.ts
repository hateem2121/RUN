import Reactotron from "reactotron-react-js";

// Only run in development
if (import.meta.env.DEV) {
  Reactotron.configure({
    name: "RUN-REMIX",
  }).connect(); // Connect to the desktop app

  // Optional: clear on load
  (Reactotron as any).clear?.();

  console.log("Reactotron Configured");
}

export default Reactotron;
