const Diamond = require('./diamond')
const Lunar = require('./lunar')

// const DiamondInstance = new Diamond()
// const LunarInstance = new Lunar({foc_date:'10/1/2023 12:00:00 AM'})

// Check command-line arguments
const args = process.argv.slice(2);

let dateArg = args.find((arg, index) => arg === '--date' && index < args.length - 1);
let dateValue = dateArg ? args[args.indexOf(dateArg) + 1] : null;
let parsedDate = dateValue ? new Date(dateValue) : null;

function formatDateForDiamond(date) {
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function formatDateForLunar(date) {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

if (args.includes('--lunar')) {
    const lunarDate = parsedDate ? formatDateForLunar(parsedDate) : undefined;
    const lunarInstance = new Lunar(lunarDate);
    lunarInstance.run();
}

if (args.includes('--diamond')) {
    const diamondDate = parsedDate ? formatDateForDiamond(parsedDate) : undefined;
    const diamondInstance = new Diamond(diamondDate);
    diamondInstance.run();
}

if (!args.includes('--lunar') && !args.includes('--diamond')) {
    console.log("Please specify either '--diamond' or '--lunar' to run the respective scripts.");
}