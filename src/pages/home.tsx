import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { content } from "../content/home";
import { Announcement } from "../components/announcement";
import { Navbar } from "../components/navbar";
import { Hero } from "../components/hero";
import { LogoStrip } from "../components/logo-strip";
import { Features } from "../components/features";
import { Models } from "../components/models";
import { PricingCards } from "../components/pricing-cards";
import { Testimonials } from "../components/testimonials";
import { Faq } from "../components/faq";
import { FinalCta } from "../components/final-cta";
import { Footer } from "../components/footer";
import type { Plan, PricingText } from "../lib/plans";

export const HomePage: FC<{ plans: Plan[]; pricingText: PricingText }> = ({
  plans,
  pricingText,
}) => (
  <Layout title={`${content.brand} — ${content.tagline}`} description={content.hero.sub}>
    <Announcement />
    <Navbar />
    <main>
      <Hero />
      <LogoStrip />
      <Features />
      <Models />
      <PricingCards plans={plans} subtitle={pricingText.subtitle} note={pricingText.note} />
      <Testimonials />
      <Faq />
      <FinalCta />
    </main>
    <Footer />
  </Layout>
);
