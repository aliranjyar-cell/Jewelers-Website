import Hero from './components/Hero.jsx';
import ProductsSection from './components/ProductsSection.jsx';
import ArchitecturalSplitSection from './components/ArchitecturalSplitSection.jsx';
import CraftSection from './components/CraftSection.jsx';
import ZareenShowcase from './components/ZareenShowcase.jsx';
import WhyChooseZareen from './components/WhyChooseZareen.jsx';
import CustomOrderIntro from './components/CustomOrderIntro.jsx';
import TrustServiceInfo from './components/TrustServiceInfo.jsx';
import CampaignFeature from './components/CampaignFeature.jsx';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProductsSection />
      <CampaignFeature />
      <ArchitecturalSplitSection />
      <ZareenShowcase />
      <CraftSection />
      <TrustServiceInfo />
      <WhyChooseZareen />
      
      <CustomOrderIntro />
    </main>
  );
}
