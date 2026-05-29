/**
 * Calculates age in years based on the provided birthday date string.
 * @param {string|Date} birthdayDate - Date string (YYYY-MM-DD) or Date object
 * @returns {number} The calculated age
 */
function calculateAge(birthdayDate) {
  if (!birthdayDate) return 0;
  
  const birthDate = new Date(birthdayDate);
  // Check for invalid date
  if (isNaN(birthDate.getTime())) {
    throw new Error('Invalid birthday date format');
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if current month/day is before the birthday
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : 0;
}

module.exports = {
  calculateAge
};
