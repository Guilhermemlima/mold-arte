import Hero from "@/components/home/Hero";
import Marquee from "@/components/Marquee";
import Categories from "@/components/home/Categories";
import Featured from "@/components/home/Featured";
import Process from "@/components/home/Process";
import Materials from "@/components/home/Materials";
import FinalCTA from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />

      <Marquee
        items={[
          "Produção própria",
          "Frete grátis acima de R$ 299",
          "Modelagem 3D inclusa",
          "Envio para todo o Brasil",
          "Orçamento em 24h",
          "Peças sob medida",
        ]}
      />

      <Categories />
      <Featured />
      <Process />
      <Materials />
      <FinalCTA />
    </>
  );
}
