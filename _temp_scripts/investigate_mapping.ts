
import { fetchBridge } from './src/services/memberService';

async function analyzeMapping() {
    console.log("--- Starting Pedigree Mapping Investigation ---");

    // 1. dog_classTab 전체 가져오기
    const classesRes = await fetchBridge({
        mode: 'list',
        table: 'dog_classTab',
        limit: 1000
    });
    const dogClasses = classesRes.data || [];
    const classMap = new Map();
    dogClasses.forEach((c: any) => {
        classMap.set(c.kor_name?.trim(), c.keyy?.trim());
    });

    console.log(`Total Breeds in dog_classTab: ${dogClasses.length}`);

    // 2. dogTab에서 사용 중인 견종(dog_class) 유니크하게 가져오기
    // 실제 운영 환경이라면 수십만 건이지만, 상위 5000건 정도로 샘플링하여 조사
    const dogsRes = await fetchBridge({
        mode: 'list',
        table: 'dogTab',
        limit: 5000
    });
    const dogs = dogsRes.data || [];
    const usedBreeds = new Set();
    dogs.forEach((d: any) => {
        if (d.dog_class) usedBreeds.add(d.dog_class.trim());
    });

    console.log(`Sampled Breeds in dogTab: ${usedBreeds.size}`);

    // 3. 매핑 안 되는 견종 찾기
    const mismatches = [];
    usedBreeds.forEach((breed: any) => {
        if (!classMap.has(breed)) {
            mismatches.push(breed);
        }
    });

    if (mismatches.length > 0) {
        console.log("\n[Mismatch Found!] The following breeds in dogTab do not have a 1:1 match in dog_classTab (by kor_name):");
        mismatches.forEach(m => console.log(`- ${m}`));
    } else {
        console.log("\n[Perfect Match] All sampled breeds in dogTab match dog_classTab!");
    }
}

// analyzeMapping();
