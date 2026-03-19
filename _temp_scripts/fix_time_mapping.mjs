
import fs from 'fs';

function fixTimeMapping(path) {
    let content = fs.readFileSync(path, 'utf8');

    // Remove the 10:00/18:00 fallbacks in the map function
    content = content.replace(/\(sParts\[1\] \|\| '10:00:00'\)/g, "(sParts[1] || '')");
    content = content.replace(/\(eParts\[1\] \|\| '18:00:00'\)/g, "(eParts[1] || '')");

    fs.writeFileSync(path, content, 'utf8');
}

fixTimeMapping('src/components/EventManagementPage.tsx');
fixTimeMapping('src/components/CompetitionManagementPage.tsx');
console.log("Time Mapping Fallbacks Removed!");
