import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import melchiorPhoto from '@/assets/melchior-founder.jpeg';

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
          <h1 className="text-4xl font-bold text-center mb-8">{t('about.title')}</h1>
          
          <div className="prose prose-lg mx-auto text-center space-y-8">
            <p className="text-lg leading-relaxed text-slate-950">
              {t('about.intro1')}
            </p>
            
            <p className="text-lg leading-relaxed text-slate-950">
              {t('about.intro2')}
            </p>
            
            <p className="text-lg font-medium">
              {t('about.founders')}
            </p>
            
            <div className="mt-8 flex flex-col items-center">
              <img 
                src={melchiorPhoto} 
                alt="Melchior - flat2study co-founder" 
                className="w-64 h-64 rounded-lg object-cover shadow-lg"
              />
              <p className="mt-4 text-lg font-semibold text-foreground">
                Melchior - flat2study co-founder
              </p>
            </div>
            
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-6">{t('about.contactInfo')}</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  <span className="font-medium">{t('about.email')}</span> tc4606@nyu.edu
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">{t('about.email')}</span> melchior.deleusse@studbocconi.it
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">{t('about.partnerTitle')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('about.partnerText')} <span className="text-muted-foreground">bhousingmilano@gmail.com</span> {t('about.partnerOr')}
              </p>
              <Button asChild>
                <a href="https://calendly.com/tc4606-nyu/30min" target="_blank" rel="noopener noreferrer">
                  {t('about.scheduleMeeting')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}