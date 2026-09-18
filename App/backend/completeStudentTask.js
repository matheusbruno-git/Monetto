/**
 * Marks a student's task as completed.
 *
 * The function mutates the supplied student object and returns it, making it
 * usable with both an in-memory store and a persistence layer.
 *
 * @param {object} student Student containing a `tasks` array.
 * @param {string|number} taskId Id of the task to complete.
 * @returns {object} The updated student.
 */
function completeStudentTask(student, taskId) {
	if (!student || typeof student !== 'object') {
		throw new TypeError('A student is required.');
	}

	if (!Array.isArray(student.tasks)) {
		throw new TypeError('The student must contain a tasks array.');
	}

	const task = student.tasks.find((item) =>
		item && String(item.id) === String(taskId)
	);

	if (!task) {
		throw new Error(`Task ${taskId} was not found for this student.`);
	}

	task.completed = true;
	task.completedAt = new Date().toISOString();

	return student;
}

module.exports = completeStudentTask;
module.exports.completeStudentTask = completeStudentTask;
