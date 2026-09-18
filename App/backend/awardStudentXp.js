/**
 * Adds experience points to a student.
 *
 * @param {object} student Student object to update.
 * @param {number} amount Number of XP to award.
 * @returns {object} The updated student.
 */
function awardStudentXp(student, amount) {
	if (!student || typeof student !== 'object') {
		throw new TypeError('A student object is required.');
	}

	if (!Number.isFinite(amount) || amount < 0) {
		throw new TypeError('XP amount must be a non-negative number.');
	}

	const currentXp = student.xp == null ? 0 : Number(student.xp);

	if (!Number.isFinite(currentXp) || currentXp < 0) {
		throw new TypeError('Student XP must be a non-negative number.');
	}

	student.xp = currentXp + amount;
	return student;
}

module.exports = awardStudentXp;
