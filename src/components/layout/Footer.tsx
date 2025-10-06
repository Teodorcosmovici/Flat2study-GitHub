import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const location = useLocation();
  
  // Hide footer on search page
  if (location.pathname === '/search') {
    return null;
  }
  
  return (
    <footer className="border-t bg-background mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Sections */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* flat2study Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">flat2study</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.howItWorks')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Landlords Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.landlords')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.howItWorks')}
                </Link>
              </li>
              <li>
                <Link to="/landlord" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.startListing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => {
                    const chatButton = document.querySelector('[data-chat-button]') as HTMLButtonElement;
                    if (chatButton) chatButton.click();
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {t('footer.chatWithAgent')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 flat2study, {t('footer.allRightsReserved')}
            </p>
            <div className="flex gap-6">
              <a 
                href="/TERMS_OF_USE.docx" 
                download
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('footer.terms')}
              </a>
              <a 
                href="/Privacy_Notice.docx" 
                download
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('footer.privacy')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
