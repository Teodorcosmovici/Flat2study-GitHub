import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';

interface OwnerAccessProps {
  onAuthenticated: () => void;
}

const OwnerAccess = ({ onAuthenticated }: OwnerAccessProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.id === 'Flat2Study' && credentials.password === 'teodormelchior') {
      onAuthenticated();
      setIsOpen(false);
      setError('');
      setCredentials({ id: '', password: '' });
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground/60 hover:text-muted-foreground">
          Owner Access
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-lg font-semibold text-center">Owner Access</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground text-center mb-6">
          Enter credentials to access owner dashboard
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-3">
            <div>
              <Input
                type="text"
                placeholder="ID"
                value={credentials.id}
                onChange={(e) => setCredentials(prev => ({ ...prev, id: e.target.value }))}
                required
              />
            </div>
            
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          
          <Button type="submit" className="w-full">
            Access Dashboard
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OwnerAccess;