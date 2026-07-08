import { useEffect, useState } from "react";

// Mock data fetch
const fetchFeatures = async () => {
  return new Promise<{ id: string; title: string; description: string }[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          title: "Secure Authentication",
          description: "Enterprise-grade security with Neon database.",
        },
        {
          id: "2",
          title: "Lightning Fast",
          description: "React 19 and Vite 8 for instant updates.",
        },
        {
          id: "3",
          title: "Modern Design",
          description: "Tailwind v4 styling for beautiful layouts.",
        },
      ]);
    }, 500);
  });
};

export function Home() {
  const [features, setFeatures] = useState<{ id: string; title: string; description: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures().then((data) => {
      setFeatures(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
          Welcome to Our Platform
        </h1>
        <p className="text-xl text-gray-600">Building the future with React 19 and Tailwind v4.</p>
      </header>

      <main className="max-w-4xl mx-auto">
        <section
          aria-label="Platform Features"
          className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Key Features</h2>

          {loading ? (
            <div className="flex justify-center p-8">
              <span className="text-gray-500 animate-pulse">Loading features...</span>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.id}
                  className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg mb-2 text-indigo-600">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 text-center">
          <button
            type="button"
            aria-label="Submit login form"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
            onClick={() => console.log("Login clicked")}
          >
            Get Started
          </button>
        </div>
      </main>
    </div>
  );
}
