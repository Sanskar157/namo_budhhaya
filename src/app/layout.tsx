  "use client";

  import "./globals.css";
  import { motion } from "framer-motion";
  import { useRouter } from "next/navigation";
  import { useState, useEffect } from "react";


  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);

    const topics = [
      { name: "Samsara", path: "/samsara" },
      { name: "Pattica Samuppada", path: "/pattica-samuppada" },
      { name: "Avijja", path: "/avijja" },
      { name: "Nirvana", path: "/nirvana" },
      { name: "Anicca", path: "/anicca" },
      { name: "Anatta", path: "/anatta" },
      { name: "Brahmavihara", path: "/brahmavihara" },
    ];

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (!(event.target as HTMLElement).closest(".dropdown")) {
          setShowDropdown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <html lang="en">
        <body className="bg-[#0f0f0f] text-white min-h-screen">
          {/* Header */}
          <header className="w-full flex justify-between items-center py-6 px-6 max-w-7xl mx-auto relative">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-500 to-orange-600 text-transparent bg-clip-text cursor-pointer" onClick={() => router.push("/")}>
              Namo Buddhaya
            </h1>
            <nav>
              <ul className="flex space-x-8 text-lg font-medium">
                <motion.li
                  className="relative cursor-pointer transition duration-200 dropdown"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <motion.span whileHover={{ scale: 1.1, color: "#facc15" }}>
                    Topics
                  </motion.span>
                  {showDropdown && (
                    <motion.ul
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 shadow-lg rounded-lg overflow-hidden"
                    >
                      {topics.map((topic, index) => (
                        <li
                          key={index}
                          className="px-4 py-2 hover:bg-gray-800 cursor-pointer"
                          onClick={() => {
                            router.push(topic.path);
                            setShowDropdown(false);
                          }}
                        >
                          {topic.name}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </motion.li>
                <motion.li
                  whileHover={{ scale: 1.1, color: "#facc15" }}
                  className="cursor-pointer transition duration-200"
                  onClick={() => {router.push("/chatbot")}}
                >
                  Chatbot
                </motion.li>
                {/* <motion.li
                  whileHover={{ scale: 1.1, color: "#facc15" }}
                  className="cursor-pointer transition duration-200"
                  onClick = {() => {router.push("/support")}}
                >
                  Support
                </motion.li> */}
              </ul>
            </nav>
          </header>

          {/* Page Content */}
          <main>{children}</main>
        </body>
      </html>
    );
  }
