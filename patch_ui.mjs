
import fs from 'fs';
const path = 'src/components/EventManagementPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix card venue
content = content.replace(
    /\{e\.venue \|\| '장소 미지정'\}/g,
    "{e.venue && !e.venue.includes('미지정') ? e.venue : '(장소 협의중)'}"
);

// Fix detail modal venue
content = content.replace(
    /\{viewEvent\.venue\}/g,
    "{(viewEvent.venue && !viewEvent.venue.includes('미지정')) ? viewEvent.venue : '(장소 협의중)'}"
);

// Fix detail modal organizer
content = content.replace(
    /\{viewEvent\.organizer \|\| '\(사\)한국애견협회'\}/g,
    "{(viewEvent.organizer && !viewEvent.organizer.includes('미지정')) ? viewEvent.organizer : '(사)한국애견협회'}"
);

fs.writeFileSync(path, content, 'utf8');
console.log("File updated via script!");
