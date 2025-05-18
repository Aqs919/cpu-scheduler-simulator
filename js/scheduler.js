// js/scheduler.js

/**
 * Implements the First-Come, First-Served (FCFS) scheduling algorithm.
 * FCFS sorts jobs by arrival time and executes them in that order.
 * @param {Array<Object>} jobs - An array of job objects with id, arrivalTime, burstTime, originalBurstTime, initialPriority.
 * @returns {Array<Object>} A schedule array, e.g., [{ jobId: 'Job 1', startTime: 0, endTime: 10, originalJob: {...} }, ...].
 */
function fcfs(jobs) {
    // FCFS requires sorting by arrival time
    const sortedJobs = [...jobs].sort((a, b) => a.arrivalTime - b.arrivalTime);

    const schedule = [];
    let currentTime = 0;

    sortedJobs.forEach(job => {
        // If the CPU is idle before the job arrives, add idle segment
        if (currentTime < job.arrivalTime) {
            schedule.push({
                jobId: 'Idle',
                startTime: currentTime,
                endTime: job.arrivalTime
            });
            currentTime = job.arrivalTime;
        }

        // Calculate start and end time for the job execution segment
        const startTime = currentTime;
        const endTime = currentTime + job.originalBurstTime; // Use originalBurstTime for total execution

        // Add the job's execution segment to the schedule
        schedule.push({
            jobId: job.id,
            startTime: startTime,
            endTime: endTime,
            originalJob: job // Store original job details
        });

        // Update current time for the next job
        currentTime = endTime;
    });

    return schedule; // Return the generated schedule
}


/**
 * Implements the Shortest Job First (SJF) Non-Preemptive scheduling algorithm.
 * SJF executes the job with the smallest burst time among those that have arrived.
 * Non-Preemptive means once a job starts, it runs to completion.
 * Tie-breaking: Burst Time (shortest first), then Arrival Time (earliest first).
 * @param {Array<Object>} jobs - An array of job objects with id, arrivalTime, burstTime, originalBurstTime, initialPriority.
 * @returns {Array<Object>} The execution schedule.
 */
function sjf(jobs) {
    // Create a copy of jobs to track remaining burst time
    const jobsToSchedule = jobs.map(job => ({ ...job, remainingBurstTime: job.originalBurstTime }));

    const schedule = [];
    const readyQueue = [];
    let currentTime = 0;
    const completedJobs = new Set();

    // Sort jobs initially by arrival time
    jobsToSchedule.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let jobIndex = 0; // To keep track of jobs arriving

    // Continue until all jobs are completed
    let safetyCounter = 0;
    const maxIterations = jobsToSchedule.length * 100; // Safety limit


    while (completedJobs.size < jobsToSchedule.length && safetyCounter < maxIterations) {
         safetyCounter++;

        // Add jobs that have arrived by the current time to the ready queue
        while (jobIndex < jobsToSchedule.length && jobsToSchedule[jobIndex].arrivalTime <= currentTime) {
            readyQueue.push(jobsToSchedule[jobIndex]);
            jobIndex++;
        }

        // If the ready queue is empty and there are still jobs to arrive,
        // advance time to the arrival of the next job
        if (readyQueue.length === 0 && completedJobs.size < jobsToSchedule.length) {
            if (jobIndex < jobsToSchedule.length) {
                const nextArrivalTime = jobsToSchedule[jobIndex].arrivalTime;
                if (currentTime < nextArrivalTime) {
                    // Add idle segment
                    schedule.push({
                        jobId: 'Idle',
                        startTime: currentTime,
                        endTime: nextArrivalTime
                    });
                    currentTime = nextArrivalTime;
                } else {
                    currentTime++;
                }
            } else {
                console.error("Scheduler stuck (SJF): Ready queue empty but not all jobs completed after all jobs arrived.");
                break;
            }

             // Re-check and add jobs that arrive at this new currentTime
             while (jobIndex < jobsToSchedule.length && jobsToSchedule[jobIndex].arrivalTime <= currentTime) {
                 readyQueue.push(jobsToSchedule[jobIndex]);
                 jobIndex++;
             }
        }

        // If the ready queue is NOT empty, select the job with the shortest remaining burst time
        if (readyQueue.length > 0) {
            // Sort the ready queue by remaining burst time (SJF criteria)
            // Tie-breaker: Arrival Time (earliest first)
            readyQueue.sort((a, b) => {
                if (a.remainingBurstTime !== b.remainingBurstTime) {
                    return a.remainingBurstTime - b.remainingBurstTime;
                }
                return a.arrivalTime - b.arrivalTime; // Tie-breaker
            });

            // Select the job at the front of the ready queue (shortest burst time)
            const jobToRun = readyQueue.shift(); // Remove from the ready queue

            // Ensure start time is not before arrival time (should be handled by idle check, but safety)
             const startTime = Math.max(currentTime, jobToRun.arrivalTime);
             const duration = jobToRun.remainingBurstTime; // Runs for its full remaining burst time
             const endTime = startTime + duration;


            // Add the execution segment to the schedule
            schedule.push({
                jobId: jobToRun.id,
                startTime: startTime,
                endTime: endTime,
                originalJob: jobToRun // Reference to the job object
            });

            // Update current time
            currentTime = endTime;

            // Mark the job as completed
            jobToRun.remainingBurstTime = 0; // It finished
            completedJobs.add(jobToRun.id); // Add job ID to the set of completed jobs

        } else {
             if (completedJobs.size < jobsToSchedule.length && jobIndex === jobsToSchedule.length) {
                 console.warn("SJF: Ready queue is empty, all jobs have arrived, but not all completed. Check for 0 burst time jobs or logic errors.");
                 break;
             }
        }
    }

     if (safetyCounter >= maxIterations) {
         console.error("SJF Scheduler might be in an infinite loop. Exiting after max iterations.");
     }

    // Sort the schedule by start time
     schedule.sort((a, b) => a.startTime - b.startTime);

    return schedule; // Return the generated schedule
}


