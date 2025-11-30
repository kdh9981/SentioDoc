import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Pricing from '@/components/landing/Pricing'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'
import { OceanWaveDivider, AnimatedLayeredWaves, AnimatedBlobDivider, AnimatedCurvedDivider } from '@/components/landing/SectionDividers'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />
      <main>
        <Hero />

        {/* Divider: Hero to HowItWorks - Ocean waves flowing horizontally */}
        <OceanWaveDivider colors={['rgba(99, 102, 241, 0.08)', 'rgba(99, 102, 241, 0.15)', '#f8faff']} />

        <HowItWorks />

        {/* Divider: HowItWorks to Pricing - Layered waves moving at different speeds */}
        <AnimatedLayeredWaves colors={['rgba(99, 102, 241, 0.1)', 'rgba(99, 102, 241, 0.2)', 'white']} />

        <Pricing />

        {/* Divider: Pricing to CTA - Morphing blob shape */}
        <AnimatedBlobDivider color="#1a1625" />

        <FinalCTA />

        {/* Divider: CTA to Footer - Gentle floating curve */}
        <AnimatedCurvedDivider color="#F8FAFC" flip={true} />
      </main>
      <Footer />
    </div>
  )
}
