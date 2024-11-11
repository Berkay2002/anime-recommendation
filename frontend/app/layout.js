// app/layout.js
export const metadata = {
  title: "Anime Recommendation System",
  description: "Discover anime based on personalized recommendations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Meta tags and favicons can go here */}
      </head>
      <body className="bg-gray-100 text-gray-900">
        {/* Navigation can be added here */}
        <header className="bg-blue-600 p-4 text-white">
          <h1 className="text-xl font-semibold">Anime Recommendation System</h1>
        </header>

        <main className="container mx-auto p-4">{children}</main>

        <footer className="bg-gray-800 text-white p-4 mt-4 text-center">
          <p>&copy; 2024 Anime Recommender. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
