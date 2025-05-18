// js/ganttRenderer.js

// Get references to the Gantt chart and Timeline containers
const ganttChartBar = document.querySelector('.gantt-chart-bar');
const timelineBar = document.querySelector('.timeline-bar');


/**
 * Renders the Gantt chart and timeline based on the execution schedule and original job data.
 * @param {Array<Object>} schedule - The schedule array from the scheduler.
 * @param {Array<Object>} originalJobs - The original array of job objects from jobManager.js.
 */
export function renderGanttChart(schedule, originalJobs) {
    if (!ganttChartBar || !timelineBar) {
        console.error("Gantt chart or timeline elements not found.");
        return;
    }

    // --- Clear previous content ---
    ganttChartBar.innerHTML = '';
    timelineBar.innerHTML = ''; // Assuming timeline is cleared here if its logic is separate


    // --- Calculate Total Time and Scaling for Gantt Chart ---
    // Find the latest point in time across schedule end times
    const maxScheduleTime = schedule.length > 0 ? Math.max(...schedule.map(segment => segment.endTime)) : 0;
     // Consider the latest arrival time for scaling the overall bar width if needed,
     // though idle time handling should cover gaps before the first job.
    const maxArrivalTime = originalJobs.length > 0 ? Math.max(...originalJobs.map(job => job.arrivalTime)) : 0;

    // Determine the total time represented on the gantt chart (end of the last scheduled item)
    const totalTime = maxScheduleTime; // Gantt chart ends when the last job finishes


    if (totalTime <= 0 && schedule.length > 0) {
         console.warn("Total simulation time is zero or negative, cannot render meaningful Gantt chart.");
    } else if (totalTime <= 0 && schedule.length === 0) {
         console.log("No schedule to render for Gantt chart.");
         ganttChartBar.style.width = '100%'; // Reset width if empty
         // Note: Timeline rendering below still uses originalJobs
    }

    // Define a scaling factor (pixels per time unit) - ADJUSTED AGAIN
    const pixelsPerTimeUnit = 15; // Adjust value as needed


    const totalPixelWidth = totalTime * pixelsPerTimeUnit;
// No Math.max needed here. The width is strictly based on time and scale.
const ganttChartPixelWidth = totalPixelWidth;

ganttChartBar.style.width = `${ganttChartPixelWidth}px`;
// Ensure timeline also matches this strict width
timelineBar.style.width = `${ganttChartPixelWidth}px`;


    // --- Map job IDs and Idle to colors ---
    const blockColors = {
        'FCFS': '#2e86de',
        'SJF': '#e74c3c',
        'NPP': '#f1c40f',
        'PP': '#27ae60',
        'Job 1': '#2e86de',
        'Job 2': '#e74c3c',
        'Job 3': '#f1c40f',
        'Job 4': '#27ae60',
        'Job 5': '#9b59b6',
        'Job 6': '#3498db',
        'Job 7': '#e67e22',
        'Job 8': '#2ecc71',
        'Job 9': '#e74c3c',
        'Job 10': '#f1c40f',
        'Idle': '#7f8c8d' // Grey color for idle time
    };


    // --- Render Gantt Chart Blocks (including Idle time) ---
    let currentRenderTime = 0;

    // Sort the schedule by start time to process segments in order
    // Also need to handle initial idle time before the first job arrives/starts
    const sortedSchedule = [...schedule].sort((a, b) => a.startTime - b.startTime);

    // Handle potential idle time before the first scheduled segment
    const firstSegmentStartTime = sortedSchedule.length > 0 ? sortedSchedule[0].startTime : 0;
     if (firstSegmentStartTime > 0) {
         const idleStartTime = 0;
         const idleEndTime = firstSegmentStartTime;
         const idleDuration = idleEndTime - idleStartTime;
         const idleWidth = idleDuration * pixelsPerTimeUnit;
         const idleLeft = 0;

         // Only render if idle duration is positive
         if (idleDuration > 0) {
             const idleBlock = document.createElement('div');
             idleBlock.classList.add('gantt-idle-block');

             idleBlock.style.backgroundColor = blockColors['Idle'];
             idleBlock.style.left = `${idleLeft}px`;
             idleBlock.style.width = `${idleWidth}px`;
             idleBlock.style.minWidth = '5px'; // Ensure visibility

             // Display 'I' above and the end time of the idle period below
             idleBlock.innerHTML = `
                 <span class="block-label">I</span>
                 <span class="block-time">${idleEndTime}</span>
             `;

             ganttChartBar.appendChild(idleBlock);
             currentRenderTime = idleEndTime; // Update current time after initial idle
         }
     }


    sortedSchedule.forEach(segment => {
        const segmentStartTime = segment.startTime;
        const segmentEndTime = segment.endTime;
        const segmentDuration = segmentEndTime - segmentStartTime;

        // --- Render Idle Time between segments ---
        // If there is a gap between the current render time and the segment's start time, render an idle block
        // Only check if segmentStartTime is greater than currentRenderTime (already handled initial idle)
        if (segmentStartTime > currentRenderTime) {
            const idleStartTime = currentRenderTime;
            const idleEndTime = segmentStartTime;
            const idleDuration = idleEndTime - idleStartTime;
            const idleWidth = idleDuration * pixelsPerTimeUnit;
            const idleLeft = idleStartTime * pixelsPerTimeUnit;

             // Only render if idle duration is positive
             if (idleDuration > 0) {
                 const idleBlock = document.createElement('div');
                 idleBlock.classList.add('gantt-idle-block');

                 idleBlock.style.backgroundColor = blockColors['Idle'];
                 idleBlock.style.left = `${idleLeft}px`;
                 idleBlock.style.width = `${idleWidth}px`;
                 idleBlock.style.minWidth = '5px';

                 // Display 'I' above and the end time of the idle period below
                 idleBlock.innerHTML = `
                     <span class="block-label">I</span>
                     <span class="block-time">${idleEndTime}</span>
                 `;

                 ganttChartBar.appendChild(idleBlock);
             }
        }

        // --- Render Job Segment ---
         if (segmentDuration > 0) { // Only render job blocks for positive duration
             const segmentWidth = segmentDuration * pixelsPerTimeUnit;
             const segmentLeft = segmentStartTime * pixelsPerTimeUnit;

             const jobBlock = document.createElement('div');
             jobBlock.classList.add('gantt-job-block');

             // Use job ID for color mapping
             jobBlock.style.backgroundColor = blockColors[segment.jobId] || '#666';
             jobBlock.style.left = `${segmentLeft}px`;
             jobBlock.style.width = `${segmentWidth}px`;
             jobBlock.style.minWidth = '5px';

             const jobIdNumber = segment.jobId.replace('Job ', '');
             // Display Job ID (P#) above and the end time of the segment below
             jobBlock.innerHTML = `
                 <span class="block-label">P${jobIdNumber}</span>
                 <span class="block-time">${segmentEndTime}</span>
             `;

             ganttChartBar.appendChild(jobBlock);
         }

        // Update the current render time to the end of the current segment
        currentRenderTime = segmentEndTime;
    });

    // --- Render Timeline Markers (based on original jobs and arrival times) ---
    // Assuming the timeline rendering logic remains separate and uses originalJobs
    // as per your instruction not to alter the timeline part in this step.

    // If timeline rendering is still in this function, ensure it uses originalJobs
    // and its layout is handled by CSS as you prefer.
    // Example (keeping previous timeline logic based on your file and instruction):
     const sortedOriginalJobs = [...originalJobs].sort((a, b) => a.arrivalTime - b.arrivalTime);


    sortedOriginalJobs.forEach(job => {
        const marker = document.createElement('div');
        marker.classList.add('timeline-marker');

        const jobIdNumber = job.id.replace('Job ', '');
        marker.innerHTML = `
            <span class="timeline-job-id">P${jobIdNumber}</span>
            <span class="timeline-arrival-time">AT: ${job.arrivalTime}</span>
        `;

        // Set background color based on job ID (same as Gantt chart)
        marker.style.backgroundColor = blockColors[job.id] || '#555';
        marker.style.color = 'white';

        timelineBar.appendChild(marker);
    });


    console.log(`Gantt chart (with idle time and end times) and Timeline rendered.`);
}