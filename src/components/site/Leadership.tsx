import { Github, Linkedin } from "lucide-react";

interface Leader {
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin: string;
  github?: string;
}

export function Leadership() {
  const leaders: Leader[] = [
    {
      name: "Abhishek Zadokar",
      role: "Chief Executive Officer",
      bio: "A product strategist and developer dedicated to building elegant, high-performance web experiences. Abhishek leads the overall vision, user interface design, and client-side feature growth for Paperlane, transforming complex workflows into seamless, local browser tools.",
      image: "/ceo.jpg",
      linkedin: "https://www.linkedin.com/in/abhishek-zadokar/",
      github: "https://github.com/bloggerabhi12z-bit"
    },
    {
      name: "Aditya Phate",
      role: "Chief Technology Officer",
      bio: "A specialized Backend and Big Data Engineer with a strong track record in building high-performance, distributed architectures and scalable systems. Leveraging deep expertise in Java, performance tuning, and secure data processing, Aditya handles the technical architecture and optimized execution layers of the platform.",
      image: "/cto.jpg",
      linkedin: "https://www.linkedin.com/in/adityalphate/",
      github: "https://github.com/adityaap14"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Meet the Leadership
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Building privacy-first, powerful, local browser utilities to simplify how you manage your documents every single day.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
          {leaders.map((leader) => (
            <div
              key={leader.name}
              className="group flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-signal/40 hover:shadow-md"
            >
              <div className="relative w-32 h-32 mb-5 rounded-full overflow-hidden border-2 border-border/80 group-hover:border-signal transition-colors duration-300 bg-muted">
                <img
                  src={leader.image}
                  alt={leader.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold text-foreground">
                  {leader.name}
                </h3>
                <p className="text-sm font-semibold text-signal uppercase tracking-wider">
                  {leader.role}
                </p>
              </div>

              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
                {leader.bio}
              </p>

              <div className="flex items-center gap-4 mt-6">
                <a
                  href={leader.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full text-muted-foreground hover:text-signal hover:bg-signal-soft transition-colors"
                  aria-label={`${leader.name}'s LinkedIn`}
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                {leader.github && (
                  <a
                    href={leader.github}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={`${leader.name}'s GitHub`}
                  >
                    <Github className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}