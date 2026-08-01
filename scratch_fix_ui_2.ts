import * as fs from 'fs';

function fixUI(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Removing more loud gradients in AdminPage
    content = content.replace(/bg-gradient-to-r from-orange-600 to-red-600/g, 'bg-gray-900');
    content = content.replace(/bg-gradient-to-r from-teal-500 to-emerald-600/g, 'bg-gray-900');
    content = content.replace(/bg-gradient-to-br from-yellow-400 to-yellow-600/g, 'bg-gray-100 text-gray-900');
    content = content.replace(/bg-gradient-to-br from-gray-300 to-gray-500/g, 'bg-gray-100 text-gray-900');
    content = content.replace(/bg-gradient-to-br from-orange-400 to-orange-600/g, 'bg-gray-100 text-gray-900');
    content = content.replace(/table-header-gas/g, 'bg-gray-50/50 text-gray-500 border-b border-gray-200');
    
    // Removing heavy borders from AdminPage tables
    content = content.replace(/border-2 border-gray-200/g, 'border border-gray-200');
    content = content.replace(/border-t-2 border-blue-200/g, 'border-t border-gray-200');
    
    // Simplify headers in AdminPage tables
    content = content.replace(/bg-blue-50 py-2/g, 'bg-gray-50 py-2 border-y border-gray-100');
    content = content.replace(/bg-teal-50 py-2/g, 'bg-gray-50 py-2 border-y border-gray-100');
    content = content.replace(/bg-gradient-to-r from-blue-100 to-blue-50/g, 'bg-gray-50/50');
    
    // General cleanup
    content = content.replace(/font-extrabold/g, 'font-semibold');
    content = content.replace(/shadow-lg/g, 'shadow-sm');
    
    // Reset background and text color for minimalist buttons
    content = content.replace(/text-white/g, 'text-gray-100');
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed more UI in', filePath);
}

fixUI('src/app/pages/AdminPage.tsx');
fixUI('src/app/pages/EmployeePage.tsx');

