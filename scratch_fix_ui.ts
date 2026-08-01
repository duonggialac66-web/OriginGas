import * as fs from 'fs';

function fixUI(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Make tables minimalist
    content = content.replace(/border-2 border-slate-600/g, 'border-b border-gray-100');
    content = content.replace(/border-t-2 border-slate-600/g, 'border-t border-gray-200');
    content = content.replace(/border-b-2 border-slate-600/g, 'border-b border-gray-200');
    content = content.replace(/border-collapse bg-white/g, 'border-collapse bg-white w-full text-left');
    
    // Header styling
    content = content.replace(/bg-slate-200 text-slate-900/g, 'bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider');
    content = content.replace(/bg-teal-50 text-teal-900/g, 'bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider');
    content = content.replace(/bg-teal-100 text-teal-900/g, 'bg-gray-50 text-gray-800 text-sm');
    
    // Reduce font weights
    content = content.replace(/font-extrabold/g, 'font-semibold');
    content = content.replace(/font-black/g, 'font-bold');
    content = content.replace(/font-bold text-slate-900/g, 'font-medium text-gray-900');
    
    // Colors
    content = content.replace(/text-slate-900/g, 'text-gray-900');
    content = content.replace(/text-slate-700/g, 'text-gray-600');
    content = content.replace(/text-slate-600/g, 'text-gray-500');
    content = content.replace(/text-teal-800/g, 'text-gray-800');
    content = content.replace(/text-teal-700/g, 'text-gray-700');
    
    // Inputs
    content = content.replace(/border-2 border-gray-200/g, 'border border-gray-200 bg-gray-50');
    content = content.replace(/border-2 border-teal-200/g, 'border border-gray-200 bg-gray-50');
    content = content.replace(/bg-white text-gray-900/g, 'text-gray-900'); // since bg is handled
    
    // Buttons
    content = content.replace(/bg-gradient-to-r from-orange-500 via-red-500 to-red-600/g, 'bg-gray-900 hover:bg-black');
    content = content.replace(/bg-gradient-to-r from-emerald-500 to-teal-600/g, 'bg-gray-900 hover:bg-black');
    content = content.replace(/bg-[#0068ff]/g, 'bg-gray-900 hover:bg-black');
    
    // Big shadows to smaller shadows
    content = content.replace(/shadow-2xl/g, 'shadow-sm border border-gray-100');
    
    // Title gradients to plain text
    content = content.replace(/bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent/g, 'text-gray-900');
    
    // Padding tweaks
    content = content.replace(/py-4 px-5/g, 'py-3 px-4');
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed UI in', filePath);
}

fixUI('src/app/pages/EmployeePage.tsx');
fixUI('src/app/pages/AdminPage.tsx');

