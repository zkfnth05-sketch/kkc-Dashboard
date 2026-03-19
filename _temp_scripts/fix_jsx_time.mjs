
import fs from 'fs';
const path = 'src/components/EventManagementPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix JSX time display in list (remove empty parens if time is empty)
content = content.replace(
    /\{e\.startTime !== '10:00' \? `\(\$\{e\.startTime\}\)` : ''\}/g,
    "{e.startTime ? `(${e.startTime})` : ''}"
);
content = content.replace(
    /\{e\.endTime !== '18:00' \? `\(\$\{e\.endTime\}\)` : ''\}/g,
    "{e.endTime ? `(${e.endTime})` : ''}"
);

// Fix JSX time display in modal (remove empty parens if time is empty)
content = content.replace(
    /\{viewEvent\.startDate\} \(\{viewEvent\.startTime\}\)/g,
    "{viewEvent.startDate} {viewEvent.startTime ? `(${viewEvent.startTime})` : ''}"
);
content = content.replace(
    /\{viewEvent\.endDate \|\| viewEvent\.startDate\} \(\{viewEvent\.endTime\}\)/g,
    "{viewEvent.endDate || viewEvent.startDate} {viewEvent.endTime ? `(${viewEvent.endTime})` : ''}"
);

fs.writeFileSync(path, content, 'utf8');
console.log("JSX Time display improved!");
