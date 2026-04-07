"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

type Category = "work" | "leadership" | "projects" | "links" | null;

interface Item {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
  link?: string;
  linkText?: string;
  image?: string;
  category: Category;
  tags?: string[];
}

const ITEMS: Item[] = [
  {
    id: "microsoft",
    title: "Microsoft",
    subtitle: "Product Manager",
    date: "Summer 2026",
    category: "work",
    description: "Incoming Product Manager at Microsoft Security in Redmond, WA. Updates to follow.",
    image: "/microsoft.jpeg"
  },
  {
    id: "telus",
    title: "TELUS",
    subtitle: "Software Engineer",
    date: "Winter 2026",
    category: "work",
    description: "Supported an internal booking platform through test automation, cloud migration efforts, UI/UX ideation, and day-to-day maintenance to improve platform stability and usability.",
    image: "/telus.jpeg"
  },
  {
    id: "boomi",
    title: "Boomi",
    subtitle: "Product Marketing",
    date: "Summer 2025",
    category: "work",
    description: "Drove product-led growth initiatives by scoping AI agent use cases, designing guided product demos, and developing buyer-focused positioning to accelerate user growth and adoption.",
    image: "/boomi.jpeg"
  },
  {
    id: "creator",
    title: "Creator",
    subtitle: "Product Engineer",
    date: "Winter 2025",
    category: "work",
    description: "Led several 0-to-1 product initiatives, combining user research, PRD ownership, hands-on development of an internal automation tool, and data-driven validation to guide product strategy.",
    image: "/creator.png"
  },

  {
    id: "ubc-biztech",
    title: "UBC BizTech",
    subtitle: "Co-President",
    date: "2024-2026",
    category: "leadership",
    description: "Leading the largest tech student organization at UBC with 7 teams, 48 executives and 750+ members. Previously Media Director.",
    link: "https://ubcbiztech.com",
    linkText: "More about UBC BizTech",
    image: "/biztech.jpg"
  },
  {
    id: "nwplus",
    title: "nwPlus",
    subtitle: "Sponsorships",
    date: "2023-2025",
    category: "leadership",
    description: "Secured a record number of 79 sponsors for Western Canada's largest hackathons. Previously Marketing and First Year Rep.",
    link: "https://nwplus.io",
    linkText: "More about nwPlus",
    image: "/nwplus.jpeg"
  },

  {
    id: "trojan",
    title: "Trojan",
    subtitle: "nwHacks Winner",
    date: "1Password Best Security Hack",
    category: "projects",
    description: "Trojan is an AI-powered, multi-agent security scanner that finds and fixes critical vulnerabilities in your codebase before they reach production.",
    link: "https://devpost.com/software/trojan",
    linkText: "View Devpost",
    image: "/trojan.png"
  },
  {
    id: "soundchain",
    title: "soundchain",
    subtitle: "Cal Hacks Winner",
    date: "Sui Reimagine the Internet Prize",
    category: "projects",
    description: "Soundchain is a decentralized music platform that lets fans discover and fund emerging artists early, turning listeners into investors through transparent, rights-backed support.",
    link: "https://devpost.com/software/soundchain",
    linkText: "View Devpost",
    image: "/soundchain.png"
  },
  {
    id: "bucs-fighter",
    title: "BUCS Fighter",
    subtitle: "BUCS Hackathon Winner",
    date: "2nd Place Overall",
    category: "projects",
    description: "BUCS Fighter is a real-time online arena fighter featuring fast, high-intensity matches. Built with an authoritative TypeScript backend, it delivers a competitive multiplayer experience designed for quick rounds and chaotic fun.",
    link: "https://devpost.com/software/bucs-fighter",
    linkText: "View Devpost and Play Now",
    image: "/bucsfighter.png"
  },
  {
    id: "begriddy",
    title: "BeGriddy",
    subtitle: "BUCS Hackathon Winner",
    date: "Audience Choice Winner",
    category: "projects",
    description: "BeGriddy is a social game that randomly prompts friends to record their best Griddy, scores their moves with computer vision, and brings people together through playful competition.",
    link: "https://devpost.com/software/begriddy",
    linkText: "View Devpost",
    image: "/begriddy.jpg"
  },
  {
    id: "presentify",
    title: "Presentify",
    date: "StormHacks Submission",
    category: "projects",
    description: "Presentify is a voice-first presentation tool that turns live speech into accessible, engaging slides with real-time subtitles, visuals, and interactive audio.",
    link: "https://devpost.com/software/presentify",
    linkText: "View Devpost",
    image: "/presentify.png"
  },

];