/**
 * Implements the Non-Preemptive Priority (NPP) scheduling algorithm.
 * NPP executes the job with the highest priority among those that have arrived.
 * Non-Preemptive means once a job starts, it runs to completion.
 * Tie-breaking: Priority (lower number = higher priority), then Arrival Time (earlier first).
 * @param {Array<Object>} jobs - An array of job objects with id, arrivalTime, burstTime, originalBurstTime, initialPriority.
 * @returns {Array<Object>} The execution schedule.
 */
function npp(jobs) {
    // Create a copy of jobs
    const jobsToSchedule = jobs.map(job => ({ ...job }));

    const schedule = [];
    const readyQueue = [];
    let currentTime = 0;
    const completedJobs = new Set();

    // Sort jobs initially by arrival time
    jobsToSchedule.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let jobIndex = 0; // To keep track of jobs arriving

    // Continue until all jobs are completed
    let safetyCounter = 0;
    const maxIterations = jobsToSchedule.length * 100; // Safety limit


    while (completedJobs.size < jobsToSchedule.length && safetyCounter < maxIterations) {
         safetyCounter++;

        // Add jobs that have arrived by the current time to the ready queue
        while (jobIndex < jobsToSchedule.length && jobsToSchedule[jobIndex].arrivalTime <= currentTime) {
            readyQueue.push(jobsToSchedule[jobIndex]);
            jobIndex++;
        }

        // If the ready queue is empty and there are still jobs to arrive,
        // advance time to the arrival of the next job
        if (readyQueue.length === 0 && completedJobs.size < jobsToSchedule.length) {
            if (jobIndex < jobsToSchedule.length) {
                const nextArrivalTime = jobsToSchedule[jobIndex].arrivalTime;
                if (currentTime < nextArrivalTime) {
                    // Add idle segment
                    schedule.push({
                        jobId: 'Idle',
                        startTime: currentTime,
                        endTime: nextArrivalTime
                    });
                    currentTime = nextArrivalTime;
                } else {
                    currentTime++;
                }
            } else {
                console.error("Scheduler stuck (NPP): Ready queue empty but not all jobs completed after all jobs arrived.");
                break;
            }

             // Re-check and add jobs that arrive at this new currentTime
             while (jobIndex < jobsToSchedule.length && jobsToSchedule[jobIndex].arrivalTime <= currentTime) {
                 readyQueue.push(jobsToSchedule[jobIndex]);
                 jobIndex++;
             }
        }

        // If the ready queue is NOT empty, select the job based on NPP criteria
        if (readyQueue.length > 0) {
            // Sort the ready queue by Priority (ascending - lower number is higher priority)
            // Tie-breaking: Arrival Time (earliest first)
            readyQueue.sort((a, b) => {
                if (a.initialPriority !== b.initialPriority) {
                    return a.initialPriority - b.initialPriority; // Sort by priority
                }
                return a.arrivalTime - b.arrivalTime; // Sort by arrival time for tie-breaker
            });

            // Select the job at the front of the ready queue (highest priority)
            const jobToRun = readyQueue.shift(); // Remove from the ready queue

             // Ensure start time is not before arrival time
             const startTime = Math.max(currentTime, jobToRun.arrivalTime);
             const duration = jobToRun.originalBurstTime; // Runs for its full original burst time
             const endTime = startTime + duration;


            // Add the execution segment to the schedule
            schedule.push({
                jobId: jobToRun.id,
                startTime: startTime,
                endTime: endTime,
                originalJob: jobToRun // Reference to the job object
            });

            // Update current time
            currentTime = endTime;

            // Mark the job as completed
            completedJobs.add(jobToRun.id); // Add job ID to the set of completed jobs

        } else {
             if (completedJobs.size < jobsToSchedule.length && jobIndex === jobsToSchedule.length) {
                 console.warn("NPP: Ready queue is empty, all jobs have arrived, but not all completed. Check for 0 burst time jobs or logic errors.");
                 break;
             }
        }
    }

     if (safetyCounter >= maxIterations) {
         console.error("NPP Scheduler might be in an infinite loop. Exiting after max iterations.");
     }


    // Sort the schedule by start time
     schedule.sort((a, b) => a.startTime - b.startTime);

    return schedule; // Return the generated schedule
}


