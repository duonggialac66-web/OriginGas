import * as fs from 'fs';

function revertUI(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Tables
    content = content.replace(/border-b border-gray-100/g, 'border-2 border-slate-600');
    content = content.replace(/border-t border-gray-200/g, 'border-t-2 border-slate-600');
    content = content.replace(/border-b border-gray-200/g, 'border-b-2 border-slate-600');
    content = content.replace(/border border-gray-200/g, 'border-2 border-gray-200');
    content = content.replace(/border-collapse bg-white w-full text-left/g, 'border-collapse bg-white');

    // Header styling
    // Revert "bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider" in THU Gas lon and Lich su Gas lon to teal
    content = content.replace(/<tr className="bg-gray-50\/50 text-gray-500 text-xs uppercase tracking-wider border-b-2 border-slate-600">\s*<th className="text-left py-3 px-4/g, '<tr className="bg-teal-50 text-teal-900 border-b-2 border-slate-600">\n<th className="text-left py-3 px-4');
    content = content.replace(/<tr className="bg-gray-50\/50 text-gray-500 text-xs uppercase tracking-wider border-b-2 border-slate-600">\s*<th className="text-left py-4 px-5/g, '<tr className="bg-teal-50 text-teal-900 border-b-2 border-slate-600">\n<th className="text-left py-4 px-5');
    
    // Revert others to slate
    content = content.replace(/bg-gray-50\/50 text-gray-500 text-xs uppercase tracking-wider/g, 'bg-slate-200 text-slate-900');
    
    // Footers
    content = content.replace(/bg-gray-50 text-teal-800 text-sm/g, 'bg-teal-100 text-teal-900');
    
    // Buttons
    content = content.replace(/bg-gray-900 hover:bg-black text-white/g, 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600 hover:from-orange-600 hover:via-red-600 hover:to-red-700 text-white');
    content = content.replace(/bg-gray-900 hover:bg-black/g, 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700');
    
    // Shadows
    content = content.replace(/shadow-sm border-2 border-gray-200/g, 'shadow-2xl border-2 border-gray-200'); // wait, border was replaced to border-2
    content = content.replace(/shadow-sm border-2 border-slate-600/g, 'shadow-sm border-2 border-slate-600'); // leave this or change to shadow-sm
    content = content.replace(/shadow-sm border border-gray-100/g, 'shadow-2xl');

    // Fonts
    content = content.replace(/font-semibold/g, 'font-extrabold');
    content = content.replace(/font-medium/g, 'font-bold');

    // Text colors
    content = content.replace(/text-gray-500/g, 'text-slate-600');
    content = content.replace(/text-gray-600/g, 'text-slate-700');
    content = content.replace(/text-gray-900/g, 'text-slate-900');
    
    // Padding
    content = content.replace(/py-3 px-4/g, 'py-4 px-5');

    fs.writeFileSync(filePath, content);
}

revertUI('src/app/pages/EmployeePage.tsx');

function revertAdmin(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/bg-gray-900/g, 'bg-gradient-to-r from-orange-600 to-red-600');
    content = content.replace(/bg-gray-100 text-slate-900/g, 'bg-gradient-to-br from-yellow-400 to-yellow-600');
    content = content.replace(/bg-gray-50\/50 text-slate-600 border-b-2 border-slate-600/g, 'table-header-gas');
    content = content.replace(/border-t border-gray-200/g, 'border-t-2 border-blue-200');
    content = content.replace(/bg-gray-50 py-2 border-y border-gray-100/g, 'bg-blue-50 py-2');
    content = content.replace(/bg-gray-50\/50/g, 'bg-gradient-to-r from-blue-100 to-blue-50');
    
    content = content.replace(/border border-gray-200/g, 'border-2 border-gray-200');
    content = content.replace(/shadow-sm/g, 'shadow-lg');
    content = content.replace(/font-semibold/g, 'font-extrabold');

    fs.writeFileSync(filePath, content);
}

revertAdmin('src/app/pages/AdminPage.tsx');
console.log("Reverted");
