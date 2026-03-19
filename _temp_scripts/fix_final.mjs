
import fs from 'fs';
const path = 'src/components/EventManagementPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Final check for organizer fallback in detail modal
content = content.replace(
    /viewEvent\.organizer && !viewEvent\.organizer\.includes\('미지정'\)\) \? viewEvent\.organizer : '\(사\)한국애견협회'\}/g,
    "viewEvent.organizer && !viewEvent.organizer.includes('미지정')) ? viewEvent.organizer : ''}"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Final UI fallback fixed!");