/**
 * Implements the Standard Preemptive Priority (PP) scheduling algorithm.
 * Schedules based on priority, preempting lower-priority jobs when HIGHER-priority ones arrive.
 * Tie-breaking: Priority (lower number = higher priority), then Arrival Time (earlier first).
 * @param {Array<Object>} jobs - An array of job objects with id, arrivalTime, burstTime, originalBurstTime, initialPriority.
 * @returns {Array<Object>} The execution schedule.
 */
function pp(jobs) {
    // Create a copy of jobs to track remaining burst time
    const jobsToSchedule = jobs.map(job => ({ ...job, remainingBurstTime: job.originalBurstTime }));

    const schedule = [];
    const readyQueue = []; // Jobs that have arrived and are waiting/interrupted
    let currentTime = 0;
    const completedJobs = new Set();
    let currentlyRunningJob = null;
    let lastExecutedJobId = null; // To help track segments for merging later

    // Sort jobs by arrival time to manage arrivals
    jobsToSchedule.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let jobIndex = 0; // To keep track of jobs arriving

    // Continue until all jobs are completed
    let safetyCounter = 0;
    const maxIterations = jobsToSchedule.length * 1000; // Higher safety limit for preemptive


    while (completedJobs.size < jobsToSchedule.length && safetyCounter < maxIterations) {
         safetyCounter++;

         // --- Check for Job Arrivals and add to Ready Queue ---
         while (jobIndex < jobsToSchedule.length && jobsToSchedule[jobIndex].arrivalTime <= currentTime) {
             const arrivedJob = jobsToSchedule[jobIndex];
             readyQueue.push(arrivedJob); // Add to ready queue
             jobIndex++;
         }

         // --- Select the Highest Priority Job from Ready Queue + Running Job ---

         let highestPriorityJob = null;

         // Combine currently running job (if any with remaining time) and ready queue for selection
         const eligibleJobs = currentlyRunningJob && currentlyRunningJob.remainingBurstTime > 0 ? [...readyQueue, currentlyRunningJob] : [...readyQueue];

         // Sort eligible jobs by Priority (ascending - lower number is higher priority)
         // Tie-breaking: Arrival Time (earliest first)
          eligibleJobs.sort((a, b) => {
              if (a.initialPriority !== b.initialPriority) {
                  return a.initialPriority - b.initialPriority;
              }
              return a.arrivalTime - b.arrivalTime;
          });

          // The highest priority job ready or running is at the front of this sorted list
          if (eligibleJobs.length > 0) {
               highestPriorityJob = eligibleJobs[0];
          }


         // --- Decide what happens at this time tick ---

         // Case 1: CPU is idle or needs a new job (currentlyRunningJob is null or a preemption just happened)
         if (!currentlyRunningJob) {
             if (highestPriorityJob) {
                 // Dispatch the highest priority job
                 currentlyRunningJob = highestPriorityJob;
                 // Remove from ready queue (it was in eligibleJobs list, need to remove from readyQueue array)
                  const readyIndex = readyQueue.findIndex(j => j.id === currentlyRunningJob.id);
                  if(readyIndex > -1) {
                      readyQueue.splice(readyIndex, 1);
                  }

                 // Record the start of the new segment
                 schedule.push({
                     jobId: currentlyRunningJob.id,
                     startTime: currentTime,
                     endTime: -1, // Placeholder, will be set on preemption or completion
                     originalJob: currentlyRunningJob
                 });
                 lastExecutedJobId = currentlyRunningJob.id;

             } else {
                 // No job ready, CPU is idle. Advance time until the next arrival.
                 if (jobIndex < jobsToSchedule.length) {
                     const nextArrival = jobsToSchedule[jobIndex].arrivalTime;
                     if (currentTime < nextArrival) {
                         // Add idle segment
                         schedule.push({
                             jobId: 'Idle',
                             startTime: currentTime,
                             endTime: nextArrival
                         });
                         currentTime = nextArrival;
                     } else {
                         currentTime++;
                     }
                 } else {
                     // No more jobs to arrive, ready queue empty, no job running - must be finished
                     if (completedJobs.size < jobsToSchedule.length) {
                         console.warn("PP: Stuck in idle, but not all jobs completed.");
                     }
                     break; // Exit loop
                 }
                 continue; // Skip to next iteration to process arrival at new time
             }
         }
         // Case 2: A job is currently running
         else {
             // Check for preemption: Is the highest priority eligible job different and higher priority?
             if (highestPriorityJob && currentlyRunningJob.id !== highestPriorityJob.id && highestPriorityJob.initialPriority < currentlyRunningJob.initialPriority) {
                 // Preemption occurs!
                 // Record the end of the running job's segment
                 const lastSegment = schedule.findLast(s => s.jobId === currentlyRunningJob.id);
                  if (lastSegment && lastSegment.endTime === -1) { // Only set if not already set
                     lastSegment.endTime = currentTime;
                  }

                 // Add the interrupted job back to the ready queue
                 readyQueue.push(currentlyRunningJob);

                 // Dispatch the new highest priority job
                 currentlyRunningJob = highestPriorityJob;
                 // Remove from ready queue (it was in eligibleJobs list, need to remove from readyQueue array)
                  const readyIndex = readyQueue.findIndex(j => j.id === currentlyRunningJob.id);
                   if(readyIndex > -1) {
                       readyQueue.splice(readyIndex, 1);
                   }

                 // Record the start of the new segment
                 schedule.push({
                     jobId: currentlyRunningJob.id,
                     startTime: currentTime,
                     endTime: -1, // Placeholder
                     originalJob: currentlyRunningJob
                 });
                 lastExecutedJobId = currentlyRunningJob.id;

             } else {
                 // No preemption needed or possible. Continue running the current job.
                 // This is the implicit "run" step if no preemption happens.
             }
         }

         // --- Execute for One Time Tick ---
         // If a job is currently running, decrement its remaining burst time and advance time by 1 tick
         if (currentlyRunningJob && currentlyRunningJob.remainingBurstTime > 0) {
             currentlyRunningJob.remainingBurstTime--;
             currentTime++;

             // Check if the job finished in this tick
             if (currentlyRunningJob.remainingBurstTime === 0) {
                 completedJobs.add(currentlyRunningJob.id);
                 // Set the end time of the segment that just finished
                 const lastSegment = schedule.findLast(s => s.jobId === currentlyRunningJob.id);
                  if (lastSegment && lastSegment.endTime === -1) { // Only set if not already set
                     lastSegment.endTime = currentTime;
                  }
                 currentlyRunningJob = null; // CPU is now free
             }
         } else if (currentlyRunningJob === null && completedJobs.size < jobsToSchedule.length) {
             // CPU was idle in this tick (waited for arrival or next job)
             // currentTime was advanced earlier if needed, or will advance by 1 below if no jump occurred
             // No action needed here for idle time segment creation, the gaps represent it.
             currentTime++; // Advance time by 1 tick if nothing ran but simulation continues
         } else {
             // Should not reach here if logic is correct and jobs exist
             currentTime++; // Advance time by 1 tick as a fallback
         }


         // Safety check for infinite loops
          if (safetyCounter >= maxIterations) {
             console.error("PP Scheduler might be in an infinite loop. Exiting after max iterations.");
             break;
         }
    }

    // --- Post-processing the schedule to merge contiguous segments ---
    // The tick-by-tick simulation can create consecutive segments. Merge them.
    const mergedSchedule = [];
    if (schedule.length > 0) {
        // Ensure schedule is sorted by start time before merging
         schedule.sort((a, b) => a.startTime - b.startTime);

        let currentSegment = { ...schedule[0] };

        for (let i = 1; i < schedule.length; i++) {
            const nextSegment = schedule[i];

            // Check if the next segment is for the same job and starts immediately after the current one ends
            if (nextSegment.jobId === currentSegment.jobId && nextSegment.startTime === currentSegment.endTime) {
                // Merge the segments: extend the current segment's end time
                currentSegment.endTime = nextSegment.endTime;
            } else {
                // If not contiguous or a different job, push the current merged segment and start a new one
                mergedSchedule.push(currentSegment);
                currentSegment = { ...nextSegment };
            }
        }
        // Push the last current segment after the loop finishes
        mergedSchedule.push(currentSegment);
    }

    // Ensure final merged schedule is sorted by start time
     mergedSchedule.sort((a, b) => a.startTime - b.startTime);


    return mergedSchedule; // Return the generated and merged schedule
}