export default function Home() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const activeItem = ITEMS.find((item) => item.id === selectedItemId);
  const selectedItem = ITEMS.find((item) => item.id === selectedItemId);

  const handleItemClick = (id: string, category: Category) => {
    if (category === "links") return;
    setSelectedItemId(id === selectedItemId ? null : id);
  };

  const closeOverlay = () => setSelectedItemId(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  const [emailCopied, setEmailCopied] = useState(false);
  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText("lucasgingera@outlook.com");
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const DefaultHero = () => (
    <div className="relative w-full h-full flex flex-col justify-center items-center opacity-80 animate-in fade-in duration-700">
      <div className="relative w-full aspect-square max-w-sm overflow-hidden rounded-lg shadow-2xl hover:grayscale-0 transition-all duration-700">
        <Image
          src="/hero.jpg"
          alt="Abstract Design"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      <p className="mt-8 text-zinc-400 font-light tracking-wide uppercase text-[12px]">
        Select an item for more details
      </p>
    </div>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {

      const target = event.target as HTMLElement;

      if (!target.closest('button') && !target.closest('a') && !target.closest('.md\\:col-span-6:last-child')) {
        setSelectedItemId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-zinc-200 dark:selection:bg-zinc-800 font-sans overflow-hidden">

      {/* mobile */}
      {isMobile && selectedItem && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col p-8 animate-in slide-in-from-bottom-10 duration-300">
          <button
            onClick={closeOverlay}
            className="self-end p-2 -mr-2 text-zinc-500 hover:text-foreground transition-colors"
            aria-label="Close details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
            <div className="space-y-4">
              {selectedItem.image && (
                <div className="relative w-full aspect-video rounded-md overflow-hidden mb-6">
                  <Image
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-sm">
                  {selectedItem.category}
                </span>
                <h2 className="text-[12px] font-bold mt-4 tracking-tight uppercase">{selectedItem.title}</h2>
                {selectedItem.subtitle && (
                  <p className="text-[12px] text-zinc-500 mt-1 font-normal">{selectedItem.subtitle}</p>
                )}
                {selectedItem.date && (
                  <p className="text-[10px] text-zinc-400 mt-1 font-light">{selectedItem.date}</p>
                )}
              </div>

              <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                {selectedItem.description}
              </p>

              {selectedItem.link && (
                <div className="pt-4">
                  <a href={selectedItem.link} target="_blank" rel="noopener noreferrer" className="content-link inline-flex items-center text-[12px] font-medium border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity">
                    {selectedItem.linkText || "View Project"}
                    <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl h-screen md:overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">

          {/* left column */}
          <div
            className={`md:col-span-6 h-full md:overflow-y-auto thin-scrollbar py-12 px-8 md:py-24 transition-colors flex flex-col ${isScrolling ? 'is-scrolling' : ''}`}
            onScroll={handleScroll}
          >
            <div className="flex flex-col gap-10 my-auto">

              <header className="space-y-2">
                <h1 className="text-[12px] font-bold tracking-tight uppercase">Lucas Gingera</h1>
                <div className="space-y-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                  <p>Product Manager & Software Engineer</p>
                  <p className="pt-1 text-zinc-400">Business + Computer Science @ UBC</p>
                </div>
              </header>

              <nav className="space-y-8">
                {["work", "leadership", "projects"].map((category) => (
                  <section key={category}>
                    <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 dark:text-zinc-500">
                      {category}
                    </h2>
                    <ul className="space-y-0">
                      {ITEMS.filter((item) => item.category === category).map((item) => (
                        <li key={item.id} className="relative group">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item.id, item.category!);
                            }}
                            className={`w-full text-left cursor-pointer transition-all duration-300
                              ${selectedItemId === item.id
                                ? "bg-zinc-100 dark:bg-zinc-900 text-foreground py-1 px-2 -mx-2 rounded-[8px]"
                                : "text-zinc-500 dark:text-zinc-400 py-1 px-2 -mx-2 rounded-md"
                              }
                            `}
                          >
                            <span className="flex items-center justify-between text-[12px]">
                              <span className={selectedItemId === item.id ? "font-medium" : "font-normal"}>
                                {item.title}
                              </span>
                              {item.subtitle && (
                                <span className="text-[10px] text-zinc-400 font-normal ml-2 opacity-80">
                                  {item.subtitle}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                <section> {/* links */}
                  <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 dark:text-zinc-500">
                    Links
                  </h2>
                  <ul className="flex flex-wrap gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
                    <li><a href="https://linkedin.com/in/lucasgingera" target="_blank" rel="noopener noreferrer" className="nav-link inline-block -mx-1 px-1 py-0.5 underline decoration-zinc-300 underline-offset-4 decoration-1 transition-all">LinkedIn</a></li>
                    <li><a href="https://github.com/lucasging" target="_blank" rel="noopener noreferrer" className="nav-link inline-block -mx-1 px-1 py-0.5 underline decoration-zinc-300 underline-offset-4 decoration-1 transition-all">GitHub</a></li>
                    <li>
                      <button
                        onClick={handleCopyEmail}
                        className="nav-link inline-block -mx-1 px-1 py-0.5 underline decoration-zinc-300 underline-offset-4 decoration-1 transition-all cursor-pointer"
                      >
                        {emailCopied ? "Copied" : "Email"}
                      </button>
                    </li>
                    <li><a href="https://x.com/lucasgingera" target="_blank" rel="noopener noreferrer" className="nav-link inline-block -mx-1 px-1 py-0.5 underline decoration-zinc-300 underline-offset-4 decoration-1 transition-all">X</a></li>
                    <li><a href="https://substack.com/@lucasgingera" target="_blank" rel="noopener noreferrer" className="nav-link inline-block -mx-1 px-1 py-0.5 underline decoration-zinc-300 underline-offset-4 decoration-1 transition-all">Substack</a></li>
                  </ul>
                </section>
              </nav>
            </div>
          </div>

          <div // content column
            className="hidden md:flex md:col-span-6 h-full items-center justify-center pl-12 pr-8 relative"
          >
            <div className="w-full max-w-md animate-in fade-in duration-700">
              {activeItem ? (
                <div key={activeItem.id} className="space-y-4">
                  {activeItem.image && (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden mb-6 animate-in fade-in duration-700">
                      <Image
                        src={activeItem.image}
                        alt={activeItem.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-sm">
                      {activeItem.category}
                    </span>
                    <h3 className="text-[12px] font-bold mt-4 tracking-tight uppercase">{activeItem.title}</h3>
                    {activeItem.subtitle && (
                      <p className="text-[12px] text-zinc-500 mt-1 font-normal">{activeItem.subtitle}</p>
                    )}
                    {activeItem.date && (
                      <p className="text-[10px] text-zinc-400 mt-1 font-light">{activeItem.date}</p>
                    )}
                  </div>

                  <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {activeItem.description}
                  </p>

                  {activeItem.link && (
                    <div className="pt-4">
                      <a href={activeItem.link} target="_blank" rel="noopener noreferrer" className="content-link inline-flex items-center text-[12px] font-medium border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity">
                        {activeItem.linkText || "View Project"} -&gt;
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <DefaultHero />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
