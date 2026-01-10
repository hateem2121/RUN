// Disable Reactotron in production/build environments where package may be missing
// import Reactotron from "reactotron-react-js";

const Reactotron = {
  configure: () => ({ connect: () => {} }),
  log: () => {},
  warn: () => {},
  error: () => {},
  display: () => {},
};

// Only run in development
if (import.meta.env.DEV) {
  /*
  Reactotron.configure({
    name: "RUN-REMIX",
  }).connect(); // Connect to the desktop app

  // Optional: clear on load
  (Reactotron as any).clear?.();
  */
}

export default Reactotron;
