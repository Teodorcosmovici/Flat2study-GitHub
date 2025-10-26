import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import melchiorPhoto from '@/assets/melchior-founder.jpeg';
import teodorPhoto from '@/assets/teodor-founder-new.jpeg';

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('about.backHome')}
            </Button>
          </Link>
        </div>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-justify mb-8">{t('about.title')}</h1>
          
          <div className="prose prose-lg mx-auto space-y-8">
            <p className="text-lg leading-relaxed text-slate-950 text-justify">
              {t('about.intro1')}
            </p>
            
            <p className="text-lg leading-relaxed text-slate-950 text-justify">
              {t('about.intro2')}
            </p>
            
            <p className="text-lg font-medium text-justify">
              {t('about.founders')}
            </p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="flex flex-col">
                <img 
                  src={melchiorPhoto} 
                  alt="Melchior - flat2study co-founder" 
                  className="w-full h-80 rounded-lg object-cover shadow-lg"
                />
                <p className="mt-4 text-lg font-semibold text-foreground text-justify">
                  Melchior - flat2study co-founder
                </p>
                <p className="mt-2 text-muted-foreground text-justify">
                  melchior.deleusse@studbocconi.it
                </p>
              </div>
              
              <div className="flex flex-col">
                <img 
                  src={teodorPhoto} 
                  alt="Teodor - flat2study co-founder" 
                  className="w-full h-80 rounded-lg object-contain bg-muted shadow-lg"
                />
                <p className="mt-4 text-lg font-semibold text-foreground text-justify">
                  Teodor - flat2study co-founder
                </p>
                <p className="mt-2 text-muted-foreground text-justify">
                  tc4606@nyu.edu
                </p>
                <div className="mt-4 space-y-3">
                  <p className="text-muted-foreground text-justify">
                    {t('about.teodorBio1')}
                  </p>
                  <p className="text-muted-foreground text-justify">
                    {t('about.teodorBio2')}
                  </p>
                  <p className="text-muted-foreground text-justify">
                    {t('about.teodorBio3')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}