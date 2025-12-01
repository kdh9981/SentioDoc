import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import WhoIsThisFor from '@/components/landing/WhoIsThisFor'
import WhyLinkLens from '@/components/landing/WhyLinkLens'
import Pricing from '@/components/landing/Pricing'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'
import { OceanWaveDivider, AnimatedLayeredWaves, AnimatedBlobDivider, AnimatedCurvedDivider, AnimatedWaveDivider } from '@/components/landing/SectionDividers'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />
      <main>
        <Hero />

        {/* Divider: Hero to WhoIsThisFor */}
        <OceanWaveDivider colors={['rgba(99, 102, 241, 0.08)', 'rgba(99, 102, 241, 0.15)', '#f8faff']} />

        <WhoIsThisFor />

        {/* Divider: WhoIsThisFor to HowItWorks */}
        <AnimatedWaveDivider color="#ffffff" duration={10} />

        <HowItWorks />

        {/* Divider: HowItWorks to WhyLinkLens */}
        <AnimatedLayeredWaves colors={['rgba(99, 102, 241, 0.05)', 'rgba(99, 102, 241, 0.1)', '#f8fafc']} />

        <WhyLinkLens />

        {/* Divider: WhyLinkLens to Pricing */}
        <AnimatedCurvedDivider color="white" />

        <Pricing />

        {/* Divider: Pricing to CTA */}
        <AnimatedBlobDivider color="#1a1625" />

        <FinalCTA />

        {/* Divider: CTA to Footer */}
        <AnimatedCurvedDivider color="#F8FAFC" flip={true} />
      </main>
      <Footer />
    </div>
  )
}
