import fs from 'fs';
import path from 'path';

let proctorRulesPromise = null;

export const loadProctorRules = () => {
    if (!proctorRulesPromise) {
        proctorRulesPromise = (async () => {
            try {
                const rulesPath = path.resolve('shared/constants/proctorRules.json');
                const fileContent = await fs.promises.readFile(rulesPath, 'utf8');
                return JSON.parse(fileContent);
            } catch (error) {
                console.error("Failed to load proctorRules.json. Using fallback rules.", error.message);
                return {
                    "TAB_SWITCH": 10,
                    "FULLSCREEN_EXIT": 10,
                    "NO_FACE": 20,
                    "MULTIPLE_FACES": 30,
                    "MIC_NOISE": 5
                };
            }
        })();
    }
    return proctorRulesPromise;
};
