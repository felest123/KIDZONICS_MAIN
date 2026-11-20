import { useState } from "react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/LandingHero";
import LandingCards from "@/components/landing/LandingCards";
import { SeeSection, EarnSection, LearnSection } from "@/components/landing/LandingSections";
import LandingFooter from "@/components/landing/LandingFooter";
import RoleModal from "@/components/kidz/RoleModal";

function scrollToAbout() {
  document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Landing() {
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fdf8ec]">
      <LandingHeader onAbout={scrollToAbout} />
      <LandingHero onStart={() => setRoleOpen(true)} />
      <LandingCards />
      <SeeSection />
      <EarnSection />
      <LearnSection />
      <LandingFooter />
      <RoleModal open={roleOpen} onClose={() => setRoleOpen(false)} />
    </div>
  );
}
