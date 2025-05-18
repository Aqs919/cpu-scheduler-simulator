// js/metricsCalculator.js

// Get references to the metric display areas
const ttSectionValues = document.querySelector('.turnaround-time-section .metric-values');
const ttAverageSpan = document.getElementById('tt-average');
const wtSectionValues = document.querySelector('.waiting-time-section .metric-values');
const wtAverageSpan = document.getElementById('wt-average');
const cpuUtilizationBar = document.querySelector('.cpu-utilization-bar');
const cpuUtilizationPercentageSpan = document.getElementById('cpu-utilization-percentage');
const cpuUtilizationComputation = document.getElementById('cpu-utilization-computation'); // Get the new element


/**
 * Calculates and displays Turn-Around Time, Waiting Time, and CPU Utilization.
 * @param {Array<Object>} originalJobs - The original array of job objects from jobManager.js.
 * @param {Array<Object>} schedule - The execution schedule array from the scheduler.
 */
export function calculateAndDisplayMetrics(originalJobs, schedule) {
    if (!ttSectionValues || !ttAverageSpan || !wtSectionValues || !wtAverageSpan || !cpuUtilizationBar || !cpuUtilizationPercentageSpan || !cpuUtilizationComputation) {
        console.error("Metric display elements not found. Check IDs and classes.");
        return;
    }

    // Clear previous metric values and computations
    ttSectionValues.innerHTML = '';
    wtSectionValues.innerHTML = '';
    ttAverageSpan.textContent = '?';
    wtAverageSpan.textContent = '?';
    cpuUtilizationBar.style.width = '0%';
    cpuUtilizationPercentageSpan.textContent = '?';
    cpuUtilizationComputation.textContent = ''; // Clear previous computation


    if (!originalJobs || originalJobs.length === 0 || !schedule || schedule.length === 0) {
        console.warn("No job data or schedule available to calculate metrics.");
        return;
    }


    // --- Calculate Completion Times ---
    const completionTimes = {};
    schedule.forEach(segment => {
        completionTimes[segment.jobId] = segment.endTime;
    });


    // --- Calculate Turn-Around Time and Waiting Time per Job ---
    const turnaroundTimes = [];
    const waitingTimes = [];
    let totalTurnaroundTime = 0;
    let totalWaitingTime = 0;

    // Sort original jobs by their original index (Job 1, Job 2, etc.) for consistent display order
    const sortedOriginalJobs = [...originalJobs].sort((a, b) => {
        const aIndex = parseInt(a.id.replace('Job ', ''), 10);
        const bIndex = parseInt(b.id.replace('Job ', ''), 10);
        return aIndex - bIndex;
    });


    sortedOriginalJobs.forEach(job => {
        const completionTime = completionTimes[job.id] || job.arrivalTime; // If job didn't complete, use arrival time
        const turnaroundTime = completionTime - job.arrivalTime;
        const waitingTime = turnaroundTime - job.originalBurstTime; // Use originalBurstTime

        turnaroundTimes.push(turnaroundTime);
        waitingTimes.push(waitingTime);

        totalTurnaroundTime += turnaroundTime;
        totalWaitingTime += waitingTime;

        // Display individual Turn-Around Time with computation
        const ttRow = document.createElement('div');
        ttRow.classList.add('metric-row');
        ttRow.innerHTML = `${job.id.toLowerCase()} = ${completionTime} - ${job.arrivalTime} = <span class="metric-result">${turnaroundTime}</span>`;
        ttSectionValues.appendChild(ttRow);

        // Display individual Waiting Time with computation
        const wtRow = document.createElement('div');
        wtRow.classList.add('metric-row');
        wtRow.innerHTML = `${job.id.toLowerCase()} = ${turnaroundTime} - ${job.originalBurstTime} = <span class="metric-result">${waitingTime}</span>`;
        wtSectionValues.appendChild(wtRow);
    });


    // --- Calculate Average Turn-Around Time and Waiting Time ---
    const numberOfJobs = originalJobs.length;
    const averageTurnaroundTime = numberOfJobs > 0 ? (totalTurnaroundTime / numberOfJobs).toFixed(2) : 0;
    const averageWaitingTime = numberOfJobs > 0 ? (totalWaitingTime / numberOfJobs).toFixed(2) : 0;


    // --- Calculate CPU Utilization ---
    let totalBurstTimeFromTable = 0;
    originalJobs.forEach(job => {
        totalBurstTimeFromTable += job.originalBurstTime;
    });

    const totalTimeElapsed = schedule.length > 0 ? schedule[schedule.length - 1].endTime : 0;

    let cpuUtilization = 0;
    if (totalTimeElapsed > 0) {
        cpuUtilization = ((totalBurstTimeFromTable / totalTimeElapsed) * 100).toFixed(2);
    }

    // --- Display Calculated Metrics with Computation ---

    // Display Average TT computation and result
    ttAverageSpan.innerHTML = `${totalTurnaroundTime} / ${numberOfJobs} = <span class="metric-result">${averageTurnaroundTime}</span>`;

    // Display Average WT computation and result
    wtAverageSpan.innerHTML = `${totalWaitingTime} / ${numberOfJobs} = <span class="metric-result">${averageWaitingTime}</span>`;

    // Display CPU Utilization computation
    cpuUtilizationComputation.textContent = `(${totalBurstTimeFromTable} / ${totalTimeElapsed}) * 100 = ${cpuUtilization}%`;

    // Update CPU utilization bar width and percentage text
    cpuUtilizationPercentageSpan.textContent = cpuUtilization;
    cpuUtilizationBar.style.width = `${cpuUtilization}%`;


    console.log("Metrics Calculated and Displayed with computations.");
}