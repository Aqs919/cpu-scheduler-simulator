// js/jobManager.js

/**
 * Reads job data from the HTML table inputs.
 * @returns {Array<Object>} An array of job objects, each with id, arrivalTime, burstTime, and priority.
 */
export function readJobs() {
    const jobTableBody = document.getElementById('job-table-body');
    const rows = jobTableBody.querySelectorAll('tr');
    const jobs = [];
    let isValid = true; // Flag to check if all inputs are valid

    rows.forEach((row, index) => {
        // Select the input fields within the current row
        const inputs = row.querySelectorAll('input[type="number"]');
        const arrivalTimeInput = inputs[0];
        const burstTimeInput = inputs[1];
        const priorityInput = inputs[2];

        // Read and parse the values
        const arrivalTime = parseInt(arrivalTimeInput.value, 10);
        const burstTime = parseInt(burstTimeInput.value, 10);
        const priority = parseInt(priorityInput.value, 10);

        // Simple validation: Check if values are valid numbers and burst time is at least 1
        if (isNaN(arrivalTime) || isNaN(burstTime) || isNaN(priority) || burstTime <= 0) {
            isValid = false; // Mark as invalid if any input in this row is problematic
            // Optional: Add some visual feedback to the user about the invalid row
            arrivalTimeInput.style.borderColor = isNaN(arrivalTime) ? 'red' : '';
            burstTimeInput.style.borderColor = (isNaN(burstTime) || burstTime <= 0) ? 'red' : '';
            priorityInput.style.borderColor = isNaN(priority) ? 'red' : '';
            console.error(`Invalid input for Job ${index + 1}`);
            return; // Skip this row if invalid
        } else {
             // Reset border color if previously marked as invalid
             arrivalTimeInput.style.borderColor = '';
             burstTimeInput.style.borderColor = '';
             priorityInput.style.borderColor = '';
        }


        // Create a job object
        const job = {
            id: `Job ${index + 1}`, // Use index + 1 for job ID
            arrivalTime: arrivalTime,
            burstTime: burstTime,
            priority: priority,
            // You might add originalBurstTime here if needed for metrics later
            originalBurstTime: burstTime
        };

        jobs.push(job);
    });

    if (!isValid) {
        // If any row had invalid input, return null or throw an error
        console.error("Job data contains invalid inputs. Please correct them.");
        return null; // Indicate failure to read valid data
    }


    return jobs; // Return the array of valid job objects
}