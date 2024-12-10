// Global grade and workload translations
window.gradeTranslations = {
    "6.0": "A/6.0",
    "5.5": "B/5.5",
    "5.0": "C/5.0",
    "4.5": "D/4.5",
    "4.0": "E/4.0",
    "3.5": "Failed",
  };
  
  window.workloadTranslations = {
    "1": "Walk in the Park",
    "2": "Manageable",
    "3": "Moderate Effort",
    "4": "Challenging",
    "5": "Pain and Suffering",
  };

  // Semester translation function
window.translateSemester = function (semesterNumber) {
    if (typeof semesterNumber !== "number" || semesterNumber < 1) {
      return "Invalid Semester";
    }
  
    const baseYear = 2024; // Starting year for the semester sequence
    const isSpring = semesterNumber % 2 !== 0; // Odd numbers are spring (FS), even are fall (HS)
    const offset = Math.floor((semesterNumber - 1) / 2); // Number of full years offset from baseYear
  
    const year = baseYear + offset;
    const season = isSpring ? "FS" : "HS";
  
    return `${season}${year % 100}`; // Format as FS/HS + last two digits of the year
  };