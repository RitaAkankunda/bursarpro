const fs = require('fs');

const files = [
  'c:/Users/user/OneDrive/Desktop/fees-tracker/frontend/src/pages/Students.jsx',
  'c:/Users/user/OneDrive/Desktop/fees-tracker/frontend/src/pages/Payments.jsx',
  'c:/Users/user/OneDrive/Desktop/fees-tracker/frontend/src/pages/Fees.jsx',
  'c:/Users/user/OneDrive/Desktop/fees-tracker/frontend/src/pages/Reports.jsx',
  'c:/Users/user/OneDrive/Desktop/fees-tracker/frontend/src/pages/Settings.jsx',
  'c:/Users/user/OneDrive/Desktop/fees-tracker/frontend/src/pages/Register.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Generic Backgrounds and Cards
  content = content.replace(/glass-morphism/g, 'bg-white');
  content = content.replace(/glass-card/g, 'backdrop-blur-md bg-white/60 shadow-lg');
  content = content.replace(/bg-slate-900\/50/g, 'bg-gray-100');
  content = content.replace(/bg-slate-900/g, 'bg-white text-gray-800');
  content = content.replace(/bg-black\/50/g, 'bg-gray-900/40');
  content = content.replace(/hover:bg-white\/[0-9.]+/g, 'hover:bg-gray-50');

  // Borders
  content = content.replace(/border-white\/5/g, 'border-gray-200');
  content = content.replace(/border-white\/10/g, 'border-gray-300');
  content = content.replace(/border-white\/30/g, 'border-gray-200');
  content = content.replace(/border-slate-700\/50/g, 'border-gray-200');
  content = content.replace(/divide-white\/5/g, 'divide-gray-200');

  // Texts
  content = content.replace(/text-text-muted/g, 'text-gray-600');
  content = content.replace(/gradient-text/g, 'text-gray-800');
  
  // Modals text fix
  content = content.replace(/<h2 (.*?)text-2xl font-black(.*?)>/g, '<h2 $1text-2xl font-black text-gray-800$2>');

  // Buttons and Accents
  content = content.replace(/bg-gradient-to-r from-primary to-secondary/g, 'bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700');
  content = content.replace(/bg-primary\/10/g, 'bg-blue-50');
  content = content.replace(/text-primary/g, 'text-blue-600');
  content = content.replace(/ring-white\/10/g, 'ring-blue-200');

  // Table generic stuff
  content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-gray-50/50');
  content = content.replace(/border-b border-white\/5/g, 'border-b border-gray-200');
  
  // Specific literal string replacements
  content = content.replace(/text-white\}/g, 'text-gray-800}');
  
  // More intelligent text-white replacement
  content = content.replace(/text-white/g, (match, offset, str) => {
    const contextStart = Math.max(0, offset - 40);
    const contextEnd = Math.min(str.length, offset + 40);
    const context = str.substring(contextStart, contextEnd);
    
    // If it is inside a known dark background element, keep it white
    if (context.includes('bg-blue-600') || 
        context.includes('bg-gradient-to-r') || 
        context.includes('text-white font-bold rounded') ||
        context.includes('bg-accent')) {
        return 'text-white';
    }
    // Convert to gray-800 for inputs, selects, table rows, standard text
    return 'text-gray-800';
  });

  fs.writeFileSync(file, content);
  console.log('Updated', file);
});
