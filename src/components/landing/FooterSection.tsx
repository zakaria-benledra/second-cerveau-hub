import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export function FooterSection() {
  const footerLinks = {
    product: {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '#features' },
        { label: 'Tarifs', href: '#pricing' },
        { label: 'Témoignages', href: '#testimonials' },
        { label: 'Changelog', href: '#' }
      ]
    },
    resources: {
      title: 'Ressources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Guides', href: '#' },
        { label: 'API', href: '#' }
      ]
    },
    company: {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '#' },
        { label: 'Carrières', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Presse', href: '#' }
      ]
    },
    legal: {
      title: 'Légal',
      links: [
        { label: 'Confidentialité', href: '#' },
        { label: 'CGU', href: '#' },
        { label: 'Cookies', href: '#' },
        { label: 'RGPD', href: '#' }
      ]
    }
  };

  const scrollToSection = (id: string) => {
    if (id.startsWith('#') && id.length > 1) {
      const element = document.getElementById(id.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="py-16 px-4 border-t border-border/40 bg-card/30">
      <div className="container mx-auto max-w-7xl">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Second Brain</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Le système d'intelligence comportementale 
              qui transforme tes actions en trajectoire de vie.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, index) => (
                  <li key={index}>
                    {link.href.startsWith('#') ? (
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Second Brain. Tous droits réservés.
          </p>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Twitter
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              LinkedIn
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
