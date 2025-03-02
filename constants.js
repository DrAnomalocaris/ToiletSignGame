// Global variables
let userGender = '';
let currentLevel = 0;
const totalLevels = 20; // Levels: 0, 1, 2
let userIP = "";
let userCountry = "";
let correctAnswers = {};  // Majority answer per question per gender
let globalCounts = {};    // Raw counts from CSV per question per gender
let punnettSquares = {};  // Preloaded HTML summary for each question
