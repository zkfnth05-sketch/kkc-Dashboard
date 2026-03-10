
import fs from 'fs';

function patch(path) {
    let content = fs.readFileSync(path, 'utf8');

    // 1. normalizeTime: return '' if 00:00 or empty
    content = content.replace(
        /const normalizeTime = \(t: string, fallback: string\) => \{[\s\S]*?return t\.substring\(0, 5\);[\s\S]*?\};/g,
        `const normalizeTime = (t: string) => {
                    if (!t || t.trim() === '' || t.substring(0, 5) === '00:00') return '';
                    return t.substring(0, 5);
                };`
    );

    // 2. Adjust calls to normalizeTime (remove fallbacks)
    content = content.replace(/normalizeTime\((.*?), '10:00'\)/g, "normalizeTime($1)");
    content = content.replace(/normalizeTime\((.*?), '18:00'\)/g, "normalizeTime($1)");

    // 3. Organizer/Venue: remove "미지정" strings and fallback
    content = content.replace(/const organizer = \(organizerRaw === '주최 미지정'[\s\S]*? : organizerRaw;/g,
        "const organizer = (organizerRaw && !organizerRaw.includes('미지정')) ? organizerRaw : '';");
    content = content.replace(/const venue = \(venueRaw === '장소 미지정'[\s\S]*? : venueRaw;/g,
        "const venue = (venueRaw && !venueRaw.includes('미지정')) ? venueRaw : '';");

    // 4. Update JSX fallbacks in EventManagementPage if they exist
    content = content.replace(/\|\| '\(사\)한국애견협회'/g, "|| ''");
    content = content.replace(/\|\| '\(장소 협의중\)'/g, "|| ''");
    content = content.replace(/\|\| '장소 정보 없음'/g, "|| ''");
    content = content.replace(/\(장소 협의중\)/g, "");
    content = content.replace(/\(정보 협의중\)/g, "");

    fs.writeFileSync(path, content, 'utf8');
}

patch('src/components/EventManagementPage.tsx');
patch('src/components/CompetitionManagementPage.tsx');
console.log("Empty state patch applied!");