/**
 * Runs the selected CPU scheduling algorithm.
 * @param {Array<Object>} jobs - An array of job objects.
 * @param {string} algorithmName - The name of the algorithm to run (e.g., 'FCFS', 'SJF', 'NPP', 'PP').
 * @returns {Array<Object>|null} The execution schedule or null if the algorithm is not found.
 */
export function run(jobs, algorithmName) {
    if (!jobs || jobs.length === 0) {
        console.warn("No jobs to schedule.");
        return []; // Return an empty schedule if no jobs
    }

    // Ensure jobs have necessary original properties and create a deep copy
    const jobsForScheduling = jobs.map(job => ({
         ...job, // Copy existing properties (id, arrivalTime, burstTime, priority)
         originalBurstTime: job.burstTime, // Store original burst time for metrics
         initialPriority: job.priority, // Store original priority
         // Add any other properties needed by algorithms here
    }));


    console.log(`Running algorithm: ${algorithmName}`);

    let schedule = [];

    switch (algorithmName) {
        case 'FCFS':
            schedule = fcfs(jobsForScheduling);
            break;
        case 'SJF':
            schedule = sjf(jobsForScheduling);
            break;
        case 'NPP':
            schedule = npp(jobsForScheduling);
            break;
        case 'PP': // <-- Call the standard PP function
            schedule = pp(jobsForScheduling);
            break;
        default:
            console.error(`Unknown algorithm: ${algorithmName}`);
            return null; // Indicate an unknown algorithm
    }

    // After scheduling, ensure the schedule contains originalJob references
     schedule.forEach(segment => {
         if (!segment.originalJob) {
             const originalJob = jobsForScheduling.find(j => j.id === segment.jobId);
             if (originalJob) {
                 segment.originalJob = originalJob;
             } else {
                  console.warn(`Original job data not found for scheduled segment ${segment.jobId}`);
             }
         }
     });


    return schedule; // Return the generated schedule
}