import { Bell, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage, Button } from '@projeto/ui';
import NotificationBell from './notification-bell';

export function Header() {
  return (
    <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-border px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
      {/* Search Bar - Modern & Minimal */}
      <div className="flex items-center w-96 relative group">
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Pesquisar..." 
          className="w-full pl-11 pr-4 py-2.5 bg-card/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
        />
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2">
           <NotificationBell />
        </div>
        
        <div className="h-6 w-[1px] bg-border mx-2 hidden md:block"></div>
        
        <div className="flex items-center gap-4 pl-2 group cursor-pointer">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Dra. Jamily</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">Administradora</p>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity" />
             <Avatar className="h-10 w-10 border-2 border-border group-hover:border-primary/50 transition-colors relative z-10">
               <AvatarImage src="" />
               <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#B5952F] text-white font-bold">J</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
